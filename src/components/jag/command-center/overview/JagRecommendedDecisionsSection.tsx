import Link from "next/link";
import { JagSection } from "../JagSection";
import type { JagRecommendedDecisionGroup } from "@/lib/jag-command-center";

export function JagRecommendedDecisionsSection({
  groups,
}: {
  readonly groups: readonly JagRecommendedDecisionGroup[];
}) {
  const total = groups.reduce((sum, g) => sum + g.items.length, 0);

  return (
    <JagSection
      title="Recommended Decisions"
      description="High-priority action proposals and open decisions, grouped for executive scan."
    >
      {total === 0 ? (
        <div className="rounded-md border border-dashed border-[var(--jag-border)] bg-[var(--jag-panel)] px-4 py-6 text-sm text-[var(--jag-muted)]">
          No recommended decisions are available. When Education contributors
          emit high-priority action proposals, or the Decision Center has open
          items, they appear here under Students, Operations, Funding, and
          Executive.
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {groups.map((group) => (
            <article
              key={group.id}
              className="rounded-md border border-[var(--jag-border)] bg-[var(--jag-panel)] p-3"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-sm font-medium text-[var(--jag-text)]">
                  {group.label}
                </h3>
                <span className="font-[family-name:var(--font-jag-mono)] text-[10px] text-[var(--jag-muted)]">
                  {group.items.length}
                </span>
              </div>
              {group.items.length === 0 ? (
                <p className="text-xs text-[var(--jag-muted)]">None</p>
              ) : (
                <ul className="space-y-2">
                  {group.items.map((item) => (
                    <li
                      key={item.id}
                      className="border-t border-[var(--jag-border)] pt-2 first:border-0 first:pt-0"
                    >
                      {item.href ? (
                        <Link
                          href={item.href}
                          className="text-sm text-[var(--jag-text)] hover:underline"
                        >
                          {item.title}
                        </Link>
                      ) : (
                        <p className="text-sm text-[var(--jag-text)]">
                          {item.title}
                        </p>
                      )}
                      <p className="mt-0.5 text-xs text-[var(--jag-muted)]">
                        {item.rationale}
                      </p>
                      <p className="mt-0.5 font-[family-name:var(--font-jag-mono)] text-[10px] text-[var(--jag-muted-2)]">
                        {String(item.priority)} · {item.source}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      )}
    </JagSection>
  );
}
