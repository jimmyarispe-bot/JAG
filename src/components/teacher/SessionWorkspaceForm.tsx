"use client";

import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";
import { assertActionResult } from "@/components/experience-system/feedback/runMutation";
import { parseImprovementAttachmentRefs } from "@/lib/instruction/continuous-improvement-parse";
import { completeSessionAction, updateSessionDeliveryAction } from "@/lib/teacher/actions";

function jsonArrayToLines(value: unknown): string {
  if (!Array.isArray(value)) return "";
  return value.map(String).join("\n");
}

interface SessionWorkspaceFormProps {
  sessionId: string;
  delivery?: {
    session_notes?: string | null;
    homework?: string | null;
    lesson_objectives?: unknown;
    standards?: string[] | null;
    learning_targets?: unknown;
    activities?: unknown;
    attachment_refs?: unknown;
  } | null;
}

export function SessionWorkspaceForm({ sessionId, delivery }: SessionWorkspaceFormProps) {
  const saveAction = useActionFeedback({
    verb: "save",
    labels: { idle: "Save lesson plan" },
    successToast: "✓ Lesson plan saved.",
    errorToast: "Unable to save lesson plan.",
    progressLabel: "Saving lesson plan…",
  });
  const completeAction = useActionFeedback({
    verb: "custom",
    labels: { idle: "Complete session", loading: "Completing…", success: "✓ Completed", error: "Unable to complete" },
    successToast: "✓ Session completed.",
    errorToast: "Unable to complete session.",
    progressLabel: "Completing session…",
  });
  const improvementMeta = parseImprovementAttachmentRefs(delivery?.attachment_refs);

  return (
    <form
      id="session-workspace-form"
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void saveAction.run(async () => {
          const fd = new FormData(e.currentTarget);
          fd.set("session_id", sessionId);
          const toJson = (name: string) => {
            const text = fd.get(name + "_text") as string;
            fd.set(name, JSON.stringify(text.split("\n").map((l) => l.trim()).filter(Boolean)));
          };
          toJson("lesson_objectives");
          toJson("learning_targets");
          toJson("activities");
          const result = await updateSessionDeliveryAction(fd);
          assertActionResult(result);
          return result ?? { success: true };
        });
      }}
    >
      <div>
        <label className="block text-sm font-medium text-slate-700">Lesson objectives (one per line)</label>
        <textarea
          name="lesson_objectives_text"
          defaultValue={jsonArrayToLines(delivery?.lesson_objectives)}
          rows={3}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Standards (comma-separated)</label>
        <input
          name="standards"
          defaultValue={(delivery?.standards ?? []).join(", ")}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Learning targets (one per line)</label>
        <textarea
          name="learning_targets_text"
          defaultValue={jsonArrayToLines(delivery?.learning_targets)}
          rows={2}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Activities (one per line)</label>
        <textarea
          name="activities_text"
          defaultValue={jsonArrayToLines(delivery?.activities)}
          rows={3}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Session notes</label>
        <textarea
          name="session_notes"
          defaultValue={delivery?.session_notes ?? ""}
          rows={4}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Homework</label>
        <textarea
          name="homework"
          defaultValue={delivery?.homework ?? ""}
          rows={2}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Teacher reflection</label>
        <p className="text-xs text-slate-500">What worked, what to adjust — feeds The JAG™ Continuous Improvement Loop.</p>
        <textarea
          name="teacher_reflection"
          defaultValue={improvementMeta.teacherReflection ?? ""}
          rows={3}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Learner engagement</label>
        <select
          name="learner_engagement"
          defaultValue={improvementMeta.learnerEngagement}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="unknown">Not recorded</option>
          <option value="active">Active — fully engaged</option>
          <option value="moderate">Moderate — participated with prompts</option>
          <option value="minimal">Minimal — disengaged or distracted</option>
        </select>
      </div>
      <div className="flex flex-wrap gap-2">
        <ActionButton
          type="submit"
          status={saveAction.status}
          verb="save"
          labels={{ idle: "Save lesson plan" }}
          className="!bg-slate-800 hover:!bg-slate-900"
          errorMessage={saveAction.errorMessage}
        />
        <ActionButton
          type="button"
          status={completeAction.status}
          verb="custom"
          labels={{ idle: "Complete session", loading: "Completing…", success: "✓ Completed", error: "Unable to complete" }}
          errorMessage={completeAction.errorMessage}
          onClick={() => {
            void completeAction.run(async () => {
              const form = document.getElementById("session-workspace-form") as HTMLFormElement | null;
              const notes = (form?.querySelector('[name="session_notes"]') as HTMLTextAreaElement)?.value ?? "";
              const hw = (form?.querySelector('[name="homework"]') as HTMLTextAreaElement)?.value ?? "";
              const reflection =
                (form?.querySelector('[name="teacher_reflection"]') as HTMLTextAreaElement)?.value ?? "";
              const engagement =
                (form?.querySelector('[name="learner_engagement"]') as HTMLSelectElement)?.value ?? "unknown";
              const fd = new FormData();
              fd.set("session_id", sessionId);
              fd.set("session_notes", notes);
              fd.set("homework", hw);
              fd.set("teacher_reflection", reflection);
              fd.set("learner_engagement", engagement);
              const result = await completeSessionAction(fd);
              assertActionResult(result);
              return result ?? { success: true };
            });
          }}
        />
      </div>
    </form>
  );
}
