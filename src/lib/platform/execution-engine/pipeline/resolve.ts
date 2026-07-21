import { getHierarchyNode } from "@/lib/platform/hierarchy/registry/registry";
import { evaluateRuleSet } from "@/lib/platform/rules/engine/execute";
import type {
  OrganizationalContext,
  ResolvedCapability,
  RuntimeRecommendation,
} from "@/lib/platform/execution-engine/types";

interface ResolveRecommendationsInput {
  grantedCapabilities: ResolvedCapability[];
  org: OrganizationalContext;
  effectiveUserId: string;
  facts?: Record<string, unknown>;
}

type RecommendationSlot =
  | {
      kind: "rule";
      dedupeKey: string;
      capabilityKey: string;
      ruleSetKey: string;
    }
  | { kind: "sync"; recommendation: RuntimeRecommendation };

/** Resolve runtime recommendations via Rules Engine — no domain-specific logic. */
export async function resolveRuntimeRecommendations(
  input: ResolveRecommendationsInput
): Promise<RuntimeRecommendation[]> {
  const seen = new Set<string>();
  const slots: RecommendationSlot[] = [];

  const baseFacts = {
    has_permission: true,
    ...input.facts,
  };

  // Preserve discovery order; evaluate independent rule sets concurrently below.
  for (const cap of input.grantedCapabilities) {
    const ctx = cap.workflowContext;

    for (const ruleSetKey of ctx.ruleSetKeys) {
      const dedupeKey = `${cap.capabilityKey}:${ruleSetKey}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      slots.push({
        kind: "rule",
        dedupeKey,
        capabilityKey: cap.capabilityKey,
        ruleSetKey,
      });
    }

    if (ctx.decisionTypeKey) {
      const dedupeKey = `${cap.capabilityKey}:decision:${ctx.decisionTypeKey}`;
      if (!seen.has(dedupeKey)) {
        seen.add(dedupeKey);
        slots.push({
          kind: "sync",
          recommendation: {
            id: `rec-${dedupeKey}`,
            capabilityKey: cap.capabilityKey,
            title: `Decision: ${ctx.decisionTypeKey}`,
            rationale:
              "Decision type configured for this capability — invoke Decision Engine at execution time.",
            priority: "low",
            source: "hierarchy",
            decisionTypeKey: ctx.decisionTypeKey,
          },
        });
      }
    }

    for (const serviceKey of ctx.intelligenceServiceKeys) {
      const dedupeKey = `${cap.capabilityKey}:intel:${serviceKey}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      slots.push({
        kind: "sync",
        recommendation: {
          id: `rec-${dedupeKey}`,
          capabilityKey: cap.capabilityKey,
          title: `Intelligence: ${serviceKey}`,
          rationale: "Intelligence service consumes capability execution results.",
          priority: "low",
          source: "intelligence_graph",
        },
      });
    }
  }

  const ruleSlots = slots.filter(
    (s): s is Extract<RecommendationSlot, { kind: "rule" }> => s.kind === "rule"
  );

  // P004: parallel rule-set evaluation; results reassembled in original slot order.
  const ruleOutcomes = await Promise.all(
    ruleSlots.map(async (slot) => {
      try {
        const result = await evaluateRuleSet({
          ruleSetKey: slot.ruleSetKey,
          facts: baseFacts,
          organizationId: input.org.organizationId ?? undefined,
          schoolId: input.org.schoolId ?? undefined,
          entityType: "workspace_capability",
          entityId: slot.capabilityKey,
          actorUserId: input.effectiveUserId,
        });

        const primary = result.primaryOutcome;
        if (!primary) return null;

        const denied =
          primary.effects?.access === "denied" || primary.effects?.allowed === false;
        const recommendation: RuntimeRecommendation = {
          id: `rec-${slot.dedupeKey}`,
          capabilityKey: slot.capabilityKey,
          title: primary.label,
          rationale: result.explanation?.summary ?? `Rule set ${slot.ruleSetKey} evaluated`,
          priority: denied ? "high" : "medium",
          source: "rules_engine",
          ruleSetKey: slot.ruleSetKey,
        };
        return recommendation;
      } catch {
        // Rule evaluation optional — capability still executable
        return null;
      }
    })
  );

  const ruleByDedupe = new Map<string, RuntimeRecommendation | null>();
  ruleSlots.forEach((slot, index) => {
    ruleByDedupe.set(slot.dedupeKey, ruleOutcomes[index] ?? null);
  });

  const recommendations: RuntimeRecommendation[] = [];
  for (const slot of slots) {
    if (slot.kind === "sync") {
      recommendations.push(slot.recommendation);
      continue;
    }
    const ruleRec = ruleByDedupe.get(slot.dedupeKey);
    if (ruleRec) recommendations.push(ruleRec);
  }

  return recommendations;
}

export function resolveKnowledgeNodes(capabilities: ResolvedCapability[]) {
  const keys = new Set<string>();
  for (const cap of capabilities) {
    for (const key of cap.workflowContext.knowledgeAssetKeys) {
      keys.add(key);
    }
    for (const key of cap.binding.knowledgeAssetKeys) {
      keys.add(key);
    }
  }
  return [...keys]
    .map((key) => getHierarchyNode(key))
    .filter((n): n is NonNullable<typeof n> => Boolean(n));
}

export function uniqueNodesByKind(
  capabilities: ResolvedCapability[],
  kind: "protocol" | "process" | "procedure"
) {
  const keys = new Set<string>();
  for (const cap of capabilities) {
    const node = cap.workflowContext.governance[kind];
    if (node) keys.add(node.nodeKey);
  }
  return [...keys]
    .map((key) => getHierarchyNode(key))
    .filter((n): n is NonNullable<typeof n> => Boolean(n));
}
