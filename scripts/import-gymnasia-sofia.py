#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Парсер за приема след VII клас (РУО – София-град) → SQL за public.gymnasium_classes /
public.gymnasium_rankings.

Вход (папка с Excel файловете на РУО, имената са конвенция на този скрипт):
  list<YYYY>.xlsx          „Списък на паралелките … с кодове и балообразуване“
  minmax<YYYY>_<N>.xlsx    „СПРАВКА за минималния и максималния бал по паралелки“, етап N = 1..4

Употреба:
  python -I scripts/import-gymnasia-sofia.py <папка-с-xlsx> <изходна-папка> [--year 2026]
Изход: classes_NN.sql / rankings_NN.sql (многоредови INSERT … ON CONFLICT DO UPDATE, идемпотентни)
и summary в stdout. Изпълняват се в Supabase (SQL editor или MCP) след миграцията 20261113000000_gymnasia.

Откъде са файловете: https://ruo.mon.bg/sofia-grad/ucheniczi/priem-na-ucheniczi/priem-v-8-klas/
"""
import sys, io, os, re, json, glob, argparse, datetime as dt
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
import pandas as pd

REGION = "София-град"
LIST_URL = "https://ruo.mon.bg/sofia-grad/ucheniczi/priem-na-ucheniczi/priem-v-8-klas/"
# Дати на публикуване на справките по етап (от заглавията на обявите на РУО).
PUBLISHED = {
    2023: {1: "2023-07-12", 2: "2023-07-19", 3: "2023-07-31", 4: "2023-08-10"},
    2024: {1: "2024-07-12", 2: "2024-07-19", 3: "2024-07-30", 4: "2024-08-07"},
    2025: {1: "2025-07-14", 2: "2025-07-21", 3: "2025-07-30", 4: "2025-08-06"},
    2026: {1: "2026-07-14", 2: "2026-07-21", 3: "2026-07-29", 4: "2026-08-05"},
}
# Съкращения на предметите от свидетелството (по списъка на РУО).
DIPLOMA = {
    "БЕЛ": "bel", "М": "m", "КМИТ": "kmit", "ИТ": "it", "ЧЕЗ": "chez", "ГИ": "gi", "БЗО": "bzo",
    "ИИ": "ii", "ФА": "fa", "ХООС": "hoos", "ИЦ": "ic", "ТП": "tp", "ФВС": "fvs", "МУЗ": "muz",
}
# Изпити за проверка на способностите (участват в частта „НВО“).
ABILITY = {"ИИ": "ii", "МУЗ": "muz", "СПО": "spo", "ФВС": "fvs", "МИФВС": "muz_fvs"}


def norm_code(v):
    s = re.sub(r"\.0$", "", str(v).strip())
    return s.lstrip("0") or "0"


def norm_token(t):
    return re.sub(r"[\s.]+", " ", t.strip()).strip().upper()


def translit(s):
    table = str.maketrans("абвгдежзийклмнопрстуфхцчшщъьюя", "abvgdejziyklmnoprstufhcchshshtayuya"[:30])
    s = s.lower().translate(table)
    return re.sub(r"[^a-z0-9]+", "_", s).strip("_")


def parse_formula(raw, warnings):
    """'(2 * БЕЛ + 2 * МАТ) + (1 * М + 1 * ИТ) [или …]' → списък от варианти.
    Всеки вариант: {slots, nvo_bel, nvo_mat, ability, diploma}."""
    variants = []
    for part in re.split(r"\s+или\s+", raw.strip(), flags=re.I):
        m = re.fullmatch(r"\s*\(([^()]*)\)\s*\+\s*\(([^()]*)\)\s*", part)
        if not m:
            warnings.append(f"неразпозната формула: {raw!r}")
            return None
        nvo, dipl = m.group(1), m.group(2)
        v = {"slots": [], "nvo_bel": None, "nvo_mat": None, "ability": None, "diploma": []}
        for term in nvo.split("+"):
            tm = re.fullmatch(r"\s*(\d+(?:[.,]\d+)?)\s*\*\s*(.+?)\s*", term)
            if not tm:
                warnings.append(f"неразпознат НВО член {term!r} в {raw!r}"); return None
            coef, tok = float(tm.group(1).replace(",", ".")), norm_token(tm.group(2))
            if tok == "БЕЛ":
                v["nvo_bel"] = coef; key = "nvo_bel"
            elif tok == "МАТ":
                v["nvo_mat"] = coef; key = "nvo_mat"
            elif tok in ABILITY:
                v["ability"] = tok; key = "ability_" + ABILITY[tok]
            else:
                # Олимпиади (НПМГ): „ФИЗ, ОК“ = областен кръг, „НПМГ, Ф“ = състезание на НПМГ
                key = "olimp_" + translit(tok)
                warnings.append(f"олимпиаден/непознат НВО член {tok!r} → {key}")
            v["slots"].append({"alternatives": [{"key": key, "coef": coef}]})
        for term in dipl.split("+"):
            tm = re.fullmatch(r"\s*(\d+(?:[.,]\d+)?)\s*\*\s*(.+?)\s*", term)
            if not tm:
                warnings.append(f"неразпознат дипломен член {term!r} в {raw!r}"); return None
            coef, tok = float(tm.group(1).replace(",", ".")), norm_token(tm.group(2))
            if tok not in DIPLOMA:
                warnings.append(f"непознат дипломен предмет {tok!r} в {raw!r}")
            v["diploma"].append(tok)
            v["slots"].append({"alternatives": [{"key": "dipl_" + DIPLOMA.get(tok, translit(tok)), "coef": coef}]})
        variants.append(v)
    return variants


def load_list(path):
    raw = pd.read_excel(path, header=None, dtype=str)
    h = next(i for i in range(len(raw)) if "Балообразуване" in [str(x).strip() for x in raw.iloc[i]])
    hdr = [str(x).strip() for x in raw.iloc[h]]
    df = raw.iloc[h + 1:].copy(); df.columns = hdr
    df = df[df["Балообразуване"].notna()]
    col = lambda *names: next((c for c in hdr for n in names if n.lower() in c.lower()), None)
    out = []
    for _, r in df.iterrows():
        g = lambda c: (str(r[c]).strip() if c and str(r[c]) != "nan" else None)
        out.append({
            "district": g(col("РАЙОН")),
            "school_name": re.sub(r"\s+", " ", g(col("Училище")) or ""),
            "class_code": norm_code(g(col("код"))),
            "class_name": re.sub(r"\s+", " ", g(col("Паралелка - име")) or ""),
            "kind": g(col("Вид")),
            "formula_raw": re.sub(r"\s+", " ", g("Балообразуване")),
            "study_form": g(col("Форма")),
            "places": g(col("Общо основание")),
            "places_m": g("Мъже"), "places_f": g("Жени"),
            "first_language": g(col("Първи чужд език")),
            "language_mode": g(col("Начин на изучаване")),
        })
    return out


def load_minmax(path):
    raw = pd.read_excel(path, header=None, dtype=str)
    h = next(i for i in range(len(raw)) if "Код" in [str(x).strip() for x in raw.iloc[i]])
    row = [str(x).strip() for x in raw.iloc[h]]
    ci = [i for i, c in enumerate(row) if c == "Код"]  # [училище, паралелка]
    sc, cc = ci[0], ci[1]
    out = []
    for i in range(h + 1, len(raw)):
        r = raw.iloc[i]
        if str(r[cc]) == "nan" or not str(r[cc]).strip():
            continue
        num = lambda j: (None if str(r[j]) == "nan" else float(str(r[j]).replace(",", ".")))
        out.append({
            "school_code": norm_code(r[sc]), "school_name": re.sub(r"\s+", " ", str(r[sc + 1]).strip()),
            "class_code": norm_code(r[cc]), "class_name": re.sub(r"\s+", " ", str(r[cc + 1]).strip()),
            "min_total": num(cc + 2), "min_m": num(cc + 3), "min_f": num(cc + 4),
            "max_total": num(cc + 5), "max_m": num(cc + 6), "max_f": num(cc + 7),
        })
    return out


def q(v):
    if v is None: return "NULL"
    if isinstance(v, bool): return "true" if v else "false"
    if isinstance(v, (int, float)): return repr(v)
    return "'" + str(v).replace("'", "''") + "'"


def qjson(v): return "NULL" if v is None else q(json.dumps(v, ensure_ascii=False)) + "::jsonb"
def qarr(v): return "NULL" if not v else "ARRAY[" + ",".join(q(x) for x in v) + "]::text[]"
def qint(v):
    try: return str(int(float(v)))
    except (TypeError, ValueError): return "NULL"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src"); ap.add_argument("out"); ap.add_argument("--year", type=int, default=None)
    ap.add_argument("--batch", type=int, default=250)
    ap.add_argument("--json", default=None, help="и JSON снимка на данните (data/gymnasia/<регион>.json — версия в git; импорт в Postgres през pg_net от raw.githubusercontent)")
    a = ap.parse_args()
    json_classes, json_ranks = [], []
    os.makedirs(a.out, exist_ok=True)
    years = [a.year] if a.year else sorted(int(m.group(1)) for f in glob.glob(os.path.join(a.src, "list*.xlsx")) if (m := re.search(r"list(\d{4})", f)))
    today = dt.date.today().isoformat()
    class_rows, rank_rows, warnings, summary = [], [], [], {}

    for y in years:
        classes = load_list(os.path.join(a.src, f"list{y}.xlsx"))
        stages = {}
        for st in (1, 2, 3, 4):
            p = os.path.join(a.src, f"minmax{y}_{st}.xlsx")
            if os.path.exists(p): stages[st] = load_minmax(p)
        by_code = {r["class_code"]: r for r in stages.get(1, [])}
        n_std = n_alt = n_ability = n_unmatched = 0
        for c in classes:
            w = []
            variants = parse_formula(c["formula_raw"], w)
            warnings += [f"{y} {c['class_code']}: {x}" for x in w]
            if not variants: continue
            v0 = variants[0]
            if len(variants) > 1: n_alt += 1
            elif v0["ability"]: n_ability += 1
            else: n_std += 1
            mm = by_code.get(c["class_code"])
            if not mm: n_unmatched += 1
            pm, pf = qint(c["places_m"]), qint(c["places_f"])
            quota = (pm != "NULL" and int(pm) > 0) or (pf != "NULL" and int(pf) > 0)
            json_classes.append({
                "campaign_year": y, "region": REGION, "school_code": mm["school_code"] if mm else None,
                "school_name": c["school_name"], "district": c["district"], "class_code": c["class_code"],
                "class_name": c["class_name"], "kind": c["kind"], "formula_raw": c["formula_raw"],
                "coefficients": v0["slots"], "alt_formulas": [v["slots"] for v in variants[1:]] or None,
                "nvo_bel_coef": v0["nvo_bel"], "nvo_mat_coef": v0["nvo_mat"], "ability_exam": v0["ability"],
                "diploma_subjects": v0["diploma"], "places": None if qint(c["places"]) == "NULL" else int(qint(c["places"])),
                "places_m": None if pm == "NULL" else int(pm), "places_f": None if pf == "NULL" else int(pf), "quota": quota,
                "study_form": c["study_form"], "first_language": c["first_language"], "language_mode": c["language_mode"],
            })
            class_rows.append("(" + ",".join([
                str(y), q(REGION), q(mm["school_code"] if mm else None), q(c["school_name"]), q(c["district"]),
                q(c["class_code"]), q(c["class_name"]), q(c["kind"]), q(c["formula_raw"]),
                qjson(v0["slots"]), qjson([v["slots"] for v in variants[1:]] or None),
                q(v0["nvo_bel"]), q(v0["nvo_mat"]), q(v0["ability"]), qarr(v0["diploma"]),
                qint(c["places"]), pm, pf, q(quota), q(c["study_form"]), q(c["first_language"]), q(c["language_mode"]),
                q(LIST_URL), q(today),
            ]) + ")")
        for st, rows in stages.items():
            for r in rows:
                json_ranks.append([y, r["class_code"], st, r["school_code"], r["class_name"],
                                   r["min_total"], r["min_m"], r["min_f"], r["max_total"], r["max_m"], r["max_f"],
                                   PUBLISHED.get(y, {}).get(st)])
                rank_rows.append("(" + ",".join([
                    str(y), q(REGION), q(r["class_code"]), str(st), q(r["school_code"]), q(r["class_name"]),
                    q(r["min_total"]), q(r["min_m"]), q(r["min_f"]), q(r["max_total"]), q(r["max_m"]), q(r["max_f"]),
                    q(PUBLISHED.get(y, {}).get(st)), q(LIST_URL),
                ]) + ")")
        summary[y] = {"classes": len(classes), "standard": n_std, "ability": n_ability, "with_alt": n_alt,
                      "no_rank_match": n_unmatched, "stages": {st: len(r) for st, r in stages.items()}}

    def write(prefix, rows, cols, conflict, update):
        for i in range(0, len(rows), a.batch):
            with open(os.path.join(a.out, f"{prefix}_{i // a.batch:02d}.sql"), "w", encoding="utf-8") as f:
                f.write(f"insert into public.{prefix} ({cols}) values\n" + ",\n".join(rows[i:i + a.batch]) +
                        f"\non conflict ({conflict}) do update set {update};\n")
        return (len(rows) + a.batch - 1) // a.batch

    nc = write("gymnasium_classes", class_rows,
               "campaign_year, region, school_code, school_name, district, class_code, class_name, kind, formula_raw, "
               "coefficients, alt_formulas, nvo_bel_coef, nvo_mat_coef, ability_exam, diploma_subjects, places, places_m, "
               "places_f, quota, study_form, first_language, language_mode, source_url, checked_at",
               "campaign_year, region, class_code",
               ", ".join(f"{c} = excluded.{c}" for c in ["school_code", "school_name", "district", "class_name", "kind", "formula_raw",
                         "coefficients", "alt_formulas", "nvo_bel_coef", "nvo_mat_coef", "ability_exam", "diploma_subjects",
                         "places", "places_m", "places_f", "quota", "study_form", "first_language", "language_mode", "source_url", "checked_at"]))
    nr = write("gymnasium_rankings", rank_rows,
               "campaign_year, region, class_code, stage, school_code, class_name, min_total, min_m, min_f, max_total, max_m, max_f, published_on, source_url",
               "campaign_year, region, class_code, stage",
               ", ".join(f"{c} = excluded.{c}" for c in ["school_code", "class_name", "min_total", "min_m", "min_f", "max_total", "max_m", "max_f", "published_on", "source_url"]))

    if a.json:
        os.makedirs(os.path.dirname(a.json) or ".", exist_ok=True)
        with open(a.json, "w", encoding="utf-8") as f:
            json.dump({"region": REGION, "generated_at": today, "source": LIST_URL,
                       "classes": json_classes,
                       "rankings_columns": ["campaign_year", "class_code", "stage", "school_code", "class_name",
                                            "min_total", "min_m", "min_f", "max_total", "max_m", "max_f", "published_on"],
                       "rankings": json_ranks}, f, ensure_ascii=False, separators=(",", ":"))
    print(json.dumps({"years": summary, "class_rows": len(class_rows), "rank_rows": len(rank_rows),
                      "sql_files": {"classes": nc, "rankings": nr}}, ensure_ascii=False, indent=1))
    uniq = sorted(set(w.split(": ", 1)[1] for w in warnings))
    print(f"\nпредупреждения: {len(warnings)} (уникални {len(uniq)})")
    for u in uniq[:40]: print("  -", u)


if __name__ == "__main__":
    main()
