"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateDecisionCenterStatus } from "@/lib/jag-command-center/decision-center/actions";
import {
  JAG_DECISION_STATUSES,
  type JagDecisionStatus,
} from "@/lib/jag-command-center/decision-center/types";

export function JagDecisionStatusForm({
  decisionId,
  status,
}: {
  readonly decisionId: string;
  readonly status: JagDecisionStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [value, setValue] = useState<JagDecisionStatus>(status);

  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await updateDecisionCenterStatus({
            decisionId,
            status: value,
          });
          if (!result.ok) {
            setError(result.error);
            return;
          }
          router.refresh();
        });
      }}
    >
      <label className="block">
        <span className="text-[10px] uppercase tracking-[0.08em] text-[var(--jag-muted)]">
          Status
        </span>
        <select
          value={value}
          onChange={(e) => setValue(e.target.value as JagDecisionStatus)}
          className="mt-1 block rounded border border-[var(--jag-border)] bg-[var(--jag-bg)] px-2 py-1.5 text-xs text-[var(--jag-text)] outline-none"
        >
          {JAG_DECISION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded border border-[var(--jag-border-strong)] bg-[var(--jag-panel-2)] px-3 py-1.5 text-xs text-[var(--jag-text)] disabled:opacity-50"
      >
        {pending ? "Saving…" : "Update"}
      </button>
      {error ? (
        <p className="w-full text-xs text-red-400">{error}</p>
      ) : null}
    </form>
  );
}
