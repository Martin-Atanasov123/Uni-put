#!/usr/bin/env python3
"""
Batch extraction: извлича данни от ВСИЧКИ PDF файлове в universities_data/.
Записва всеки като отделен JSON файл в output папка.

Употреба:
    python extract_all_universities.py
    python extract_all_universities.py --outdir extracted_data
"""

import sys
import io
import os
import glob
import json
import argparse

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

try:
    import pdfplumber
except ImportError:
    print("pip install pdfplumber", file=sys.stderr)
    sys.exit(1)

from extract_university_pdf import extract_tables_from_pdf, rows_to_structured, propagate_merged_cells


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--indir", default="universities_data", help="Папка с PDF файлове")
    parser.add_argument("--outdir", default="extracted_data", help="Папка за JSON резултати")
    args = parser.parse_args()

    os.makedirs(args.outdir, exist_ok=True)

    pdf_files = sorted(glob.glob(os.path.join(args.indir, "*.pdf")))
    print(f"Намерени PDF файлове: {len(pdf_files)}\n", file=sys.stderr)

    summary = []

    for pdf_path in pdf_files:
        uni_name = os.path.splitext(os.path.basename(pdf_path))[0]
        out_file = os.path.join(args.outdir, uni_name + ".json")

        try:
            rows, footnotes = extract_tables_from_pdf(pdf_path)

            if rows:
                all_cells = [r["cells"] for r in rows]
                propagate_merged_cells(all_cells)

            structured = rows_to_structured(rows)

            with pdfplumber.open(pdf_path) as pdf:
                total_pages = len(pdf.pages)

            output = {
                "university": uni_name,
                "total_pages": total_pages,
                "row_count": len(structured),
                "data": structured,
                "footnotes": footnotes
            }

            with open(out_file, "w", encoding="utf-8") as f:
                json.dump(output, f, ensure_ascii=False, indent=2)

            summary.append({"university": uni_name, "rows": len(structured), "pages": total_pages, "status": "OK"})
            print(f"  OK: {uni_name} ({len(structured)} rows, {total_pages} pages)", file=sys.stderr)

        except Exception as e:
            summary.append({"university": uni_name, "rows": 0, "pages": 0, "status": f"ERROR: {e}"})
            print(f"  ERROR: {uni_name}: {e}", file=sys.stderr)

    print(f"\n{'='*60}", file=sys.stderr)
    print(f"Обработени: {len(summary)}", file=sys.stderr)
    ok = sum(1 for s in summary if s['status'] == 'OK')
    print(f"Успешни: {ok}, Грешки: {len(summary) - ok}", file=sys.stderr)

    # Save summary
    summary_path = os.path.join(args.outdir, "_summary.json")
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    print(f"Summary: {summary_path}", file=sys.stderr)


if __name__ == "__main__":
    main()
