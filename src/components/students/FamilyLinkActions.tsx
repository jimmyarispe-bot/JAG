"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createFamilyWithGuardians,
  linkStudentToFamily,
} from "@/lib/families/actions";
import { EnrollmentFamilyFields, type FamilyOption } from "@/components/students/EnrollmentFamilyFields";
import { ActionButton, ErrorBanner, useActionFeedback } from "@/components/experience-system/feedback";

interface FamilyLinkActionsProps {
  studentId: string;
  studentLastName: string;
  schoolId: string;
  families: FamilyOption[];
  canManage: boolean;
}

/**
 * Student Profile empty-state actions: Create Family / Link Existing Family.
 */
export function FamilyLinkActions({
  studentId,
  studentLastName,
  schoolId,
  families,
  canManage,
}: FamilyLinkActionsProps) {
  const router = useRouter();
  const [panel, setPanel] = useState<"none" | "create" | "link">("none");
  const action = useActionFeedback({
    verb: "save",
    labels: { idle: "Save", loading: "Saving…", success: "✓ Linked" },
    successToast: "✓ Family linked",
    errorToast: "Unable to update family.",
    progressLabel: "Updating family…",
  });

  if (!canManage) {
    return (
      <p className="text-sm text-slate-500">
        No family has been linked yet. Contact Admissions or School Leadership to add family
        records.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">No family has been linked yet.</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setPanel(panel === "create" ? "none" : "create")}
          className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Create Family
        </button>
        <button
          type="button"
          onClick={() => setPanel(panel === "link" ? "none" : "link")}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Link Existing Family
        </button>
      </div>

      {action.errorMessage && (
        <ErrorBanner message={action.errorMessage} title="Could not update family" />
      )}

      {panel === "create" && (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            formData.set("school_id", schoolId);
            formData.set("student_id", studentId);
            formData.set("student_last_name", studentLastName);
            void action.run(async () => {
              const result = await createFamilyWithGuardians(formData);
              if ("error" in result) throw new Error(result.error);
              router.refresh();
              setPanel("none");
              return result;
            });
          }}
        >
          <input type="hidden" name="school_id" value={schoolId} />
          <EnrollmentFamilyFields
            families={families}
            studentId={studentId}
            studentLastName={studentLastName}
            forcedMode="new"
            canManage
          />
          <ActionButton
            type="submit"
            status={action.status}
            verb="create"
            labels={{ idle: "Create & Link Family" }}
            errorMessage={action.errorMessage}
          />
        </form>
      )}

      {panel === "link" && (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            formData.set("student_id", studentId);
            void action.run(async () => {
              const result = await linkStudentToFamily(formData);
              if ("error" in result) throw new Error(result.error);
              router.refresh();
              setPanel("none");
              return result;
            });
          }}
        >
          <EnrollmentFamilyFields
            families={families}
            studentId={studentId}
            studentLastName={studentLastName}
            forcedMode="existing"
            canManage
          />
          <ActionButton
            type="submit"
            status={action.status}
            verb="save"
            labels={{ idle: "Link Family" }}
            errorMessage={action.errorMessage}
          />
        </form>
      )}
    </div>
  );
}
