import type {
  CollectedEvidence,
  DecisionDefinition,
  EvidenceItem,
  EvidenceRequirementDefinition,
} from "@/lib/platform/decision/types";

export interface EvidenceCollectorContext {
  decisionType: string;
  inputs: Record<string, unknown>;
  organizationId?: string;
  schoolId?: string;
  entityType?: string;
  entityId?: string;
}

export type EvidenceCollectorFn = (
  context: EvidenceCollectorContext,
  requirement: EvidenceRequirementDefinition
) => Promise<EvidenceItem | null> | EvidenceItem | null;

export interface EvidenceCollector {
  key: string;
  label?: string;
  collect: EvidenceCollectorFn;
}

const EVIDENCE_COLLECTORS = new Map<string, EvidenceCollector>();

export function registerEvidenceCollector(collector: EvidenceCollector): void {
  EVIDENCE_COLLECTORS.set(collector.key, collector);
}

export function getEvidenceCollector(key: string): EvidenceCollector | undefined {
  return EVIDENCE_COLLECTORS.get(key);
}

export function getRegisteredEvidenceCollectors(): EvidenceCollector[] {
  return [...EVIDENCE_COLLECTORS.values()];
}

/** Default collector — reads values directly from decision inputs by evidence key. */
export const INPUT_FIELD_EVIDENCE_COLLECTOR: EvidenceCollector = {
  key: "input_field",
  label: "Input Field",
  collect(context, requirement) {
    const value = context.inputs[requirement.key];
    if (value === undefined || value === null) return null;
    return {
      key: requirement.key,
      label: requirement.label,
      value,
      source: "inputs",
      collectedAt: new Date().toISOString(),
      confidence: 1,
    };
  },
};

registerEvidenceCollector(INPUT_FIELD_EVIDENCE_COLLECTOR);

function computeCompleteness(
  requirements: EvidenceRequirementDefinition[],
  items: EvidenceItem[]
): { completeness: number; missingRequired: string[] } {
  const collectedKeys = new Set(items.map((item) => item.key));
  const required = requirements.filter((req) => req.required !== false);
  const missingRequired = required
    .filter((req) => !collectedKeys.has(req.key))
    .map((req) => req.key);

  if (required.length === 0) {
    return { completeness: items.length > 0 ? 1 : 0, missingRequired };
  }

  const satisfied = required.length - missingRequired.length;
  return { completeness: satisfied / required.length, missingRequired };
}

/** Collect evidence for all requirements on a decision definition. */
export async function collectDecisionEvidence(
  definition: DecisionDefinition,
  context: EvidenceCollectorContext
): Promise<CollectedEvidence> {
  const items: EvidenceItem[] = [];

  for (const requirement of definition.evidenceRequirements) {
    const collectorKey = requirement.collectorKey ?? "input_field";
    const collector = EVIDENCE_COLLECTORS.get(collectorKey);
    if (!collector) continue;

    const result = await collector.collect(context, requirement);
    if (result) items.push(result);
  }

  const { completeness, missingRequired } = computeCompleteness(
    definition.evidenceRequirements,
    items
  );

  return { items, completeness, missingRequired };
}
