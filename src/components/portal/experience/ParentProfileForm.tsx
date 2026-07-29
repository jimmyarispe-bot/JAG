"use client";

import { useState } from "react";
import { experienceUpdateProfile } from "@/lib/portal/experience/actions";
import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";

export function ParentProfileForm({
  userId,
  defaults,
}: {
  userId: string;
  defaults: {
    language: string;
    notification_email: boolean;
    notification_sms: boolean;
  };
}) {
  const [error, setError] = useState<string | null>(null);
  const action = useActionFeedback({
    verb: "save",
    successToast: "Preferences saved",
    errorToast: "Unable to save preferences.",
    onError: (err) => setError(err.message),
  });

  return (
    <form
      className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const form = e.currentTarget;
        const formData = new FormData(form);
        formData.set("user_id", userId);
        formData.set(
          "notifications",
          JSON.stringify({
            email: formData.get("email_notifications") === "true",
            sms: formData.get("sms_notifications") === "true",
            language: String(formData.get("language") ?? "en"),
          })
        );
        formData.set("accessibility", JSON.stringify({}));
        void action.run(async () => {
          const result = await experienceUpdateProfile(formData);
          if ("error" in result && result.error) throw new Error(result.error);
          return result;
        });
      }}
    >
      <h2 className="font-semibold text-slate-900">Communication preferences</h2>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <label className="block text-sm">
        <span className="mb-1 block text-slate-600">Language</span>
        <select
          name="language"
          defaultValue={defaults.language}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        >
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="email_notifications"
          value="true"
          defaultChecked={defaults.notification_email}
        />
        Email notifications
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="sms_notifications"
          value="true"
          defaultChecked={defaults.notification_sms}
        />
        SMS notifications
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
