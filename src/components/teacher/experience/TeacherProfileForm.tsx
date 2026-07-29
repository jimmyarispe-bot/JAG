"use client";

import { useState } from "react";
import { teacherExperienceUpdateProfile } from "@/lib/teacher/experience/actions";
import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";

export function TeacherProfileForm({
  userId,
  organizationId,
}: {
  userId: string;
  organizationId: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const action = useActionFeedback({
    verb: "save",
    successToast: "Preferences saved",
    errorToast: "Unable to save.",
    onError: (err) => setError(err.message),
  });

  return (
    <form
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const formData = new FormData(e.currentTarget);
        formData.set("user_id", userId);
        formData.set("organization_id", organizationId);
        formData.set(
          "notifications",
          JSON.stringify({
            email: formData.get("email_notifications") === "true",
            meeting_reminders: formData.get("meeting_reminders") === "true",
          })
        );
        formData.set(
          "accessibility",
          JSON.stringify({
            meeting_link: String(formData.get("meeting_link") ?? ""),
            availability: String(formData.get("availability") ?? ""),
            teaching_preferences: String(formData.get("teaching_preferences") ?? ""),
          })
        );
        void action.run(async () => {
          const result = await teacherExperienceUpdateProfile(formData);
          if ("error" in result && result.error) throw new Error(result.error);
          return result;
        });
      }}
    >
      <h2 className="font-semibold text-slate-900">Preferences</h2>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <label className="block text-sm">
        <span className="mb-1 block text-slate-600">Availability notes</span>
        <textarea
          name="availability"
          rows={2}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
          placeholder="e.g. Office hours Tue/Thu 3–4pm"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-slate-600">Teaching preferences</span>
        <textarea
          name="teaching_preferences"
          rows={2}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-slate-600">Default meeting link</span>
        <input
          name="meeting_link"
          type="url"
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
          placeholder="https://"
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="email_notifications" value="true" defaultChecked />
        Email notifications
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="meeting_reminders" value="true" defaultChecked />
        Meeting reminders
      </label>
      <ActionButton
        type="submit"
        status={action.status}
        verb="save"
        labels={{ idle: "Save preferences", loading: "Saving…", success: "✓ Saved" }}
      />
    </form>
  );
}
