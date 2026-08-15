/**
 * Phase 3 — bulk queue selection, validation, and orchestration tests.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  MAX_BULK_EVIDENCE_CONCURRENCY,
  MAX_BULK_EVIDENCE_FILES,
} from "@/lib/evidence-center/bulk-constants";
import {
  resolveEvidenceUploadBatchSelection,
  resetEvidenceQueueClientIdForTests,
  summarizeEvidenceQueue,
  type EvidenceUploadQueueItem,
} from "@/lib/evidence-center/bulk-queue";
import {
  mapWithConcurrency,
  runJagEvidenceBulkUpload,
  selectItemsForBulkUpload,
} from "@/lib/evidence-center/bulk-upload";
import { JAG_EVIDENCE_MAX_BYTES } from "@/lib/evidence-center/storage";
import { resolveEvidenceUploadFileSelection } from "@/lib/evidence-center/upload-file-selection";

function fakeFile(name: string, size: number, type: string): File {
  const bytes = new Uint8Array(Math.max(0, Math.min(size, 64)));
  // Preserve reported size via Object.defineProperty when larger than buffer
  const file = new File([bytes], name, { type });
  if (size !== bytes.length) {
    Object.defineProperty(file, "size", { value: size });
  }
  return file;
}

afterEach(() => {
  resetEvidenceQueueClientIdForTests();
  vi.restoreAllMocks();
});

describe("single-file selection regression", () => {
  it("still replaces and cancels correctly", () => {
    const first = fakeFile("a.pdf", 10, "application/pdf");
    const second = fakeFile("b.pdf", 20, "application/pdf");
    const s1 = resolveEvidenceUploadFileSelection({
      previousFile: null,
      evidenceName: "",
      pickedFiles: [first],
    });
    expect(s1.kind).toBe("selected");
    if (s1.kind !== "selected") return;
    const s2 = resolveEvidenceUploadFileSelection({
      previousFile: s1.file,
      evidenceName: s1.evidenceName,
      pickedFiles: [second],
    });
    expect(s2.kind).toBe("selected");
    if (s2.kind !== "selected") return;
    expect(s2.file).toBe(second);
    const cancel = resolveEvidenceUploadFileSelection({
      previousFile: s2.file,
      evidenceName: s2.evidenceName,
      pickedFiles: [],
    });
    expect(cancel.kind).toBe("unchanged");
  });
});

describe("bulk queue selection", () => {
  it("selects one file with single-file name behavior", () => {
    const file = fakeFile("report.pdf", 100, "application/pdf");
    const result = resolveEvidenceUploadBatchSelection({
      previousItems: [],
      evidenceName: "",
      pickedFiles: [file],
    });
    expect(result.kind).toBe("selected");
    if (result.kind !== "selected") return;
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.displayName).toBe("report.pdf");
    expect(result.items[0]?.documentName).toBe("report");
    expect(result.items[0]?.validationStatus).toBe("valid");
    expect(result.evidenceName).toBe("report");
  });

  it("selects multiple files and replaces the previous batch", () => {
    const a = fakeFile("a.pdf", 10, "application/pdf");
    const b = fakeFile("b.pdf", 20, "application/pdf");
    const first = resolveEvidenceUploadBatchSelection({
      previousItems: [],
      evidenceName: "",
      pickedFiles: [a],
    });
    expect(first.kind).toBe("selected");
    if (first.kind !== "selected") return;
    const second = resolveEvidenceUploadBatchSelection({
      previousItems: first.items,
      evidenceName: first.evidenceName,
      pickedFiles: [a, b],
    });
    expect(second.kind).toBe("selected");
    if (second.kind !== "selected") return;
    expect(second.items).toHaveLength(2);
    expect(second.items.map((i) => i.displayName)).toEqual(["a.pdf", "b.pdf"]);
    expect(second.items.every((i) => i.validationStatus === "valid")).toBe(true);
  });

  it("cancel preserves selection", () => {
    const file = fakeFile("keep.pdf", 10, "application/pdf");
    const selected = resolveEvidenceUploadBatchSelection({
      previousItems: [],
      evidenceName: "",
      pickedFiles: [file],
    });
    expect(selected.kind).toBe("selected");
    if (selected.kind !== "selected") return;
    const canceled = resolveEvidenceUploadBatchSelection({
      previousItems: selected.items,
      evidenceName: selected.evidenceName,
      pickedFiles: [],
    });
    expect(canceled.kind).toBe("unchanged");
  });

  it("same-file reselect after clear works", () => {
    const file = fakeFile("notes.txt", 10, "text/plain");
    const again = resolveEvidenceUploadBatchSelection({
      previousItems: [],
      evidenceName: "",
      pickedFiles: [file],
    });
    expect(again.kind).toBe("selected");
    if (again.kind !== "selected") return;
    expect(again.items[0]?.file).toBe(file);
  });

  it("rejects files beyond the first 25 with explicit invalid entries", () => {
    const files = Array.from({ length: MAX_BULK_EVIDENCE_FILES + 3 }, (_, i) =>
      fakeFile(`f${i}.pdf`, 10, "application/pdf")
    );
    const result = resolveEvidenceUploadBatchSelection({
      previousItems: [],
      evidenceName: "",
      pickedFiles: files,
    });
    expect(result.kind).toBe("selected");
    if (result.kind !== "selected") return;
    expect(result.items).toHaveLength(MAX_BULK_EVIDENCE_FILES + 3);
    expect(result.overflowCount).toBe(3);
    const overflow = result.items.slice(MAX_BULK_EVIDENCE_FILES);
    expect(overflow.every((i) => i.validationStatus === "invalid")).toBe(true);
    expect(overflow[0]?.validationError).toMatch(/Batch limit is 25/);
    const valid = result.items.filter((i) => i.validationStatus === "valid");
    expect(valid).toHaveLength(MAX_BULK_EVIDENCE_FILES);
  });
});

describe("bulk validation", () => {
  it("accepts allowed MIME and exactly 20 MiB", () => {
    const ok = resolveEvidenceUploadBatchSelection({
      previousItems: [],
      evidenceName: "",
      pickedFiles: [
        fakeFile("ok.pdf", JAG_EVIDENCE_MAX_BYTES, "application/pdf"),
      ],
    });
    expect(ok.kind).toBe("selected");
    if (ok.kind !== "selected") return;
    expect(ok.items[0]?.validationStatus).toBe("valid");
  });

  it("rejects unsupported MIME and oversized files without upload eligibility", () => {
    const result = resolveEvidenceUploadBatchSelection({
      previousItems: [],
      evidenceName: "",
      pickedFiles: [
        fakeFile("bad.exe", 10, "application/octet-stream"),
        fakeFile("big.pdf", JAG_EVIDENCE_MAX_BYTES + 1, "application/pdf"),
        fakeFile("good.pdf", 10, "application/pdf"),
      ],
    });
    expect(result.kind).toBe("selected");
    if (result.kind !== "selected") return;
    expect(result.items[0]?.validationStatus).toBe("invalid");
    expect(result.items[1]?.validationStatus).toBe("invalid");
    expect(result.items[2]?.validationStatus).toBe("valid");
    expect(result.items[2]?.uploadStatus).toBe("pending");
    const eligible = selectItemsForBulkUpload(result.items, "all-valid-pending");
    expect(eligible).toHaveLength(1);
    expect(eligible[0]?.displayName).toBe("good.pdf");
  });
});

describe("bulk orchestration", () => {
  function queueFromFiles(files: File[]): EvidenceUploadQueueItem[] {
    const selected = resolveEvidenceUploadBatchSelection({
      previousItems: [],
      evidenceName: "",
      pickedFiles: files,
    });
    if (selected.kind !== "selected") throw new Error("expected selected");
    return [...selected.items];
  }

  it("all files succeed", async () => {
    const items = queueFromFiles([
      fakeFile("a.pdf", 10, "application/pdf"),
      fakeFile("b.pdf", 10, "application/pdf"),
    ]);
    const uploadOne = vi.fn(async ({ file }: { file: File }) => ({
      documentId: `doc-${file.name}`,
      versionId: `ver-${file.name}`,
    }));
    const result = await runJagEvidenceBulkUpload({
      organizationId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      organizationName: "Org",
      items,
      sharedMetadata: { domain: "General" },
      uploadOne,
    });
    expect(result.every((i) => i.uploadStatus === "success")).toBe(true);
    expect(uploadOne).toHaveBeenCalledTimes(2);
  });

  it("one failure does not fail siblings", async () => {
    const items = queueFromFiles([
      fakeFile("a.pdf", 10, "application/pdf"),
      fakeFile("b.pdf", 10, "application/pdf"),
      fakeFile("c.pdf", 10, "application/pdf"),
    ]);
    const uploadOne = vi.fn(async ({ file }: { file: File }) => {
      if (file.name === "b.pdf") throw new Error("verify failed");
      return { documentId: `doc-${file.name}`, versionId: `ver-${file.name}` };
    });
    const result = await runJagEvidenceBulkUpload({
      organizationId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      organizationName: "Org",
      items,
      sharedMetadata: {},
      uploadOne,
    });
    const byName = Object.fromEntries(result.map((i) => [i.displayName, i]));
    expect(byName["a.pdf"]?.uploadStatus).toBe("success");
    expect(byName["b.pdf"]?.uploadStatus).toBe("failed");
    expect(byName["b.pdf"]?.error).toMatch(/verify failed/);
    expect(byName["c.pdf"]?.uploadStatus).toBe("success");
  });

  it("retry only failed files and does not re-upload successes", async () => {
    const items = queueFromFiles([
      fakeFile("a.pdf", 10, "application/pdf"),
      fakeFile("b.pdf", 10, "application/pdf"),
    ]);
    let failB = true;
    const uploadOne = vi.fn(async ({ file }: { file: File }) => {
      if (file.name === "b.pdf" && failB) throw new Error("temp");
      return { documentId: `doc-${file.name}`, versionId: `ver-${file.name}` };
    });
    const first = await runJagEvidenceBulkUpload({
      organizationId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      organizationName: "Org",
      items,
      sharedMetadata: {},
      uploadOne,
    });
    expect(uploadOne).toHaveBeenCalledTimes(2);
    failB = false;
    const second = await runJagEvidenceBulkUpload({
      organizationId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      organizationName: "Org",
      items: first,
      sharedMetadata: {},
      mode: "failed-only",
      uploadOne,
    });
    expect(uploadOne).toHaveBeenCalledTimes(3);
    expect(second.find((i) => i.displayName === "a.pdf")?.uploadStatus).toBe(
      "success"
    );
    expect(second.find((i) => i.displayName === "b.pdf")?.uploadStatus).toBe(
      "success"
    );
  });

  it("bounds concurrency to 3", async () => {
    let inflight = 0;
    let maxInflight = 0;
    const files = Array.from({ length: 8 }, (_, i) =>
      fakeFile(`f${i}.pdf`, 10, "application/pdf")
    );
    const items = queueFromFiles(files);
    await runJagEvidenceBulkUpload({
      organizationId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      organizationName: "Org",
      items,
      sharedMetadata: {},
      concurrency: MAX_BULK_EVIDENCE_CONCURRENCY,
      uploadOne: async ({ file }) => {
        inflight += 1;
        maxInflight = Math.max(maxInflight, inflight);
        await new Promise((r) => setTimeout(r, 20));
        inflight -= 1;
        return { documentId: `d-${file.name}`, versionId: `v-${file.name}` };
      },
    });
    expect(maxInflight).toBeLessThanOrEqual(MAX_BULK_EVIDENCE_CONCURRENCY);
    expect(maxInflight).toBeGreaterThan(1);
  });

  it("mapWithConcurrency continues when workers catch their own errors", async () => {
    const soft = await mapWithConcurrency([1, 2, 3], 2, async (n) => {
      try {
        if (n === 2) throw new Error("boom");
        return { n, ok: true as const };
      } catch {
        return { n, ok: false as const };
      }
    });
    expect(soft).toEqual([
      { n: 1, ok: true },
      { n: 2, ok: false },
      { n: 3, ok: true },
    ]);
  });
});

describe("lifecycle contract via uploadOne", () => {
  it("success path records AVAILABLE-equivalent success only after uploadOne resolves", async () => {
    const items = resolveEvidenceUploadBatchSelection({
      previousItems: [],
      evidenceName: "",
      pickedFiles: [fakeFile("x.pdf", 10, "application/pdf")],
    });
    if (items.kind !== "selected") throw new Error("selected");
    let resolved = false;
    const result = await runJagEvidenceBulkUpload({
      organizationId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      organizationName: "Org",
      items: items.items,
      sharedMetadata: {},
      uploadOne: async () => {
        // Simulate server verification gate — browser PUT alone is not enough.
        await new Promise((r) => setTimeout(r, 5));
        resolved = true;
        return {
          documentId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
          versionId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
        };
      },
    });
    expect(resolved).toBe(true);
    expect(result[0]?.uploadStatus).toBe("success");
    expect(result[0]?.documentId).toBeTruthy();
  });

  it("failed verification marks FAILED without success siblings affected", async () => {
    const selected = resolveEvidenceUploadBatchSelection({
      previousItems: [],
      evidenceName: "",
      pickedFiles: [
        fakeFile("ok.pdf", 10, "application/pdf"),
        fakeFile("bad.pdf", 10, "application/pdf"),
      ],
    });
    if (selected.kind !== "selected") throw new Error("selected");
    const result = await runJagEvidenceBulkUpload({
      organizationId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      organizationName: "Org",
      items: selected.items,
      sharedMetadata: {},
      uploadOne: async ({ file }) => {
        if (file.name === "bad.pdf") {
          throw new Error("Uploaded object was not found in storage.");
        }
        return {
          documentId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
          versionId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
        };
      },
    });
    expect(result.find((i) => i.displayName === "ok.pdf")?.uploadStatus).toBe(
      "success"
    );
    expect(result.find((i) => i.displayName === "bad.pdf")?.uploadStatus).toBe(
      "failed"
    );
  });

  it("browser success alone cannot mark AVAILABLE — uploadOne must complete", async () => {
    const selected = resolveEvidenceUploadBatchSelection({
      previousItems: [],
      evidenceName: "",
      pickedFiles: [fakeFile("x.pdf", 10, "application/pdf")],
    });
    if (selected.kind !== "selected") throw new Error("selected");
    const result = await runJagEvidenceBulkUpload({
      organizationId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      organizationName: "Org",
      items: selected.items,
      sharedMetadata: {},
      uploadOne: async () => {
        throw new Error("verification required");
      },
    });
    expect(result[0]?.uploadStatus).toBe("failed");
    expect(result[0]?.documentId).toBeNull();
  });
});

describe("security contracts", () => {
  it("passes organizationId through to uploadOne without client path/ids", async () => {
    const selected = resolveEvidenceUploadBatchSelection({
      previousItems: [],
      evidenceName: "",
      pickedFiles: [fakeFile("x.pdf", 10, "application/pdf")],
    });
    if (selected.kind !== "selected") throw new Error("selected");
    const ORG = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const uploadOne = vi.fn(async (input: {
      organizationId: string;
      file: File;
      metadata?: Record<string, unknown>;
    }) => {
      expect(input.organizationId).toBe(ORG);
      expect(input.metadata?.name).toBe("x");
      expect(input).not.toHaveProperty("storagePath");
      return {
        documentId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
        versionId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      };
    });
    await runJagEvidenceBulkUpload({
      organizationId: ORG,
      organizationName: "Org",
      items: selected.items,
      sharedMetadata: { domain: "General" },
      uploadOne,
    });
    expect(uploadOne).toHaveBeenCalledOnce();
  });
});

describe("queue summary", () => {
  it("summarizes mixed states", () => {
    const selected = resolveEvidenceUploadBatchSelection({
      previousItems: [],
      evidenceName: "",
      pickedFiles: [
        fakeFile("a.pdf", 10, "application/pdf"),
        fakeFile("b.exe", 10, "application/octet-stream"),
      ],
    });
    if (selected.kind !== "selected") throw new Error("selected");
    const summary = summarizeEvidenceQueue(selected.items);
    expect(summary.total).toBe(2);
    expect(summary.valid).toBe(1);
    expect(summary.invalid).toBe(1);
  });
});
