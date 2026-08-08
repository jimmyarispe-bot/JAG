"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { switchJagOrganizationAction } from "@/lib/jag-command-center/organization-context-actions";

export function JagOrganizationSelect({
  options,
  activeOrganizationId,
}: {
  readonly options: readonly { id: string; label: string }[];
  readonly activeOrganizationId: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const value =
    activeOrganizationId && options.some((o) => o.id === activeOrganizationId)
      ? activeOrganizationId
      : (options[0]?.id ?? "");

  return (
    <select
      id="jag-org-select"
      className="max-w-[9rem] truncate rounded border border-[var(--jag-border)] bg-[var(--jag-panel)] px-2 py-1.5 text-xs text-[var(--jag-text)] outline-none focus-visible:border-[var(--jag-border-strong)] md:max-w-[14rem]"
      value={value}
      disabled={options.length === 0 || pending}
      onChange={(e) => {
        const nextId = e.target.value;
        if (!nextId || nextId === activeOrganizationId) return;
        startTransition(async () => {
          const result = await switchJagOrganizationAction(nextId);
          if (result.ok) {
            router.push(result.href);
            router.refresh();
          }
        });
      }}
    >
      {options.length === 0 ? (
        <option value="">No organizations</option>
      ) : (
        options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))
      )}
    </select>
  );
}
