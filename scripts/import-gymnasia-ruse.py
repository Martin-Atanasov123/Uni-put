#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
РУО Русе (прием след VII клас) → data/gymnasia/ruse.json (същата схема като sofia/varna/burgas.json).

Източници (https://ruo.mon.bg/ruse/ucheniczi/priem-na-ucheniczi/priem-v-8-klas/):
  * Приложение № 1 към заповед РД-03-214/27.04.2026 (PDF) — държавният план-прием с колони за балообразуване:
    коеф. НВО БЕЛ, коеф. НВО М, два балообразуващи предмета от свидетелството. БЕЗ код на паралелката;
  * справки „Информация за минимален и максимален бал по паралелки“ (PDF, по етап) — с код на паралелката.
Паралелката се свързва с плана по училище + име (профил/професия), с нормализиране; при няколко кандидата формулата
се взема само ако е еднаква. Само общ мин./макс. бал (без разбивка по пол).

Скриптът сам тегли файловете. Употреба: python -I scripts/import-gymnasia-ruse.py data/gymnasia/ruse.json
"""
import sys, io, re, json, hashlib, collections, datetime as dt
import urllib.request
from urllib.parse import urljoin
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
import pdfplumber

REGION = "Русе"
BASE = "https://ruo.mon.bg"
LIST_PAGE = BASE + "/ruse/ucheniczi/priem-na-ucheniczi/priem-v-8-klas/"
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/142 Safari/537.36"}
PLAN_URL = BASE + "/ruse/files/sites/20/2026/04/%D0%BF%D1%80%D0%B8%D0%BB%D0%BE%D0%B6%D0%B5%D0%BD%D0%B8%D0%B5-1.pdf"
STAGE_WORDS = {"първи": 1, "втори": 2, "трети": 3, "четвърти": 4}
# Език на първия чужд език: 1–5 букви, завършващи на „Е“ (АЕ, НЕ, ФЕ, РЕ, ИспЕ, ЧЕ, КЕ, ЯЕ …) — без фиксиран списък
DIPLOMA = {"БЕЛ": "bel", "М": "m", "КМИТ": "kmit", "ИТ": "it", "ЧЕЗ": "chez", "ГИ": "gi", "БЗО": "bzo", "ИИ": "ii",
           "ФА": "fa", "ХООС": "hoos", "ИЦ": "ic", "ТП": "tp", "ФВС": "fvs", "МУЗ": "muz", "ЧЕ": "chez"}


def fetch(u):
    return urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=120).read()


def norm(s):
    s = re.sub(r"[„“\"'«»]", " ", str(s).lower())
    s = re.sub(r"\bс недостиг\b|\bсъс защитена[^,;]*", " ", s)
    return re.sub(r"[^а-яa-z0-9]+", " ", s).strip()


def school_code(name):
    """РУО Русе не публикува код на училището в справките → стабилен псевдо-код по нормализираното име."""
    return "r" + hashlib.md5(norm(name)[:25].encode("utf-8")).hexdigest()[:12]


def num(v):
    try:
        return float(str(v).replace(",", ".").strip())
    except ValueError:
        return None


def clean(c):
    return re.sub(r"\s+", " ", (c or "").replace("\n", " ")).strip()


def parse_plan(path_or_bytes):
    rows, school = [], None
    with pdfplumber.open(io.BytesIO(path_or_bytes)) as pdf:
        for p in pdf.pages:
            for r in (p.extract_table() or []):
                c = [clean(x) for x in r]
                if not any(c) or c[0].startswith("Общо") or c[0] in ("1", "") and c[2:4] == ["", ""] and not c[1]:
                    if c and c[0].startswith("Общо"):
                        continue
                if c[0].startswith("Общо") or not any(c[4:]):
                    continue
                if c[0]:
                    parts = [x.strip() for x in c[0].split(",")]
                    school = ", ".join(parts[2:]) if len(parts) > 2 else c[0]
                # намери „език, БЕЛ коеф., М коеф., предмет1, предмет2“ по шаблон, независимо от изместването на колоните
                idx = next((i for i, x in enumerate(c) if re.fullmatch(r"[А-Яа-я]{1,5}[Ее]", x) and i >= 9), None)
                if idx is None or school is None:
                    continue
                after = [x for x in c[idx + 1:] if x]  # празните клетки се местят между страниците
                nums = [x for x in after if re.fullmatch(r"\d", x)]
                subj = [x for x in after if re.fullmatch(r"[А-Яа-я]{1,5}[а-я]?", x)]
                if len(nums) < 2 or len(subj) < 2:
                    continue
                tail = subj
                profession = c[3] if re.fullmatch(r"\d{5,6}", c[2] or "") else c[1]
                rows.append(dict(school=school, kind="професионална" if re.fullmatch(r"\d{5,6}", c[2] or "") else "профилирана",
                                 profile=profession, bel=int(nums[0]), mat=int(nums[1]), d1=tail[0], d2=tail[1],
                                 lang=c[idx], places=num(c[8]) if c[8] else None, n=num(c[6]) if c[6] else None))
    return rows


def parse_minmax(data):
    out, stage, date = [], None, None
    with pdfplumber.open(io.BytesIO(data)) as pdf:
        head = (pdf.pages[0].extract_text() or "")[:300].lower()
        m = re.search(r"(първи|втори|трети|четвърти)\s+етап[^\d]*(\d{2})\.(\d{2})\.(\d{4})", head)
        if not m:
            return None, None, []
        stage, date = STAGE_WORDS[m.group(1)], f"{m.group(4)}-{m.group(3)}-{m.group(2)}"
        for p in pdf.pages:
            for r in (p.extract_table() or []):
                c = [clean(x) for x in r]
                if len(c) >= 6 and re.fullmatch(r"\d{4,6}", c[2]) and num(c[4]) is not None:
                    out.append(dict(place=c[0], school=c[1], class_code=c[2].lstrip("0") or "0", class_name=c[3], min_total=num(c[4]), max_total=num(c[5])))
    return stage, date, out


def formula_of(p):
    bd = [("dipl_" + DIPLOMA[t.upper()], t) for t in (p["d1"], p["d2"]) if t.upper() in DIPLOMA]
    if len(bd) != 2:
        return None
    slots = [{"alternatives": [{"key": "nvo_bel", "coef": float(p["bel"])}]}, {"alternatives": [{"key": "nvo_mat", "coef": float(p["mat"])}]}]
    slots += [{"alternatives": [{"key": k, "coef": 1.0}]} for k, _ in bd]
    raw = f"({p['bel']} * БЕЛ + {p['mat']} * МАТ) + (1 * {bd[0][1]} + 1 * {bd[1][1]})"
    return slots, raw, [t for _, t in bd]


def main():
    out_path = sys.argv[1]
    plan = parse_plan(fetch(PLAN_URL))
    print("plan rows:", len(plan))
    plan_idx = collections.defaultdict(list)
    for p in plan:
        plan_idx[norm(p["profile"])].append(p)

    page = fetch(LIST_PAGE).decode("utf-8", "replace")
    posts = list(dict.fromkeys(l for l in re.findall(r'<a[^>]+href="([^"]+/student-admission/[^"]+)"', page)))
    pdfs = []
    for l in posts:
        t = fetch(l).decode("utf-8", "replace")
        pdfs += [urljoin(BASE, f) for f in re.findall(r'href="([^"]+\.pdf)"', t, re.I) if re.search(r"RC7|rc7", f)]
    pdfs = list(dict.fromkeys(pdfs))
    print("RC7 pdfs:", len(pdfs))

    ranks, stats, classes, seen = [], collections.Counter(), {}, set()
    for u in pdfs:
        try:
            stage, date, rows = parse_minmax(fetch(u))
        except Exception as e:
            stats["pdf_error"] += 1
            continue
        if not stage or not rows:
            stats["pdf_skipped"] += 1
            continue
        year = int(date[:4])
        if (year, stage) in seen:
            continue
        seen.add((year, stage))
        stats[f"rows_{year}_{stage}"] = len(rows)
        for r in rows:
            ranks.append([year, r["class_code"], stage, school_code(r["school"]), r["class_name"], r["min_total"], None, None, r["max_total"], None, None, date])
            if year == 2026 and stage == 1:
                classes[r["class_code"]] = r
    out_classes = []
    for code, r in classes.items():
        cands = [p for p in plan_idx.get(norm(r["class_name"]), []) if norm(p["school"])[:18] in norm(r["school"]) or norm(r["school"])[:18] in norm(p["school"])]
        if not cands:  # свободно съвпадение по име на профила като подниз
            cands = [p for k, v in plan_idx.items() if k and (k in norm(r["class_name"]) or norm(r["class_name"]) in k)
                     for p in v if norm(p["school"])[:14] in norm(r["school"])]
        fs = {json.dumps(formula_of(c)[0]) if formula_of(c) else None for c in cands}
        if not cands or None in fs or len(fs) != 1:
            stats["no_formula"] += 1
            f = None
        else:
            f = formula_of(cands[0])
            stats["unique" if len(cands) == 1 else "same_formula_many"] += 1
        c0 = cands[0] if cands else None
        out_classes.append({
            "campaign_year": 2026, "region": REGION, "school_code": school_code(r["school"]), "school_name": r["school"], "district": None,
            "class_code": code, "class_name": r["class_name"], "kind": c0["kind"] if c0 else None,
            "formula_raw": f[1] if f else "няма данни", "coefficients": f[0] if f else [], "alt_formulas": None,
            "nvo_bel_coef": float(c0["bel"]) if f else None, "nvo_mat_coef": float(c0["mat"]) if f else None, "ability_exam": None,
            "diploma_subjects": f[2] if f else [], "places": int(c0["places"]) if f and len(cands) == 1 and c0["places"] else None,
            "places_m": None, "places_f": None, "quota": False, "study_form": None,
            "first_language": None, "language_mode": None,
        })
    with open(out_path, "w", encoding="utf-8") as fh:
        json.dump({"region": REGION, "generated_at": dt.date.today().isoformat(), "source": LIST_PAGE, "classes": out_classes,
                   "rankings_columns": ["campaign_year", "class_code", "stage", "school_code", "class_name", "min_total", "min_m", "min_f",
                                        "max_total", "max_m", "max_f", "published_on"],
                   "rankings": ranks}, fh, ensure_ascii=False, separators=(",", ":"))
    print(json.dumps({"classes": len(out_classes), "rankings": len(ranks), **stats}, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
