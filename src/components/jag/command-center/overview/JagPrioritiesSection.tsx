import Link from "next/link";
import { JagSection } from "../JagSection";
import type { JagPriorityItem } from "@/lib/jag-command-center";

export function JagPrioritiesSection({
  priorities,
}: {
  readonly priorities: readonly JagPriorityItem[];
}) {
  return (
    <JagSection
      title="Today's Priorities"
      description="Top open decisions for the selected organization. Empty when none are recorded."
    >
      {priorities.length === 0 ? (
        <div className="rounded-md border border-dashed border-[var(--jag-border)] bg-[var(--jag-panel)] px-4 py-6 text-sm text-[var(--jag-muted)]">
          No open priorities are available. Priorities come from the Decision
          Center for this organization — they are not generated for display.
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-[var(--jag-border)]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--jag-border)] bg-[var(--jag-panel)] text-[10px] uppercase tracking-[0.08em] text-[var(--jag-muted)]">
              <tr>
                <th className="px-3 py-2 font-medium">Priority</th>
                <th className="px-3 py-2 font-medium">Severity</th>
                <th className="px-3 py-2 font-medium">Item</th>
                <th className="px-3 py-2 font-medium">Recommended decision</th>
                <th className="px-3 py-2 font-medium">Evidence</th>
              </tr>
            </thead>
            <tbody>
              {priorities.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-[var(--jag-border)] last:border-0"
                >
                  <td className="px-3 py-2 font-[family-name:var(--font-jag-mono)] text-xs text-[var(--jag-text)]">
                    {item.priority}
                  </td>
                  <td className="px-3 py-2 text-xs text-[var(--jag-muted)]">
                    {item.severity}
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={item.href}
                      className="text-[var(--jag-text)] underline-offset-2 hover:underline"
                    >
                      {item.title}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-xs text-[var(--jag-muted)]">
                    {item.recommendedDecision}
                  </td>
                  <td className="px-3 py-2 font-[family-name:var(--font-jag-mono)] text-xs text-[var(--jag-muted)]">
                    {item.evidenceCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </JagSection>
  );
}
