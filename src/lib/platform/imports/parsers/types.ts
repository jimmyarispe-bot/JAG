import type { ImportSourceFormat, ParsedWorkbook } from "../types";

export interface FileParseInput {
  fileName: string;
  fileSizeBytes: number;
  /** UTF-8 text for CSV / Google Sheets CSV export */
  text?: string;
  /** Binary contents for Excel (.xlsx / .xls) as base64 */
  base64?: string;
  formatHint?: ImportSourceFormat;
}

export interface FileParser {
  formats: ImportSourceFormat[];
  canParse(input: FileParseInput): boolean;
  parse(input: FileParseInput): ParsedWorkbook;
}
