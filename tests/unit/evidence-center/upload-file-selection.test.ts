/**
 * Evidence upload file-selection replacement semantics.
 */

import { describe, expect, it } from "vitest";
import {
  resolveEvidenceUploadFileSelection,
  stemFromFilename,
} from "@/lib/evidence-center/upload-file-selection";

function fakeFile(name: string, size: number, type: string): File {
  const bytes = new Uint8Array(Math.max(0, size));
  return new File([bytes], name, { type });
}

describe("resolveEvidenceUploadFileSelection", () => {
  it("selects the first file", () => {
    const first = fakeFile(
      "Student_Admissions_Spreadsheet_1786731382.xlsx",
      1200,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    const result = resolveEvidenceUploadFileSelection({
      previousFile: null,
      evidenceName: "",
      pickedFiles: [first],
    });
    expect(result.kind).toBe("selected");
    if (result.kind !== "selected") return;
    expect(result.file).toBe(first);
    expect(result.displayName).toBe(
      "Student_Admissions_Spreadsheet_1786731382.xlsx"
    );
    expect(result.byteSize).toBe(1200);
    expect(result.mimeType).toContain("spreadsheetml");
    expect(result.evidenceName).toBe(
      "Student_Admissions_Spreadsheet_1786731382"
    );
  });

  it("replaces the first file when a different second file is selected", () => {
    const first = fakeFile(
      "Student_Admissions_Spreadsheet_1786731382.xlsx",
      1200,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    const second = fakeFile("board-pack.pdf", 4096, "application/pdf");
    const afterFirst = resolveEvidenceUploadFileSelection({
      previousFile: null,
      evidenceName: "",
      pickedFiles: [first],
    });
    expect(afterFirst.kind).toBe("selected");
    if (afterFirst.kind !== "selected") return;

    const afterSecond = resolveEvidenceUploadFileSelection({
      previousFile: afterFirst.file,
      evidenceName: afterFirst.evidenceName,
      pickedFiles: [second],
    });
    expect(afterSecond.kind).toBe("selected");
    if (afterSecond.kind !== "selected") return;
    expect(afterSecond.file).toBe(second);
    expect(afterSecond.file).not.toBe(first);
    expect(afterSecond.displayName).toBe("board-pack.pdf");
    expect(afterSecond.byteSize).toBe(4096);
    expect(afterSecond.mimeType).toBe("application/pdf");
    expect(afterSecond.evidenceName).toBe("board-pack");
  });

  it("allows selecting the same file again after clear", () => {
    const file = fakeFile("notes.txt", 10, "text/plain");
    const selected = resolveEvidenceUploadFileSelection({
      previousFile: null,
      evidenceName: "",
      pickedFiles: [file],
    });
    expect(selected.kind).toBe("selected");

    const clearedThenReselected = resolveEvidenceUploadFileSelection({
      previousFile: null,
      evidenceName: "",
      pickedFiles: [file],
    });
    expect(clearedThenReselected.kind).toBe("selected");
    if (clearedThenReselected.kind !== "selected") return;
    expect(clearedThenReselected.file).toBe(file);
    expect(clearedThenReselected.displayName).toBe("notes.txt");
  });

  it("keeps the existing selection when the picker is canceled", () => {
    const existing = fakeFile("keep-me.pdf", 500, "application/pdf");
    const result = resolveEvidenceUploadFileSelection({
      previousFile: existing,
      evidenceName: "keep-me",
      pickedFiles: [],
    });
    expect(result).toEqual({ kind: "unchanged" });

    const canceledNull = resolveEvidenceUploadFileSelection({
      previousFile: existing,
      evidenceName: "keep-me",
      pickedFiles: null,
    });
    expect(canceledNull).toEqual({ kind: "unchanged" });
  });

  it("keeps a user-edited evidence name when replacing the file", () => {
    const first = fakeFile("auto.xlsx", 10, "text/csv");
    const second = fakeFile("other.pdf", 20, "application/pdf");
    const result = resolveEvidenceUploadFileSelection({
      previousFile: first,
      evidenceName: "My Custom Title",
      pickedFiles: [second],
    });
    expect(result.kind).toBe("selected");
    if (result.kind !== "selected") return;
    expect(result.file).toBe(second);
    expect(result.displayName).toBe("other.pdf");
    expect(result.evidenceName).toBe("My Custom Title");
  });

  it("maps displayed metadata from the current File only", () => {
    expect(stemFromFilename("a.b.c.pdf")).toBe("a.b.c");
    const file = fakeFile("report.docx", 2048, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    const result = resolveEvidenceUploadFileSelection({
      previousFile: fakeFile("old.txt", 1, "text/plain"),
      evidenceName: "old",
      pickedFiles: [file],
    });
    expect(result.kind).toBe("selected");
    if (result.kind !== "selected") return;
    expect(result.displayName).toBe(file.name);
    expect(result.byteSize).toBe(file.size);
    expect(result.mimeType).toBe(file.type);
  });
});
