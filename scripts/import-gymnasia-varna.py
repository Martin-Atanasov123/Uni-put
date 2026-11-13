#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Парсер за приема след VII клас — РУО Варна → data/gymnasia/varna.json (същата схема като sofia.json).

Различия от София (scripts/import-gymnasia-sofia.py):
  * планът (заповед на началника на РУО, xlsx) има балообразуването в ОТДЕЛНИ колони
    (коеф. НВО БЕЛ, коеф. НВО М, способности, 2 предмета от свидетелството) и НЯМА код на паралелката;
  * справките мин./макс. бал са PDF с текстов слой (pdfplumber.extract_table), 2026: 11 колони (с мъже/жени),
    2025: 7 колони (само общо).
Паралелката се свързва с плана по код на училище + име на профила. Когато кандидатите са повече от един,
но всички имат ЕДНАКВА формула — формулата е еднозначна (местата/езикът остават NULL ако не се стесни по режим
ИИЧЕ = интензивно, РИЧЕ = разширено).

Вход (папка): plan2026.xlsx, minmax2026_<1..4>.pdf, minmax2025_<1..4>.pdf
Употреба: python -I scripts/import-gymnasia-varna.py <папка> data/gymnasia/varna.json
"""
import sys, io, os, re, json, collections, datetime as dt
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
import pandas as pd
import pdfplumber

REGION = "Варна"
LIST_URL = "https://ruo.mon.bg/varna/ucheniczi/priem-na-ucheniczi/priem-v-8-klas/"
PUBLISHED = {
    2026: {1: "2026-07-14", 2: "2026-07-21", 3: "2026-07-29", 4: "2026-08-18"},
    2025: {1: "2025-07-15", 2: "2025-07-21", 3: "2025-07-30", 4: "2025-08-06"},
}
DIPLOMA = {"БЕЛ": "bel", "М": "m", "КМИТ": "kmit", "ИТ": "it", "ЧЕЗ": "chez", "ГИ": "gi", "БЗО": "bzo", "ИИ": "ii",
           "ФА": "fa", "ХООС": "hoos", "ИЦ": "ic", "ТП": "tp", "ФВС": "fvs", "МУЗ": "muz"}
ABILITY = {"ИИ": "ii", "МУЗ": "muz", "СПО": "spo", "ФВС": "fvs", "МИФВС": "muz_fvs"}


def norm(s):
    return re.sub(r"[^а-яa-z0-9]+", " ", str(s).lower()).strip()


def num(v):
    s = str(v).strip().replace(",", ".")
    if s in ("", "nan", "None", "-"):
        return None
    try:
        return float(s)
    except ValueError:
        return None


def pdf_rankings(path):
    """Редове {school_code, class_code, class_name, min_total, min_m, min_f, max_total, max_m, max_f}."""
    out = []
    with pdfplumber.open(path) as pdf:
        for p in pdf.pages:
            for r in (p.extract_table() or []):
                if not r:
                    continue
                c = [(x or "").replace("\n", " ").strip() for x in r]
                if len(c) >= 11 and re.fullmatch(r"\d{5,6}", c[1]):
                    out.append(dict(school_code=c[1], class_code=c[3].lstrip("0") or "0", class_name=re.sub(r"\s+", " ", c[4]),
                                    min_total=num(c[5]), min_m=num(c[6]), min_f=num(c[7]),
                                    max_total=num(c[8]), max_m=num(c[9]), max_f=num(c[10])))
                elif len(c) >= 7 and re.fullmatch(r"\d{5,6}", c[1]) and re.fullmatch(r"\d{1,6}", c[3]):
                    out.append(dict(school_code=c[1], class_code=c[3].lstrip("0") or "0", class_name=re.sub(r"\s+", " ", c[4]),
                                    min_total=num(c[5]), min_m=None, min_f=None, max_total=num(c[6]), max_m=None, max_f=None))
    return out


def load_plan(path):
    df = pd.read_excel(path, header=None, dtype=str)
    h = next(i for i in range(len(df)) if "Балообразуване" in [str(x).strip() for x in df.iloc[i]])
    plan = df.iloc[h + 3:].dropna(how="all")
    plan = plan[plan[2].astype(str).str.fullmatch(r"\d{5,6}")]
    rows = []
    for _, r in plan.iterrows():
        rows.append(dict(
            school_code=str(r[2]), school_name=re.sub(r"\s+", " ", str(r[3])), kind=str(r[4]), profile=str(r[7]),
            n=num(r[8]), places=num(r[9]), form=str(r[11]), language=str(r[13]), mode=str(r[14]),
            bel=num(r[15]), mat=num(r[16]), ability=None if str(r[17]) == "nan" else str(r[17]).strip(),
            d1=None if str(r[18]) == "nan" else str(r[18]).strip(), d2=None if str(r[19]) == "nan" else str(r[19]).strip(),
        ))
    return rows


def formula_of(p):
    """(slots, formula_raw, ability, diploma[]) или None."""
    if p["bel"] is None or p["mat"] is None or not p["d1"] or not p["d2"]:
        return None
    nvo = [("nvo_bel", p["bel"], "БЕЛ"), ("nvo_mat", p["mat"], "МАТ")]
    ability = None
    if p["ability"]:
        m = re.fullmatch(r"(\d+(?:[.,]\d+)?)\s*(\S+)", p["ability"])
        tok = (m.group(2) if m else "").upper()
        if not m or tok not in ABILITY:
            return None
        ability = tok
        nvo.append(("ability_" + ABILITY[tok], float(m.group(1).replace(",", ".")), p["ability"].split()[-1]))
    dipl = []
    for t in (p["d1"], p["d2"]):
        k = t.upper()
        if k not in DIPLOMA:
            return None
        dipl.append((("dipl_" + DIPLOMA[k]), 1.0, t))
    slots = [{"alternatives": [{"key": k, "coef": c}]} for k, c, _ in nvo + dipl]
    fmt = lambda x: str(int(x)) if float(x).is_integer() else str(x)
    raw = "(" + " + ".join(f"{fmt(c)} * {n}" for _, c, n in nvo) + ") + (" + " + ".join(f"1 * {n}" for _, _, n in dipl) + ")"
    return slots, raw, ability, [t for _, _, t in dipl]


def candidates(plan_by_school, rk):
    nm = norm(rk["class_name"])
    cands = [p for p in plan_by_school.get(rk["school_code"], []) if norm(p["profile"])[:25] in nm or nm.startswith(norm(p["profile"])[:25])]
    if len(cands) > 1:  # стеснява по режим на изучаване от суфикса на името
        want = "интензивно" if "ИИЧЕ" in rk["class_name"] else "разширено" if "РИЧЕ" in rk["class_name"] else None
        if want:
            narrowed = [p for p in cands if want in norm(p["mode"])]
            if narrowed:
                cands = narrowed
    return cands


def main():
    src, out_path = sys.argv[1], sys.argv[2]
    plan = load_plan(os.path.join(src, "plan2026.xlsx"))
    by_school = collections.defaultdict(list)
    for p in plan:
        by_school[p["school_code"]].append(p)
    today = dt.date.today().isoformat()

    rank_rows, classes, stats = [], [], collections.Counter()
    s1 = {}
    for y in (2026, 2025):
        for st in (1, 2, 3, 4):
            path = os.path.join(src, f"minmax{y}_{st}.pdf")
            if not os.path.exists(path):
                continue
            rows = pdf_rankings(path)
            stats[f"rank_{y}_{st}"] = len(rows)
            if y == 2026 and st == 1:
                s1 = {r["class_code"]: r for r in rows}
            for r in rows:
                rank_rows.append([y, r["class_code"], st, r["school_code"], r["class_name"], r["min_total"], r["min_m"], r["min_f"],
                                  r["max_total"], r["max_m"], r["max_f"], PUBLISHED[y][st]])

    for code, rk in s1.items():
        cands = candidates(by_school, rk)
        if not cands:
            stats["no_plan_match"] += 1
            continue
        fs = [formula_of(c) for c in cands]
        sigs = {json.dumps(f[0]) if f else None for f in fs}
        if None in sigs or len(sigs) != 1:
            stats["formula_ambiguous_or_unparsed"] += 1
            continue
        f = fs[0]
        c = cands[0]
        unique = len(cands) == 1
        stats["unique_match" if unique else "same_formula_many"] += 1
        places = int(c["places"]) if unique and c["places"] else None
        quota = (rk["min_m"] is not None and rk["min_f"] is not None and rk["min_m"] != rk["min_f"])  # приблизително: различни ограничения по пол
        classes.append({
            "campaign_year": 2026, "region": REGION, "school_code": rk["school_code"], "school_name": c["school_name"], "district": None,
            "class_code": code, "class_name": rk["class_name"], "kind": c["kind"], "formula_raw": f[1], "coefficients": f[0], "alt_formulas": None,
            "nvo_bel_coef": c["bel"], "nvo_mat_coef": c["mat"], "ability_exam": f[2], "diploma_subjects": f[3],
            "places": places, "places_m": None, "places_f": None, "quota": False,
            "study_form": c["form"] if unique else None, "first_language": c["language"] if unique else None,
            "language_mode": c["mode"] if unique else None,
        })

    with open(out_path, "w", encoding="utf-8") as fh:
        json.dump({"region": REGION, "generated_at": today, "source": LIST_URL, "classes": classes,
                   "rankings_columns": ["campaign_year", "class_code", "stage", "school_code", "class_name", "min_total", "min_m", "min_f",
                                        "max_total", "max_m", "max_f", "published_on"],
                   "rankings": rank_rows}, fh, ensure_ascii=False, separators=(",", ":"))
    print(json.dumps({"classes": len(classes), "rankings": len(rank_rows), **stats}, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
