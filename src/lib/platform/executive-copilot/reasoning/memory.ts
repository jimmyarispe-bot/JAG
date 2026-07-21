import type { CopilotV2SoftContext } from "@/lib/platform/executive-copilot/context/soft-reads";
import type { CopilotV2Evidence } from "@/lib/platform/executive-copilot/types";

/**
 * Memory reasoning — Decision / Initiative nodes + lineage as institutional memory proxy.
 * Optional Sprint 067 memory lights can be merged by the orchestrator when attached.
 */
export function reasonMemory(
  ctx: CopilotV2SoftContext,
  optionalMemory?: {
    decisions?: Array<{ title: string; decision: string }>;
    lessons?: Array<{ title?: string; lesson?: string; summary?: string }>;
    timeline?: Array<{ title?: string; summary?: string }>;
  }
): {
  answer: string;
  memories: string[];
  evidence: CopilotV2Evidence[];
} {
  const memories: string[] = [];
  const evidence: CopilotV2Evidence[] = [];

  const decisions = ctx.knowledgeGraph?.graph.nodes.filter((n) => n.kind === "Decision") ?? [];
  for (const d of decisions.slice(0, 5)) {
    memories.push(`Decision: ${d.label}`);
    evidence.push({
      id: `mem-${d.id}`,
      statement: d.label,
      domain: "knowledge-graph",
      supporting: true,
    });
  }

  for (const init of ctx.initiatives.slice(0, 3)) {
    memories.push(`Initiative memory: ${init.label}`);
  }

  for (const d of optionalMemory?.decisions?.slice(0, 3) ?? []) {
    memories.push(`Prior decision: ${d.title} → ${d.decision}`);
    evidence.push({
      id: `mem-opt-${d.title}`,
      statement: d.decision,
      domain: "executive-memory",
      supporting: true,
    });
  }
  for (const l of optionalMemory?.lessons?.slice(0, 2) ?? []) {
    memories.push(`Lesson: ${l.title ?? l.lesson ?? l.summary ?? "recorded lesson"}`);
  }

  if (ctx.lineage.length) {
    memories.push(`${ctx.lineage.length} lineage slice(s) preserve how entities entered the graph.`);
  }

  const answer =
    memories.length > 0
      ? `Institutional memory soft-read: ${memories.slice(0, 4).join("; ")}.`
      : "No decision/initiative memory nodes yet — sync domains and attach executive-memory lights when available.";

  return { answer, memories, evidence };
}
