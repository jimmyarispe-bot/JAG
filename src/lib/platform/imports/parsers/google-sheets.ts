import type { ParsedWorkbook } from "../types";
import type { FileParseInput, FileParser } from "./types";
import { parseCsvText } from "./csv";
import { excelParser } from "./excel";

/**
 * Google Sheets exports arrive as CSV or Excel downloads.
 * This parser normalizes those exports under format "google_sheets".
 */
export const googleSheetsParser: FileParser = {
  formats: ["google_sheets"],
  canParse(input) {
    if (input.formatHint === "google_sheets") return Boolean(input.text || input.base64);
    const lower = input.fileName.toLowerCase();
    return lower.includes("google") || lower.includes("sheets");
  },
  parse(input: FileParseInput): ParsedWorkbook {
    if (input.base64 && excelParser.canParse({ ...input, formatHint: "xlsx" })) {
      const workbook = excelParser.parse({ ...input, formatHint: "xlsx" }) as ParsedWorkbook;
      return { ...workbook, format: "google_sheets" };
    }
    if (!input.text) {
      throw new Error("Google Sheets export requires CSV text or Excel binary content");
    }
    const primary = parseCsvText(input.text);
    return {
      format: "google_sheets",
      fileName: input.fileName,
      fileSizeBytes: input.fileSizeBytes,
      sheets: [primary],
      primary,
    };
  },
};
