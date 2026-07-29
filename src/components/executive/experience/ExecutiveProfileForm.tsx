"use client";

import { useState } from "react";
import { executiveExperienceUpdateProfile } from "@/lib/executive/experience/actions";
import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";

export function ExecutiveProfileForm({
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
            critical_alerts: formData.get("critical_alerts") === "true",
            board_packs: formData.get("board_packs") === "true",
          })
        );
        formData.set(
          "accessibility",
          JSON.stringify({
            delegation_notes: String(formData.get("delegation_notes") ?? ""),
            preferred_brief: String(formData.get("preferred_brief") ?? ""),
          })
        );
        void action.run(async () => {
          const result = await executiveExperienceUpdateProfile(formData);
          if ("error" in result && result.error) throw new Error(result.error);
          return result;
        });
      }}
    >
      <h2 className="font-semibold text-slate-900">Executive preferences</h2>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <label className="block text-sm">
        <span className="mb-1 block text-slate-600">Delegation notes</span>
        <textarea
          name="delegation_notes"
          rows={2}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
          placeholder="Who covers decisions when you are unavailable"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-slate-600">Preferred brief focus</span>
        <input
          name="preferred_brief"
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
          placeholder="e.g. finance + enrollment"
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="email_notifications" value="true" defaultChecked />
        Email notifications
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="critical_alerts" value="true" defaultChecked />
        Critical alerts
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="board_packs" value="true" defaultChecked />
        Board pack notifications
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
