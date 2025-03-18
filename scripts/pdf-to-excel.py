#!/usr/bin/env python3
"""Convert PDF to Excel XLSX using pdfplumber for table extraction."""
import sys
import pdfplumber
from openpyxl import Workbook


def convert_pdf_to_xlsx(input_path, output_path):
    pdf = pdfplumber.open(input_path)
    wb = Workbook()
    ws = wb.active

    for page_num, page in enumerate(pdf.pages):
        if page_num > 0:
            ws.append([])  # blank row between pages

        tables = page.extract_tables()
        if tables:
            for table in tables:
                for row in table:
                    ws.append([cell if cell else "" for cell in row])
        else:
            # Fallback: extract text line by line
            text = page.extract_text()
            if text:
                for line in text.split("\n"):
                    ws.append([line])

    pdf.close()
    wb.save(output_path)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: pdf-to-excel.py <input.pdf> <output.xlsx>", file=sys.stderr)
        sys.exit(1)

    convert_pdf_to_xlsx(sys.argv[1], sys.argv[2])
