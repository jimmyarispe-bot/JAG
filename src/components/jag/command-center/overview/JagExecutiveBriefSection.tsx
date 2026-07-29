import Link from "next/link";
import { JagSection } from "../JagSection";
import { JagStatusBadge } from "../JagStatusBadge";
import type { JagExecutiveBriefView } from "@/lib/jag-command-center";

export function JagExecutiveBriefSection({
  brief,
}: {
  readonly brief: JagExecutiveBriefView;
}) {
  return (
    <JagSection
      title="Executive Brief"
      description="Latest Education Executive Education Briefing result."
      actions={
        <Link
          href={brief.href}
          className="text-xs text-[var(--jag-muted)] hover:text-[var(--jag-text)]"
        >
          Open briefings
        </Link>
      }
    >
      <div className="rounded-md border border-[var(--jag-border)] bg-[var(--jag-panel)] p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs text-[var(--jag-muted)]">
            education.cognition.executive_briefing
          </p>
          <JagStatusBadge status={brief.status === "ready" ? "ready" : "empty"} />
        </div>

        {brief.status === "empty" ? (
          <p className="text-sm leading-relaxed text-[var(--jag-muted)]">
            {brief.explanation}
          </p>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 text-xs text-[var(--jag-muted)]">
              {brief.stance ? (
                <span className="capitalize">
                  Stance · {brief.stance.replace(/_/g, " ")}
                </span>
              ) : null}
              {typeof brief.confidence === "number" ? (
                <span className="font-[family-name:var(--font-jag-mono)]">
                  Confidence · {brief.confidence.toFixed(2)}
                </span>
              ) : null}
              {brief.capturedAt ? <span>{brief.capturedAt}</span> : null}
            </div>
            <p className="text-sm leading-relaxed text-[var(--jag-text)]">
              {brief.summary}
            </p>
            <BriefList label="Strategic priorities" items={brief.strategicPriorities} />
            <BriefList label="Critical risks" items={brief.criticalRisks} />
            <BriefList
              label="Recommended actions"
              items={brief.recommendedActions}
            />
          </div>
        )}
      </div>
    </JagSection>
  );
}

function BriefList({
  label,
  items,
}: {
  label: string;
  items: readonly string[];
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--jag-muted)]">
        {label}
      </p>
      <ul className="mt-1 space-y-1 text-sm text-[var(--jag-text)]">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="text-[var(--jag-muted-2)]">–</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
