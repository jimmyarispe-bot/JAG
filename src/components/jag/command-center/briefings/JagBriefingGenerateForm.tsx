"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { generateExecutiveBriefing } from "@/lib/jag-command-center/briefing-engine/actions";
import { JAG_BRIEFING_KIND_LABELS } from "@/lib/jag-command-center/briefing-engine/kinds";
import {
  JAG_BRIEFING_KINDS,
  JAG_BRIEFING_SCOPES,
  JAG_BRIEFING_TIMELINES,
  type JagBriefingKind,
  type JagBriefingScope,
  type JagBriefingTimeline,
} from "@/lib/jag-command-center/briefing-engine/types";

const TIMELINE_LABELS: Record<JagBriefingTimeline, string> = {
  today: "Today",
  this_week: "This Week",
  this_month: "This Month",
  quarter: "Quarter",
  custom: "Custom",
};

const SCOPE_LABELS: Record<JagBriefingScope, string> = {
  single: "Single Organization",
  multi: "Multi-Organization",
  enterprise: "Entire Enterprise",
};

export function JagBriefingGenerateForm({
  organizations,
  defaultOrganizationId,
}: {
  readonly organizations: readonly { id: string; label: string }[];
  readonly defaultOrganizationId: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [scope, setScope] = useState<JagBriefingScope>("single");
  const [organizationId, setOrganizationId] = useState(
    defaultOrganizationId ?? organizations[0]?.id ?? ""
  );
  const [selectedOrgIds, setSelectedOrgIds] = useState<string[]>(
    defaultOrganizationId ? [defaultOrganizationId] : []
  );
  const [kind, setKind] = useState<JagBriefingKind>("morning_brief");
  const [timeline, setTimeline] = useState<JagBriefingTimeline>("this_week");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const canSubmit = useMemo(() => {
    if (organizations.length === 0) return false;
    if (scope === "single") return Boolean(organizationId);
    if (scope === "multi") return selectedOrgIds.length > 0;
    return true;
  }, [organizations.length, scope, organizationId, selectedOrgIds]);

  if (organizations.length === 0) {
    return (
      <p className="text-sm text-[var(--jag-muted)]">
        No organization is available for this session. Provision or select an
        organization before generating a briefing.
      </p>
    );
  }

  return (
    <form
      className="space-y-3 rounded-md border border-[var(--jag-border)] bg-[var(--jag-panel)] p-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await generateExecutiveBriefing({
            scope,
            organizationId:
              scope === "single" ? organizationId : selectedOrgIds[0],
            organizationIds:
              scope === "multi"
                ? selectedOrgIds
                : scope === "enterprise"
                  ? organizations.map((o) => o.id)
                  : undefined,
            kind,
            timeline,
            customStart: timeline === "custom" ? customStart : undefined,
            customEnd: timeline === "custom" ? customEnd : undefined,
          });
          if (!result.ok) {
            setError(result.error);
            return;
          }
          router.push(`/jag/briefings/${result.briefingId}`);
          router.refresh();
        });
      }}
    >
      <p className="text-sm text-[var(--jag-text)]">Generate briefing</p>
      <p className="text-xs text-[var(--jag-muted)]">
        Narrative synthesis answering what happened, why, what to decide, cost of
        inaction, and what to watch — with Decision Center links.
      </p>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block">
          <span className="text-[10px] uppercase tracking-[0.08em] text-[var(--jag-muted)]">
            Organization scope
          </span>
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value as JagBriefingScope)}
            className={fieldClass}
          >
            {JAG_BRIEFING_SCOPES.map((s) => (
              <option key={s} value={s}>
                {SCOPE_LABELS[s]}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-[10px] uppercase tracking-[0.08em] text-[var(--jag-muted)]">
            Briefing type
          </span>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as JagBriefingKind)}
            className={fieldClass}
          >
            {JAG_BRIEFING_KINDS.map((k) => (
              <option key={k} value={k}>
                {JAG_BRIEFING_KIND_LABELS[k]}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-[10px] uppercase tracking-[0.08em] text-[var(--jag-muted)]">
            Timeline
          </span>
          <select
            value={timeline}
            onChange={(e) =>
              setTimeline(e.target.value as JagBriefingTimeline)
            }
            className={fieldClass}
          >
            {JAG_BRIEFING_TIMELINES.map((t) => (
              <option key={t} value={t}>
                {TIMELINE_LABELS[t]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {scope === "single" ? (
        <label className="block max-w-md">
          <span className="text-[10px] uppercase tracking-[0.08em] text-[var(--jag-muted)]">
            Organization
          </span>
          <select
            value={organizationId}
            onChange={(e) => setOrganizationId(e.target.value)}
            className={fieldClass}
            required
          >
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {scope === "multi" ? (
        <fieldset className="rounded border border-[var(--jag-border)] p-3">
          <legend className="px-1 text-[10px] uppercase tracking-[0.08em] text-[var(--jag-muted)]">
            Organizations
          </legend>
          <div className="grid gap-1 sm:grid-cols-2">
            {organizations.map((o) => {
              const checked = selectedOrgIds.includes(o.id);
              return (
                <label
                  key={o.id}
                  className="flex items-center gap-2 text-xs text-[var(--jag-muted)]"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      setSelectedOrgIds((prev) =>
                        checked
                          ? prev.filter((id) => id !== o.id)
                          : [...prev, o.id]
                      );
                    }}
                  />
                  {o.label}
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      {scope === "enterprise" ? (
        <p className="text-xs text-[var(--jag-muted)]">
          Entire enterprise includes all {organizations.length} session
          organization(s). Future-ready for enterprise deployments.
        </p>
      ) : null}

      {timeline === "custom" ? (
        <div className="grid gap-2 sm:grid-cols-2 max-w-lg">
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.08em] text-[var(--jag-muted)]">
              Start
            </span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className={fieldClass}
              required
            />
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.08em] text-[var(--jag-muted)]">
              End
            </span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className={fieldClass}
              required
            />
          </label>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending || !canSubmit}
        className="rounded border border-[var(--jag-border-strong)] bg-[var(--jag-panel-2)] px-3 py-1.5 text-xs text-[var(--jag-text)] disabled:opacity-50"
      >
        {pending ? "Synthesizing…" : "Generate executive briefing"}
      </button>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </form>
  );
}

const fieldClass =
  "mt-1 w-full rounded border border-[var(--jag-border)] bg-[var(--jag-bg)] px-2 py-1.5 text-xs text-[var(--jag-text)] outline-none focus:border-[var(--jag-border-strong)]";
