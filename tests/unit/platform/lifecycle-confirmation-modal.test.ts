import { describe, expect, it } from "vitest";
import {
  DELETE_CONFIRMATION_TOKEN,
  canSubmitLifecycleDelete,
  lifecycleConfirmLabel,
  lifecycleModalBody,
  lifecycleModalTitle,
} from "@/components/platform/modals";

describe("LifecycleConfirmationModal copy + delete gate", () => {
  it("builds Student archive / restore / delete titles and labels", () => {
    expect(lifecycleModalTitle("archive", "Student")).toBe("Archive Student");
    expect(lifecycleModalTitle("delete", "Student")).toBe(
      "Permanently Delete Student"
    );
    expect(lifecycleModalTitle("restore", "Student")).toBe("Restore Student");
    expect(lifecycleConfirmLabel("archive", "Student")).toBe("Archive Student");
    expect(lifecycleConfirmLabel("delete", "Student")).toBe("Delete Student");
    expect(lifecycleConfirmLabel("restore", "Student")).toBe("Restore Student");
  });

  it("uses the specified Student delete body copy", () => {
    expect(lifecycleModalBody("delete", "Student")).toEqual([
      "This action permanently deletes this student.",
      "This cannot be undone.",
      "Only students with no dependent records can be permanently deleted.",
    ]);
  });

  it("uses the specified Student archive body copy", () => {
    expect(lifecycleModalBody("archive", "Student")).toEqual([
      "Archiving removes the student from active records while preserving all historical data.",
      "The student can be restored later.",
    ]);
  });

  it("disables delete until checkbox + DELETE token are satisfied", () => {
    expect(canSubmitLifecycleDelete(false, "DELETE")).toBe(false);
    expect(canSubmitLifecycleDelete(true, "delete")).toBe(false);
    expect(canSubmitLifecycleDelete(true, "DELETE ")).toBe(false);
    expect(canSubmitLifecycleDelete(true, DELETE_CONFIRMATION_TOKEN)).toBe(true);
    expect(
      canSubmitLifecycleDelete(true, DELETE_CONFIRMATION_TOKEN, true)
    ).toBe(false);
  });
});
