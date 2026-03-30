#!/usr/bin/env python3
"""
Извлича таблични данни от PDF на университет (МОН формат).
Използва pdfplumber с lines стратегия.

Употреба:
    python extract_university_pdf.py "universities_data/ИМЕТО НА УНИВЕРСИТЕТА.pdf"
    python extract_university_pdf.py "universities_data/ИМЕТО НА УНИВЕРСИТЕТА.pdf" --pages 2-5
    python extract_university_pdf.py "universities_data/ИМЕТО НА УНИВЕРСИТЕТА.pdf" --output result.json

Резултатът е JSON, който може директно да се подаде на Claude за обработка.
"""

import sys
import io
import json
import argparse
import os

# Fix Windows UTF-8 output
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

try:
    import pdfplumber
except ImportError:
    print("ERROR: pdfplumber не е инсталиран. Инсталирай с:", file=sys.stderr)
    print("  pip install pdfplumber", file=sys.stderr)
    sys.exit(1)


TABLE_SETTINGS = {
    "vertical_strategy": "lines",
    "horizontal_strategy": "lines",
}

# 17-column structure from MON PDFs
COLUMN_NAMES = [
    "row_number",           # 0  - № по ред
    "professional_field",   # 1  - Професионално направление
    "specialty_info",       # 2  - Специалност + макс. бал + форма
    "education_level",      # 3  - ОКС (Бакалавър/Магистър)
    "exam_1",               # 4  - КСИ вариант 1
    "exam_2",               # 5  - КСИ вариант 2
    "exam_3",               # 6  - КСИ вариант 3
    "exam_4",               # 7  - КСИ вариант 4
    "exam_5",               # 8  - КСИ вариант 5
    "exam_6",               # 9  - КСИ вариант 6
    "exam_7",               # 10 - КСИ вариант 7
    "grade_1",              # 11 - О2 вариант 1
    "grade_2",              # 12 - О2 вариант 2
    "grade_3",              # 13 - О2 вариант 3
    "grade_4",              # 14 - О2 вариант 4
    "formula",              # 15 - Балообразуване
    "notes",                # 16 - Забележка
]


def parse_page_range(page_range_str, total_pages):
    """Parse page range like '2-5' or '3' into list of 0-based indices."""
    if not page_range_str:
        return list(range(total_pages))

    pages = []
    for part in page_range_str.split(","):
        part = part.strip()
        if "-" in part:
            start, end = part.split("-", 1)
            start = max(1, int(start))
            end = min(total_pages, int(end))
            pages.extend(range(start - 1, end))
        else:
            p = int(part) - 1
            if 0 <= p < total_pages:
                pages.append(p)
    return sorted(set(pages))


def clean_cell(val):
    """Clean a cell value: strip whitespace, normalize None."""
    if val is None:
        return None
    val = str(val).strip()
    if not val or val == "-":
        return None
    return val


def propagate_merged_cells(rows):
    """
    Fill None values from merged cells by propagating the last non-None value
    downward for columns 1 (professional_field) and 3 (education_level).
    """
    merge_cols = [1, 3]  # These columns commonly have merged cells
    last_vals = {col: None for col in merge_cols}

    for row in rows:
        for col in merge_cols:
            if col < len(row):
                if row[col] is not None:
                    last_vals[col] = row[col]
                else:
                    row[col] = last_vals[col]
    return rows


def is_data_row(row):
    """Check if a row contains actual specialty data (not headers/footers)."""
    if not row or len(row) < 3:
        return False

    # Skip header rows
    first = clean_cell(row[0])
    if first and any(kw in first.lower() for kw in ["№", "по ред", "no", "ред"]):
        return False

    # Skip empty rows
    non_empty = sum(1 for c in row if clean_cell(c) is not None)
    if non_empty < 2:
        return False

    # Skip footnote rows (usually start with * or contain only text in first cell)
    if first and first.startswith("*"):
        return False

    return True


def detect_scanned_pdf(pdf_path):
    """Check if PDF is a scanned image (no extractable text)."""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages[:3]:  # Check first 3 pages
            text = page.extract_text()
            if text and len(text.strip()) > 50:
                return False
    return True


