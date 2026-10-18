"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

import { signContractPartAction } from "@/lib/admissions/contract/parent-actions";

/** Initials under each part; the full-name signature under the last. */
export function SignPartForm({
  packetId,
  templateKey,
  isSignature,
  defaultName,
}: {
  packetId: string;
  templateKey: string;
  isSignature: boolean;
  defaultName: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    setError(null);
    start(async () => {
      const result = (await signContractPartAction(fd)) as { error?: string };
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-2 rounded-lg border border-brand-200 bg-brand-50/40 p-3">
      <input type="hidden" name="packet_id" value={packetId} />
      <input type="hidden" name="template_key" value={templateKey} />
      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input type="checkbox" name="agree" className="mt-1" />
        <span>I have read this part and agree to it.</span>
      </label>
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          name="signer_name"
          defaultValue={defaultName}
          placeholder="Your full name"
          aria-label="Your full name"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          name="text"
          placeholder={isSignature ? "Type your full name to sign" : "Your initials"}
          aria-label={isSignature ? "Signature" : "Initials"}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          autoComplete="off"
        />
      </div>
      {error ? (
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Saving…" : isSignature ? "Sign the contract" : "Initial this part"}
      </button>
    </form>
  );
}
