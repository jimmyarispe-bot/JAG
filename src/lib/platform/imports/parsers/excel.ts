import * as XLSX from "xlsx";
import type { ParsedSheet, ParsedWorkbook } from "../types";
import type { FileParseInput, FileParser } from "./types";

function sheetToParsed(sheet: XLSX.WorkSheet, sheetName: string): ParsedSheet {
  const matrix = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });

  if (!matrix.length) {
    return { headers: [], rows: [], rowCount: 0, sheetName };
  }

  const headerRow = (matrix[0] ?? []).map((cell) => String(cell ?? "").trim());
  const headers = headerRow.map((h, i) => h || `Column_${i + 1}`);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < matrix.length; i++) {
    const cols = matrix[i] ?? [];
    if (cols.every((c) => String(c ?? "").trim() === "")) continue;
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = String(cols[idx] ?? "").trim();
    });
    rows.push(row);
  }

  return { headers, rows, rowCount: rows.length, sheetName };
}

function decodeBase64(base64: string): Uint8Array {
  const binary = Buffer.from(base64, "base64");
  return new Uint8Array(binary);
}

export const excelParser: FileParser = {
  formats: ["xlsx", "xls"],
  canParse(input) {
    if (!input.base64) return false;
    if (input.formatHint === "xlsx" || input.formatHint === "xls") return true;
    const lower = input.fileName.toLowerCase();
    return lower.endsWith(".xlsx") || lower.endsWith(".xls");
  },
  parse(input: FileParseInput): ParsedWorkbook {
    if (!input.base64) throw new Error("Excel parser requires base64 binary content");
    const bytes = decodeBase64(input.base64);
    const workbook = XLSX.read(bytes, { type: "array", cellDates: true });
    if (!workbook.SheetNames.length) {
      throw new Error("Excel file contains no sheets");
    }

    const sheets = workbook.SheetNames.map((name) =>
      sheetToParsed(workbook.Sheets[name], name)
    );
    const primary = sheets.find((s) => s.rowCount > 0) ?? sheets[0];
    const lower = input.fileName.toLowerCase();
    const format = input.formatHint ?? (lower.endsWith(".xls") && !lower.endsWith(".xlsx") ? "xls" : "xlsx");

    return {
      format,
      fileName: input.fileName,
      fileSizeBytes: input.fileSizeBytes,
      sheets,
      primary,
    };
  },
};
