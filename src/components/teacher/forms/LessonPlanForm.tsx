"use client";

import { saveLessonPlanAction } from "@/lib/teacher/actions";
import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";
import { assertActionResult } from "@/components/experience-system/feedback/runMutation";
import { inputClass, linesToJsonArray } from "./shared";

export function LessonPlanForm() {
  const action = useActionFeedback({
    verb: "publish",
    labels: { idle: "Publish lesson plan", loading: "Saving…", success: "✓ Published" },
    successToast: "✓ Published",
    progressLabel: "Publishing lesson plan…",
  });

  return (
    <form
      className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set("objectives", linesToJsonArray(fd.get("objectives_text") as string));
        fd.set("materials", linesToJsonArray(fd.get("materials_text") as string));
        fd.set("activities", linesToJsonArray(fd.get("activities_text") as string));
        void action.run(async () => {
          const r = await saveLessonPlanAction(fd);
          assertActionResult(r);
          return r;
        });
      }}
    >
      <h3 className="font-semibold text-slate-900">Create reusable lesson plan</h3>
      <input name="title" placeholder="Plan title" className={inputClass} required />
      <select name="subject_domain" className={inputClass}>
        <option value="reading">Reading</option>
        <option value="writing">Writing</option>
        <option value="math">Math</option>
        <option value="structured_literacy">Structured Literacy</option>
        <option value="other">Other</option>
      </select>
      <textarea name="objectives_text" placeholder="Objectives (one per line)" rows={2} className={inputClass} />
      <textarea name="materials_text" placeholder="Materials (one per line)" rows={2} className={inputClass} />
      <textarea name="activities_text" placeholder="Activities (one per line)" rows={2} className={inputClass} />
      <textarea name="differentiation" placeholder="Differentiation" rows={2} className={inputClass} />
      <textarea name="accommodations" placeholder="Accommodations" rows={2} className={inputClass} />
      <input name="homework" placeholder="Homework" className={inputClass} />
      <ActionButton
        type="submit"
        status={action.status}
        verb="publish"
        labels={{ idle: "Publish lesson plan", loading: "Saving…", success: "✓ Published" }}
        errorMessage={action.errorMessage}
      />
    </form>
  );
}
