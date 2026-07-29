"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { decisionGroupLabel } from "@/lib/jag-command-center/decision-center/catalog";
import {
  JAG_DECISION_GROUPS,
  type JagDecisionCenterModel,
} from "@/lib/jag-command-center/decision-center/types";

export function JagDecisionFilters({
  model,
}: {
  readonly model: JagDecisionCenterModel;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const { filterOptions, filters } = model;

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") next.delete(key);
    else next.set(key, value);
    startTransition(() => {
      router.push(`/jag/decisions?${next.toString()}`);
    });
  }

  return (
    <div
      className={`space-y-3 rounded-md border border-[var(--jag-border)] bg-[var(--jag-panel)] p-3 ${
        pending ? "opacity-70" : ""
      }`}
    >
      <label className="block">
        <span className="sr-only">Search</span>
        <input
          type="search"
          defaultValue={filters.q ?? ""}
          placeholder="Search title, recommendation, evidence…"
          className="w-full rounded border border-[var(--jag-border)] bg-[var(--jag-bg)] px-3 py-2 text-xs text-[var(--jag-text)] outline-none placeholder:text-[var(--jag-muted-2)] focus:border-[var(--jag-border-strong)]"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setParam("q", (e.target as HTMLInputElement).value);
            }
          }}
          onBlur={(e) => setParam("q", e.target.value)}
        />
      </label>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Select
          label="Priority"
          value={filters.priority ?? "all"}
          onChange={(v) => setParam("priority", v)}
          options={[
            { id: "all", label: "All priorities" },
            ...filterOptions.priorities.map((p) => ({ id: p, label: p })),
          ]}
        />
        <Select
          label="Organization"
          value={filters.organizationId ?? "all"}
          onChange={(v) => setParam("org", v)}
          options={[
            { id: "all", label: "All organizations" },
            ...filterOptions.organizations,
          ]}
        />
        <Select
          label="Domain"
          value={filters.domainId ?? "all"}
          onChange={(v) => setParam("domain", v)}
          options={[
            { id: "all", label: "All domains" },
            ...filterOptions.domains,
          ]}
        />
        <Select
          label="Capability Pack"
          value={filters.capabilityPackId ?? "all"}
          onChange={(v) => setParam("pack", v)}
          options={[
            { id: "all", label: "All packs" },
            ...filterOptions.packs,
          ]}
        />
        <Select
          label="Status"
          value={filters.status ?? "all"}
          onChange={(v) => setParam("status", v)}
          options={[
            { id: "all", label: "All statuses" },
            ...filterOptions.statuses.map((s) => ({ id: s, label: s })),
          ]}
        />
        <Select
          label="Contributor"
          value={filters.contributorId ?? "all"}
          onChange={(v) => setParam("contributor", v)}
          options={[
            { id: "all", label: "All contributors" },
            ...filterOptions.contributors,
          ]}
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        <GroupChip
          active={!filters.group || filters.group === "all"}
          label="All groups"
          onClick={() => setParam("group", "all")}
        />
        {JAG_DECISION_GROUPS.map((g) => (
          <GroupChip
            key={g}
            active={filters.group === g}
            label={decisionGroupLabel(g)}
            count={model.counts.byGroup[g]}
            onClick={() => setParam("group", g)}
          />
        ))}
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly { id: string; label: string }[];
}) {
  return (
    <label className="block min-w-0">
      <span className="text-[10px] uppercase tracking-[0.08em] text-[var(--jag-muted)]">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full truncate rounded border border-[var(--jag-border)] bg-[var(--jag-bg)] px-2 py-1.5 text-xs text-[var(--jag-text)] outline-none focus:border-[var(--jag-border-strong)]"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function GroupChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded border border-[var(--jag-border-strong)] bg-[var(--jag-panel-2)] px-2.5 py-1 text-[11px] text-[var(--jag-text)]"
          : "rounded border border-[var(--jag-border)] px-2.5 py-1 text-[11px] text-[var(--jag-muted)] hover:text-[var(--jag-text)]"
      }
    >
      {label}
      {typeof count === "number" ? (
        <span className="ml-1 font-[family-name:var(--font-jag-mono)] text-[var(--jag-muted-2)]">
          {count}
        </span>
      ) : null}
    </button>
  );
}
