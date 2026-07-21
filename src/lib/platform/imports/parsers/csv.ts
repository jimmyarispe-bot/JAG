import type { ImportSourceFormat, ParsedSheet, ParsedWorkbook } from "../types";
import type { FileParseInput, FileParser } from "./types";

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

export function parseCsvText(content: string): ParsedSheet {
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    return { headers: [], rows: [], rowCount: 0, sheetName: "Sheet1" };
  }

  const headers = parseCsvLine(lines[0]).map((h) => h.replace(/^\uFEFF/, ""));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.every((c) => !c)) continue;
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = cols[idx] ?? "";
    });
    rows.push(row);
  }

  return {
    headers,
    rows,
    rowCount: rows.length,
    sheetName: "Sheet1",
  };
}

function detectCsvFormat(fileName: string): ImportSourceFormat {
  const lower = fileName.toLowerCase();
  if (lower.includes("google") || lower.endsWith(".gsheet.csv")) return "google_sheets";
  return "csv";
}

export const csvParser: FileParser = {
  formats: ["csv", "google_sheets"],
  canParse(input) {
    if (input.formatHint === "csv" || input.formatHint === "google_sheets") return Boolean(input.text);
    if (!input.text) return false;
    const lower = input.fileName.toLowerCase();
    return lower.endsWith(".csv") || lower.endsWith(".tsv") || input.formatHint === undefined;
  },
  parse(input: FileParseInput): ParsedWorkbook {
    if (!input.text) throw new Error("CSV parser requires text content");
    const primary = parseCsvText(input.text);
    const format = input.formatHint ?? detectCsvFormat(input.fileName);
    return {
      format,
      fileName: input.fileName,
      fileSizeBytes: input.fileSizeBytes,
      sheets: [primary],
      primary,
    };
  },
};
