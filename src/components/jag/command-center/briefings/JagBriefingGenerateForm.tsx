"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { generateExecutiveBriefing } from "@/lib/jag-command-center/briefing-engine/actions";
import {
  JAG_BRIEFING_TIMELINES,
  type JagBriefingTimeline,
} from "@/lib/jag-command-center/briefing-engine/types";

const TIMELINE_LABELS: Record<JagBriefingTimeline, string> = {
  today: "Today",
  this_week: "This Week",
  this_month: "This Month",
  quarter: "Quarter",
  custom: "Custom",
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
  const [organizationId, setOrganizationId] = useState(
    defaultOrganizationId ?? organizations[0]?.id ?? ""
  );
  const [timeline, setTimeline] = useState<JagBriefingTimeline>("this_week");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

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
            organizationId,
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
        Narrative synthesis from Organization Health, Decision Queue, contributor
        executions, readiness, student success, and recent outcomes. Not a
        dashboard — evidence-backed sections only.
      </p>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block">
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

        {timeline === "custom" ? (
          <>
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
          </>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={pending || !organizationId}
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
