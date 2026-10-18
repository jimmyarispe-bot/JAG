"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { sendContractAction } from "@/lib/admissions/finalizing/actions";

/**
 * SEND CONTRACT - THE LETTER FIRST, THEN ONE CONFIRMED PRESS.
 *
 * This creates a parent's JAG login and emails a real family, so it shows the
 * exact letter they will receive and sends only after Jimmy confirms it.
 */
export function SendContractPanel({
  leadId,
  letterHtml,
  alreadySent,
}: {
  leadId: string;
  letterHtml: string;
  alreadySent: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  function send() {
    setMessage(null);
    start(async () => {
      const result = (await sendContractAction(leadId, true)) as {
        error?: string;
        warning?: string;
        sentTo?: string;
      };
      if (result.error) setMessage({ tone: "error", text: result.error });
      else if (result.warning) setMessage({ tone: "error", text: result.warning });
      else setMessage({ tone: "ok", text: `Sent to ${result.sentTo}.` });
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3 rounded-2xl border border-brand-200 bg-brand-50/40 p-4 print:hidden">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-700">
          {alreadySent
            ? "The contract is waiting on the parent. You can send the invitation again."
            : "Read the contract below. When it is right, send it to the parent."}
        </p>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800"
        >
          {alreadySent ? "Send the invitation again" : "Send contract"}
        </button>
      </div>

      {open ? (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            The letter the parent receives
          </p>
          <div
            className="rounded-xl border border-slate-200 bg-white p-4"
            dangerouslySetInnerHTML={{ __html: letterHtml }}
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={send}
              className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {pending ? "Sending…" : "Yes, send it"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {message ? (
        <p
          role={message.tone === "error" ? "alert" : "status"}
          className={`rounded-lg px-3 py-2 text-xs ${
            message.tone === "error" ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-800"
          }`}
        >
          {message.text}
        </p>
      ) : null}
    </div>
  );
}
