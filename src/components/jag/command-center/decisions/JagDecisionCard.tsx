import Link from "next/link";
import type { JagDecisionCard as Card } from "@/lib/jag-command-center/decision-center/types";

export function JagDecisionCardView({
  decision,
}: {
  readonly decision: Card;
}) {
  return (
    <Link
      href={`/jag/decisions/${decision.id}`}
      className="block rounded-md border border-[var(--jag-border)] bg-[var(--jag-panel)] p-3 transition-colors hover:border-[var(--jag-border-strong)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-medium text-[var(--jag-text)]">
            {decision.title}
          </h3>
          <p className="mt-0.5 text-[11px] text-[var(--jag-muted)]">
            {decision.categoryLabel} · {decision.organizationName}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="font-[family-name:var(--font-jag-mono)] text-[10px] text-[var(--jag-muted)]">
            {decision.priority}
          </span>
          <span className="rounded border border-[var(--jag-border)] px-1.5 py-0.5 text-[10px] uppercase tracking-[0.06em] text-[var(--jag-muted)]">
            {decision.status}
          </span>
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
        <Field label="Domain" value={decision.domainName} />
        <Field label="Pack" value={decision.capabilityPackName} />
        <Field label="Contributor" value={decision.contributorLabel} />
        <Field
          label="Confidence"
          value={decision.confidence.toFixed(2)}
          mono
        />
        <Field
          label="Evidence"
          value={String(decision.evidenceCount)}
          mono
        />
        <Field label="Status" value={decision.status} />
        <Field
          label="Assigned"
          value={decision.assignment?.summary ?? "—"}
        />
        <Field
          label="Due"
          value={
            decision.isOverdue
              ? "Overdue"
              : decision.assignment?.dueDate?.slice(0, 10) ?? "—"
          }
        />
      </dl>

      <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-[var(--jag-muted)]">
        {decision.recommendedAction}
      </p>

      {decision.predictedConsequence ? (
        <p className="mt-2 line-clamp-3 rounded border border-[var(--jag-border)] bg-[var(--jag-bg)] px-2 py-1.5 text-[11px] leading-relaxed text-[var(--jag-muted)]">
          <span className="text-[10px] uppercase tracking-[0.08em] text-[var(--jag-muted-2)]">
            If no action
          </span>
          <span className="mt-0.5 block text-[var(--jag-text)]">
            {decision.predictedConsequence.statement}
          </span>
          <span className="mt-1 block font-[family-name:var(--font-jag-mono)] text-[10px] text-[var(--jag-muted-2)]">
            Advisory · {(decision.predictedConsequence.confidence * 100).toFixed(0)}%
            confidence · {decision.predictedConsequence.horizonLabel}
          </span>
        </p>
      ) : null}
    </Link>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[var(--jag-muted-2)]">{label}</dt>
      <dd
        className={`mt-0.5 truncate text-[var(--jag-muted)] ${
          mono ? "font-[family-name:var(--font-jag-mono)]" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
