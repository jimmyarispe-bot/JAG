import { JagSection } from "@/components/jag/command-center";
import {
  EDUCATION_DEFAULT_GRAPH_EDGES,
  EDUCATION_GRAPH_NODE_KINDS,
  createEducationPlanner,
} from "@/lib/domains/education";
import { requireJagPlatformAdminSession } from "@/lib/jag-platform/admin-access";

export default async function JagIntelligenceGraphPage() {
  await requireJagPlatformAdminSession();
  const catalog = createEducationPlanner().catalog();

  return (
    <JagSection
      title="Intelligence Graph"
      description="Static Education influence topology and planner contributor catalog."
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Node kinds" value={String(EDUCATION_GRAPH_NODE_KINDS.length)} />
        <Stat
          label="Edges"
          value={String(EDUCATION_DEFAULT_GRAPH_EDGES.length)}
        />
        <Stat label="Planner contributors" value={String(catalog.length)} />
      </div>
      <div className="mt-4 overflow-hidden rounded-md border border-[var(--jag-border)]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--jag-border)] bg-[var(--jag-panel)] text-[10px] uppercase tracking-[0.08em] text-[var(--jag-muted)]">
            <tr>
              <th className="px-4 py-2 font-medium">Contributor</th>
              <th className="px-4 py-2 font-medium">Node</th>
              <th className="px-4 py-2 font-medium">Depends on</th>
            </tr>
          </thead>
          <tbody>
            {catalog.map((entry) => (
              <tr
                key={entry.contributorId}
                className="border-b border-[var(--jag-border)]"
              >
                <td className="px-4 py-2 text-[var(--jag-text)]">
                  {entry.label ?? entry.contributorId}
                </td>
                <td className="px-4 py-2 font-[family-name:var(--font-jag-mono)] text-xs text-[var(--jag-muted)]">
                  {entry.nodeKind}
                </td>
                <td className="px-4 py-2 font-[family-name:var(--font-jag-mono)] text-xs text-[var(--jag-muted)]">
                  {entry.dependsOn.length === 0
                    ? "—"
                    : entry.dependsOn.length}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </JagSection>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[var(--jag-border)] bg-[var(--jag-panel)] p-4">
      <p className="text-[10px] uppercase tracking-[0.1em] text-[var(--jag-muted)]">
        {label}
      </p>
      <p className="mt-1 font-[family-name:var(--font-jag-mono)] text-2xl text-[var(--jag-text)]">
        {value}
      </p>
    </div>
  );
}
