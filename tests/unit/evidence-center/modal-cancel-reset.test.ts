/**
 * Modal Cancel must clear the pending batch; native picker Cancel must not.
 */

import { describe, expect, it } from "vitest";
import {
  clearEvidenceUploadModalBatchState,
  resolveEvidenceUploadBatchSelection,
  resetEvidenceQueueClientIdForTests,
} from "@/lib/evidence-center/bulk-queue";

function fakeFile(name: string, size = 10): File {
  return new File([new Uint8Array(size)], name, { type: "application/pdf" });
}

describe("evidence upload modal Cancel reset", () => {
  it("clears a selected batch so reopen starts with zero files", () => {
    resetEvidenceQueueClientIdForTests();
    const selected = resolveEvidenceUploadBatchSelection({
      previousItems: [],
      evidenceName: "",
      pickedFiles: [
        fakeFile("a.pdf"),
        fakeFile("b.pdf"),
        fakeFile("c.pdf"),
        fakeFile("d.pdf"),
        fakeFile("e.pdf"),
      ],
    });
    expect(selected.kind).toBe("selected");
    if (selected.kind !== "selected") return;
    expect(selected.items).toHaveLength(5);

    const cleared = clearEvidenceUploadModalBatchState({
      queue: selected.items,
      evidenceName: selected.evidenceName || "batch",
      error: "stale overflow warning",
      batchSummary: "2 of 5 uploaded",
      loading: false,
      dragOver: true,
      fileInputKey: 3,
    });

    expect(cleared.queue).toEqual([]);
    expect(cleared.evidenceName).toBe("");
    expect(cleared.error).toBe("");
    expect(cleared.batchSummary).toBe("");
    expect(cleared.loading).toBe(false);
    expect(cleared.dragOver).toBe(false);
    expect(cleared.fileInputKey).toBe(4);

    // Reopen starts empty — next selection is a fresh batch.
    const reopen = resolveEvidenceUploadBatchSelection({
      previousItems: cleared.queue,
      evidenceName: cleared.evidenceName,
      pickedFiles: null,
    });
    expect(reopen.kind).toBe("unchanged");
    expect(cleared.queue).toHaveLength(0);
  });

  it("native picker Cancel preserves an existing selection", () => {
    const selected = resolveEvidenceUploadBatchSelection({
      previousItems: [],
      evidenceName: "",
      pickedFiles: [fakeFile("keep.pdf"), fakeFile("keep2.pdf")],
    });
    expect(selected.kind).toBe("selected");
    if (selected.kind !== "selected") return;

    const pickerCancel = resolveEvidenceUploadBatchSelection({
      previousItems: selected.items,
      evidenceName: selected.evidenceName,
      pickedFiles: [],
    });
    expect(pickerCancel.kind).toBe("unchanged");
  });

  it("same-file reselect works after modal Cancel clear", () => {
    const file = fakeFile("again.pdf");
    const first = resolveEvidenceUploadBatchSelection({
      previousItems: [],
      evidenceName: "",
      pickedFiles: [file],
    });
    expect(first.kind).toBe("selected");
    if (first.kind !== "selected") return;

    const cleared = clearEvidenceUploadModalBatchState({
      queue: first.items,
      evidenceName: first.evidenceName,
      error: "",
      batchSummary: "",
      loading: false,
      dragOver: false,
      fileInputKey: 0,
    });

    const again = resolveEvidenceUploadBatchSelection({
      previousItems: cleared.queue,
      evidenceName: cleared.evidenceName,
      pickedFiles: [file],
    });
    expect(again.kind).toBe("selected");
    if (again.kind !== "selected") return;
    expect(again.items).toHaveLength(1);
    expect(again.items[0]?.file).toBe(file);
    expect(again.items[0]?.displayName).toBe("again.pdf");
  });
});
