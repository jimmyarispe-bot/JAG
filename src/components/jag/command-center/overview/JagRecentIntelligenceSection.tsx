import { JagSection } from "../JagSection";
import type { JagRecentIntelligenceItem } from "@/lib/jag-command-center";

export function JagRecentIntelligenceSection({
  items,
}: {
  readonly items: readonly JagRecentIntelligenceItem[];
}) {
  return (
    <JagSection
      title="Recent Intelligence"
      description="Latest contributor executions bound to this organization."
    >
      {items.length === 0 ? (
        <div className="rounded-md border border-dashed border-[var(--jag-border)] bg-[var(--jag-panel)] px-4 py-6 text-sm text-[var(--jag-muted)]">
          No contributor executions are bound yet. After an Education
          Intelligence Orchestrator run, record the execution snapshot to the
          Command Center store to populate contributor, confidence, duration,
          and result summary here.
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-[var(--jag-border)]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--jag-border)] bg-[var(--jag-panel)] text-[10px] uppercase tracking-[0.08em] text-[var(--jag-muted)]">
              <tr>
                <th className="px-3 py-2 font-medium">Contributor</th>
                <th className="px-3 py-2 font-medium">Confidence</th>
                <th className="px-3 py-2 font-medium">Time</th>
                <th className="px-3 py-2 font-medium">Result</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-[var(--jag-border)] last:border-0"
                >
                  <td className="px-3 py-2">
                    <p className="text-[var(--jag-text)]">{item.label}</p>
                    <p className="font-[family-name:var(--font-jag-mono)] text-[10px] text-[var(--jag-muted-2)]">
                      {item.contributorId}
                    </p>
                  </td>
                  <td className="px-3 py-2 font-[family-name:var(--font-jag-mono)] text-xs text-[var(--jag-muted)]">
                    {item.confidence.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 font-[family-name:var(--font-jag-mono)] text-xs text-[var(--jag-muted)]">
                    {typeof item.durationMs === "number"
                      ? `${item.durationMs} ms`
                      : "—"}
                  </td>
                  <td className="px-3 py-2 text-xs text-[var(--jag-muted)]">
                    {item.resultSummary}
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
