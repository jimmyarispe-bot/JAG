import type { CopilotV2SoftContext } from "@/lib/platform/executive-copilot/context/soft-reads";
import type { CopilotV2Evidence } from "@/lib/platform/executive-copilot/types";

export function reasonTimeline(ctx: CopilotV2SoftContext): {
  answer: string;
  entries: string[];
  evidence: CopilotV2Evidence[];
} {
  const entries = ctx.timeline.slice(0, 12).map(
    (t) => `${t.at.slice(0, 10)} · ${t.kind}: ${t.label}${t.domain ? ` [${t.domain}]` : ""}`
  );

  const evidence: CopilotV2Evidence[] = ctx.timeline.slice(0, 5).map((t, i) => ({
    id: `tl-${i}`,
    statement: `${t.label} @ ${t.at}`,
    domain: t.domain ?? "knowledge-graph",
    supporting: true,
  }));

  if (ctx.lineage.length) {
    evidence.push({
      id: "tl-lineage",
      statement: `${ctx.lineage.length} lineage slice(s) available for provenance.`,
      domain: "knowledge-graph",
      supporting: true,
    });
  }

  const answer =
    entries.length > 0
      ? `Recent organizational timeline: ${entries.slice(0, 5).join("; ")}.`
      : "No timeline events in the knowledge graph soft-read yet.";

  return { answer, entries, evidence };
}
