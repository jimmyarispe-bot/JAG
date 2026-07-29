"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { experienceOpenSupportTicket } from "@/lib/portal/experience/actions";
import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";

export function SupportTicketForm({
  organizationId,
  userId,
}: {
  organizationId: string;
  userId: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const action = useActionFeedback({
    verb: "submit",
    successToast: "Request recorded — continue in Messages",
    errorToast: "Unable to open request.",
    onError: (err) => setError(err.message),
  });

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
          const result = await experienceOpenSupportTicket(formData);
          if ("error" in result && result.error) throw new Error(String(result.error));
          router.push("/portal/messages");
          return result;
        });
      }}
    >
      <h2 className="font-semibold text-slate-900">Support ticket</h2>
      <p className="text-sm text-slate-600">
        Opens an experience event and routes you to secure messaging with the school.
      </p>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <label className="block text-sm">
        <span className="mb-1 block text-slate-600">Subject</span>
        <input
          name="subject"
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
          placeholder="How can we help?"
        />
      </label>
      <ActionButton
        type="submit"
        status={action.status}
        verb="submit"
        labels={{ idle: "Open ticket", loading: "Submitting…", success: "✓ Opened" }}
      />
    </form>
  );
}
