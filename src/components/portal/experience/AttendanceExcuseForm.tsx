"use client";

import { useState } from "react";
import { experienceRequestExcuse } from "@/lib/portal/experience/actions";
import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";

export function AttendanceExcuseForm({
  students,
  organizationId,
  userId,
}: {
  students: { id: string; name: string }[];
  organizationId: string;
  userId: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const action = useActionFeedback({
    verb: "submit",
    successToast: "Excuse request recorded",
    errorToast: "Unable to submit request.",
    onError: (err) => setError(err.message),
  });

  if (!students.length) return null;

  return (
    <form
      className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const formData = new FormData(e.currentTarget);
        formData.set("organization_id", organizationId);
        formData.set("user_id", userId);
        void action.run(async () => {
          const result = await experienceRequestExcuse(formData);
          if ("error" in result && result.error) throw new Error(result.error);
          return result;
        });
      }}
    >
      <h2 className="font-semibold text-slate-900">Excused absence request</h2>
      <p className="text-sm text-slate-600">
        Submits a request event for school staff — does not invent attendance rules.
      </p>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Student</span>
          <select name="student_id" required className="w-full rounded-lg border border-slate-300 px-3 py-2">
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Date</span>
          <input name="date" type="date" required className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        </label>
      </div>
      <ActionButton
        type="submit"
        status={action.status}
        verb="submit"
        labels={{ idle: "Request excuse", loading: "Submitting…", success: "✓ Submitted" }}
      />
    </form>
  );
}
