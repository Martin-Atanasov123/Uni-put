#!/usr/bin/env python3
import sys, io, glob, json
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

import pdfplumber

TABLE_SETTINGS = {
    "vertical_strategy": "lines",
    "horizontal_strategy": "lines",
}

def clean_cell(val):
    if val is None:
        return None
    val = str(val).strip()
    if not val or val == "-":
        return None
    return val

path = glob.glob('universities_data/*РУСЕНСКИ*')[0]
pdf = pdfplumber.open(path)
total_pages = len(pdf.pages)

all_rows = []
for page_idx in range(total_pages):
    page = pdf.pages[page_idx]
    tables = page.extract_tables(TABLE_SETTINGS)
    if not tables:
        tables = page.extract_tables({"vertical_strategy": "text", "horizontal_strategy": "text"})
    if not tables:
        continue
    for table in tables:
        for row in table:
            cleaned = [clean_cell(c) for c in row]
            non_empty = sum(1 for c in cleaned if c is not None)
            if non_empty >= 2:
                all_rows.append({"page": page_idx + 1, "cells": cleaned})

pdf.close()

output = {
    "university": "РУСЕНСКИ УНИВЕРСИТЕТ АНГЕЛ КЪНЧЕВ",
    "total_pages": total_pages,
    "row_count": len(all_rows),
    "rows": all_rows,
}
print(json.dumps(output, ensure_ascii=False, indent=2))
