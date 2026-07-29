"use client";

import { useState } from "react";
import { studentExperienceUpdateProfile } from "@/lib/portal/student-experience/actions";
import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";

export function StudentProfileForm({
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
      className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4"
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
            language: String(formData.get("language") ?? "en"),
          })
        );
        formData.set(
          "accessibility",
          JSON.stringify({
            large_text: formData.get("large_text") === "true",
            reduce_motion: formData.get("reduce_motion") === "true",
          })
        );
        void action.run(async () => {
          const result = await studentExperienceUpdateProfile(formData);
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
        <span className="mb-1 block text-slate-600">Language</span>
        <select name="language" defaultValue="en" className="w-full rounded-lg border border-slate-300 px-3 py-2">
          <option value="en">English</option>
          <option value="es">Spanish</option>
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="email_notifications" value="true" defaultChecked />
        Email notifications
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="large_text" value="true" />
        Larger text
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="reduce_motion" value="true" />
        Reduce motion
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
