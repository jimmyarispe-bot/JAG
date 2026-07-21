import type { ImportSourceFormat, ParsedWorkbook } from "../types";
import { csvParser } from "./csv";
import { excelParser } from "./excel";
import { googleSheetsParser } from "./google-sheets";
import type { FileParseInput, FileParser } from "./types";

const parsers: FileParser[] = [googleSheetsParser, excelParser, csvParser];

export function registerParser(parser: FileParser): void {
  parsers.unshift(parser);
}

export function detectFormat(fileName: string, mimeType?: string | null): ImportSourceFormat {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".xlsx")) return "xlsx";
  if (lower.endsWith(".xls")) return "xls";
  if (lower.includes("google") || lower.includes("sheets")) return "google_sheets";
  if (mimeType?.includes("spreadsheet") || mimeType?.includes("excel")) {
    return lower.endsWith(".xls") ? "xls" : "xlsx";
  }
  return "csv";
}

export async function parseImportFile(input: FileParseInput): Promise<ParsedWorkbook> {
  const withHint: FileParseInput = {
    ...input,
    formatHint: input.formatHint ?? detectFormat(input.fileName),
  };

  for (const parser of parsers) {
    if (parser.canParse(withHint)) {
      return parser.parse(withHint);
    }
  }

  throw new Error(
    `Unsupported file type for "${input.fileName}". Supported: CSV, Excel (.xlsx/.xls), Google Sheets export.`
  );
}

export { csvParser, excelParser, googleSheetsParser };
export type { FileParseInput, FileParser };
