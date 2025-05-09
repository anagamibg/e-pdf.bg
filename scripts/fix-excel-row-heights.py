#!/usr/bin/env python3
"""Pre-process Excel files to fix row heights for wrapped text before LibreOffice PDF conversion.

Handles both .xlsx (native openpyxl) and .xls (converts to .xlsx via LibreOffice first).
"""
import sys
import os
import math
import subprocess
from openpyxl import load_workbook
from openpyxl.utils import get_column_letter


def get_column_width(ws, col_idx):
    """Get the width of a column in character units."""
    col_letter = get_column_letter(col_idx)
    if col_letter in ws.column_dimensions:
        width = ws.column_dimensions[col_letter].width
        if width is not None and width > 0:
            return width
    return 8.43  # Excel default column width


def get_font_size(cell):
    """Get the font size for a cell, falling back to default."""
    if cell.font and cell.font.size:
        return cell.font.size
    return 11  # Excel default font size


def get_merged_range(ws, row, col):
    """Return the merged range containing this cell, or None."""
    for merged_range in ws.merged_cells.ranges:
        if (merged_range.min_row <= row <= merged_range.max_row and
                merged_range.min_col <= col <= merged_range.max_col):
            return merged_range
    return None


def estimate_lines(text, col_width_chars, font_size=11):
    """Estimate the number of wrapped lines text will occupy."""
    if not text:
        return 1

    text = str(text)
    # Excel column width is in units of the default font's '0' character width.
    # Scale character capacity by font size ratio relative to default 11pt.
    # The 0.85 factor accounts for cell padding and font width variance.
    chars_per_line = max(1, col_width_chars * (11.0 / font_size) * 0.85)

    total_lines = 0
    for paragraph in text.split('\n'):
        if not paragraph.strip():
            total_lines += 1
            continue
        lines = max(1, math.ceil(len(paragraph) / chars_per_line))
        total_lines += lines

    return max(1, total_lines)


def convert_xls_to_xlsx(input_path):
    """Convert .xls to .xlsx using LibreOffice, return the new path or None on failure."""
    outdir = os.path.dirname(input_path)
    try:
        subprocess.run(
            ["soffice", "--headless", "--invisible", "--convert-to", "xlsx",
             "--outdir", outdir, input_path],
            check=True, capture_output=True, timeout=120
        )
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired, FileNotFoundError) as e:
        print(f"Failed to convert .xls to .xlsx: {e}", file=sys.stderr)
        return None

    # LibreOffice outputs <basename>.xlsx in outdir
    basename = os.path.splitext(os.path.basename(input_path))[0]
    xlsx_path = os.path.join(outdir, basename + ".xlsx")
    if os.path.exists(xlsx_path):
        return xlsx_path
    return None


def fix_row_heights(input_path):
    """Fix row heights in an Excel file for cells with wrapped text."""
    xlsx_path = None
    converted_from_xls = False

    try:
        wb = load_workbook(input_path)
        xlsx_path = input_path
    except Exception:
        # Likely .xls format — convert to .xlsx first
        print("Cannot open with openpyxl, attempting .xls → .xlsx conversion...", file=sys.stderr)
        xlsx_path = convert_xls_to_xlsx(input_path)
        if xlsx_path is None:
            print("Skipping row height fix — conversion failed.", file=sys.stderr)
            return
        converted_from_xls = True
        try:
            wb = load_workbook(xlsx_path)
        except Exception as e:
            print(f"Skipping row height fix: {e}", file=sys.stderr)
            return

    for ws in wb.worksheets:
        for row_idx in range(1, ws.max_row + 1):
            max_height_needed = 15.0  # default row height in points

            for col_idx in range(1, ws.max_column + 1):
                cell = ws.cell(row=row_idx, column=col_idx)

                if cell.value is None:
                    continue

                text = str(cell.value)

                # Check if text wrapping is enabled or text has newlines
                has_wrap = (cell.alignment and cell.alignment.wrap_text)
                has_newlines = '\n' in text

                if not has_wrap and not has_newlines:
                    continue

                # Handle merged cells — only process from the first row of the range
                merged = get_merged_range(ws, row_idx, col_idx)
                if merged:
                    if row_idx != merged.min_row or col_idx != merged.min_col:
                        continue
                    # Use combined width of all columns in the merge
                    col_width = sum(
                        get_column_width(ws, c)
                        for c in range(merged.min_col, merged.max_col + 1)
                    )
                else:
                    col_width = get_column_width(ws, col_idx)

                font_size = get_font_size(cell)
                lines = estimate_lines(text, col_width, font_size)

                # Height = lines * font_size * line_spacing_factor
                line_height = font_size * 1.35
                needed_height = lines * line_height

                # For merged cells spanning multiple rows, distribute height
                if merged and merged.max_row > merged.min_row:
                    rows_in_merge = merged.max_row - merged.min_row + 1
                    needed_height = needed_height / rows_in_merge

                max_height_needed = max(max_height_needed, needed_height)

            # Only increase height, never shrink
            current_height = ws.row_dimensions[row_idx].height
            if current_height is None:
                current_height = 15.0

            if max_height_needed > current_height:
                ws.row_dimensions[row_idx].height = max_height_needed

    # Save the fixed file
    wb.save(xlsx_path)

    if converted_from_xls:
        # Replace the original .xls with the fixed .xlsx so LibreOffice picks it up
        os.replace(xlsx_path, input_path)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: fix-excel-row-heights.py <input_file>", file=sys.stderr)
        sys.exit(1)

    fix_row_heights(sys.argv[1])
