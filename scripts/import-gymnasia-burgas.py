#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
РУО Бургас (прием след VII клас) → data/gymnasia/burgas.json (същата схема като sofia.json / varna.json).

РУО Бургас публикува САМО справки с минимални/максимални балове по етапи (xlsx) — БЕЗ формули за балообразуване
(проверено 18.11.2026). Затова паралелките са без формула: coefficients = [], formula_raw = 'няма данни' — страницата
показва баловете, но не смята личен бал. Ако РУО Бургас публикува плана — допълни скрипта както import-gymnasia-varna.py.

Скриптът сам тегли файловете от https://ruo.mon.bg/burgas/student-admission/statistika-za-bal-klasirane-za-nvo/
(2026: етапи 1–4; 2025: етапи 1–3 — 4-ят етап за 2025 е в друг формат и се пропуска).
Употреба: python -I scripts/import-gymnasia-burgas.py data/gymnasia/burgas.json
"""
import sys, io, re, json, collections, datetime as dt
import urllib.request
from urllib.parse import urljoin
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
import pandas as pd

REGION = "Бургас"
PAGE = "https://ruo.mon.bg/burgas/student-admission/statistika-za-bal-klasirane-za-nvo/"
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/142 Safari/537.36"}
PUBLISHED = {2026: {1: "2026-07-14", 2: "2026-07-21", 3: "2026-07-29", 4: "2026-08-05"}}
STAGE_WORDS = {"първи": 1, "втори": 2, "трети": 3, "четвърти": 4}


def fetch(u):
    return urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=90).read()


def num(v):
    s = str(v).strip().replace(",", ".")
    try:
        return None if s in ("", "nan", "None") else float(s)
    except ValueError:
        return None


def stage_of(df, url):
    for i in range(min(6, len(df))):
        for c in df.iloc[i].tolist():
            m = re.search(r"(първи|втори|трети|четвърти)\s+етап", str(c).lower())
            if m:
                return STAGE_WORDS[m.group(1)]
    m = re.search(r"bal(\d)", url.lower())
    return int(m.group(1)) if m else None


def parse(df, stage):
    """→ списък {school_code, school_name, class_code, class_name, places, min/max}."""
    out = []
    for _, r in df.iterrows():
        c = [("" if str(x) == "nan" else str(x).strip()) for x in r.tolist()]
        if len(c) < 9 or not re.fullmatch(r"\d{5,6}", c[1]) or not re.fullmatch(r"\d{1,6}", c[3]):
            continue
        tail = c[5:]
        if stage == 4:
            mn, mx = num(c[-2]), num(c[-1])
            vals = [mn, None, None, mx, None, None]
        else:
            v = [num(x) for x in c[-6:]]
            vals = v
        if vals[0] is not None and vals[3] is not None and vals[0] > vals[3] + 1e-9:
            continue  # нелогичен ред (min > max) — не вкарваме
        out.append(dict(school_code=c[1], school_name=re.sub(r"\s+", " ", c[2]), class_code=c[3].lstrip("0") or "0",
                        class_name=re.sub(r"\s+", " ", c[4]), places=num(c[6]) if len(c) > 6 else None,
                        min_total=vals[0], min_m=vals[1], min_f=vals[2], max_total=vals[3], max_m=vals[4], max_f=vals[5]))
    return out


def main():
    out_path = sys.argv[1]
    page = fetch(PAGE).decode("utf-8", "replace")
    files = []
    for f in dict.fromkeys(re.findall(r'href="([^"]+\.xlsx)"', page, re.I)):
        m = re.search(r"/files/sites/\d+/(\d{4})/(\d{2})/", f)
        if m and int(m.group(1)) in (2026, 2025):
            files.append((int(m.group(1)), urljoin(PAGE, f)))
    ranks, stats = [], collections.Counter()
    classes2026 = {}
    seen = set()
    for year, url in files:
        df = pd.read_excel(io.BytesIO(fetch(url)), header=None, dtype=str)
        stage = stage_of(df, url)
        if stage is None or (year, stage) in seen:
            stats["skipped_unknown_stage"] += 1
            continue
        if year == 2025 and stage == 4:
            stats["skipped_2025_stage4"] += 1
            continue
        rows = parse(df, stage)
        seen.add((year, stage))
        stats[f"rows_{year}_{stage}"] = len(rows)
        for r in rows:
            ranks.append([year, r["class_code"], stage, r["school_code"], r["class_name"], r["min_total"], r["min_m"], r["min_f"],
                          r["max_total"], r["max_m"], r["max_f"], PUBLISHED.get(year, {}).get(stage)])
            if year == 2026 and stage == 1:
                classes2026[r["class_code"]] = r
    classes = [{
        "campaign_year": 2026, "region": REGION, "school_code": r["school_code"], "school_name": r["school_name"], "district": None,
        "class_code": code, "class_name": r["class_name"], "kind": None, "formula_raw": "няма данни", "coefficients": [],
        "alt_formulas": None, "nvo_bel_coef": None, "nvo_mat_coef": None, "ability_exam": None, "diploma_subjects": [],
        "places": int(r["places"]) if r["places"] else None, "places_m": None, "places_f": None, "quota": False,
        "study_form": None, "first_language": None, "language_mode": None,
    } for code, r in classes2026.items()]
    with open(out_path, "w", encoding="utf-8") as fh:
        json.dump({"region": REGION, "generated_at": dt.date.today().isoformat(), "source": "https://ruo.mon.bg/burgas/ucheniczi/priem-na-ucheniczi/priem-v-8-klas/",
                   "classes": classes,
                   "rankings_columns": ["campaign_year", "class_code", "stage", "school_code", "class_name", "min_total", "min_m", "min_f",
                                        "max_total", "max_m", "max_f", "published_on"],
                   "rankings": ranks}, fh, ensure_ascii=False, separators=(",", ":"))
    print(json.dumps({"classes": len(classes), "rankings": len(ranks), "files": len(files), **stats}, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