def extract_tables_from_pdf(pdf_path, page_indices=None):
    """Extract all table rows from a PDF file."""
    all_rows = []
    footnotes = []

    with pdfplumber.open(pdf_path) as pdf:
        total = len(pdf.pages)
        if page_indices is None:
            page_indices = list(range(total))

        print(f"PDF: {os.path.basename(pdf_path)}", file=sys.stderr)
        print(f"Общо страници: {total}, обработвам: {[i+1 for i in page_indices]}", file=sys.stderr)

        # Check if scanned
        is_scanned = detect_scanned_pdf(pdf_path)
        if is_scanned:
            print(f"  ⚠ СКАНИРАН PDF (няма текст) — нужен е OCR!", file=sys.stderr)
            return all_rows, [{"page": 0, "type": "warning", "content": "SCANNED_PDF: Няма текст. Подай директно на Claude с Read tool за визуален анализ, или използвай OCR (pytesseract)."}]

        for page_idx in page_indices:
            if page_idx >= total:
                continue

            page = pdf.pages[page_idx]
            tables = page.extract_tables(TABLE_SETTINGS)

            if not tables:
                # Fallback: try text strategy
                tables = page.extract_tables({
                    "vertical_strategy": "text",
                    "horizontal_strategy": "text",
                })

            if not tables:
                # Last resort: capture raw text
                text = page.extract_text()
                if text and text.strip():
                    footnotes.append({
                        "page": page_idx + 1,
                        "type": "text_only",
                        "content": text.strip()[:500]
                    })
                continue

            for table in tables:
                for row in table:
                    cleaned = [clean_cell(c) for c in row]

                    if is_data_row(cleaned):
                        # Pad to 17 columns if needed
                        while len(cleaned) < 17:
                            cleaned.append(None)
                        all_rows.append({
                            "page": page_idx + 1,
                            "cells": cleaned[:17]
                        })
                    elif any(c and "*" in str(c) for c in cleaned if c):
                        # Capture footnotes
                        text = " | ".join(str(c) for c in cleaned if c)
                        if text.strip():
                            footnotes.append({
                                "page": page_idx + 1,
                                "type": "footnote",
                                "content": text.strip()[:300]
                            })

    return all_rows, footnotes


def rows_to_structured(rows):
    """Convert raw rows to labeled dictionaries."""
    structured = []
    for entry in rows:
        cells = entry["cells"]
        record = {"page": entry["page"]}
        for i, name in enumerate(COLUMN_NAMES):
            if i < len(cells):
                record[name] = cells[i]
        structured.append(record)
    return structured


def main():
    parser = argparse.ArgumentParser(
        description="Извличане на таблични данни от PDF на университет (МОН формат)"
    )
    parser.add_argument("pdf_path", help="Път до PDF файла")
    parser.add_argument("--pages", "-p", default=None,
                        help="Страници за обработка (напр. '2-5' или '3,5,7')")
    parser.add_argument("--output", "-o", default=None,
                        help="Запис в JSON файл (по подразбиране: stdout)")
    parser.add_argument("--raw", action="store_true",
                        help="Изведи суровите клетки без именуване на колоните")
    parser.add_argument("--propagate", action="store_true", default=True,
                        help="Попълни merged клетки (по подразбиране: включено)")

    args = parser.parse_args()

    if not os.path.exists(args.pdf_path):
        print(f"ERROR: Файлът не съществува: {args.pdf_path}", file=sys.stderr)
        sys.exit(1)

    # Determine pages
    with pdfplumber.open(args.pdf_path) as pdf:
        total_pages = len(pdf.pages)

    page_indices = parse_page_range(args.pages, total_pages)

    # Extract
    rows, footnotes = extract_tables_from_pdf(args.pdf_path, page_indices)

    print(f"Извлечени редове: {len(rows)}", file=sys.stderr)
    print(f"Забележки/footnotes: {len(footnotes)}", file=sys.stderr)

    # Propagate merged cells
    if args.propagate and rows:
        all_cells = [r["cells"] for r in rows]
        propagate_merged_cells(all_cells)

    # Build output
    uni_name = os.path.splitext(os.path.basename(args.pdf_path))[0]

    if args.raw:
        output = {
            "university": uni_name,
            "total_pages": total_pages,
            "pages_processed": [i + 1 for i in page_indices],
            "column_names": COLUMN_NAMES,
            "rows": [r["cells"] for r in rows],
            "footnotes": footnotes
        }
    else:
        structured = rows_to_structured(rows)
        output = {
            "university": uni_name,
            "total_pages": total_pages,
            "pages_processed": [i + 1 for i in page_indices],
            "row_count": len(structured),
            "data": structured,
            "footnotes": footnotes
        }

    # Output
    result = json.dumps(output, ensure_ascii=False, indent=2)

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(result)
        print(f"Записано в: {args.output}", file=sys.stderr)
    else:
        print(result)


if __name__ == "__main__":
    main()
