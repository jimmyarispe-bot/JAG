import {
  getAllUlrCompetencies,
  getUlrRelationships,
} from "@/lib/platform/ulr/registry/registry";
import type { ValidateUlrKeysInput, ValidateUlrKeysResult } from "@/lib/platform/ulr/types";
import { isValidUlrCompetencyKey, isValidUlrSkillKey } from "@/lib/platform/ulr/version";
import {
  isKnownUlrCompetencyKey,
  isKnownUlrSkillKey,
} from "@/lib/platform/ulr/registry/registry";

export interface UlrValidationIssue {
  code:
    | "unknown_competency_key"
    | "unknown_skill_key"
    | "invalid_competency_key_format"
    | "invalid_skill_key_format"
    | "prerequisite_cycle";
  message: string;
}

export interface UlrValidationResult {
  ok: boolean;
  issues: UlrValidationIssue[];
}

/** Validate competency and skill keys against the ULR registry. */
export function validateUlrKeys(input: ValidateUlrKeysInput): ValidateUlrKeysResult {
  const unknownCompetencyKeys: string[] = [];
  const unknownSkillKeys: string[] = [];

  for (const key of input.competencyKeys ?? []) {
    if (!isKnownUlrCompetencyKey(key)) unknownCompetencyKeys.push(key);
  }

  for (const key of input.skillKeys ?? []) {
    if (!isKnownUlrSkillKey(key)) unknownSkillKeys.push(key);
  }

  return {
    ok: unknownCompetencyKeys.length === 0 && unknownSkillKeys.length === 0,
    unknownCompetencyKeys,
    unknownSkillKeys,
  };
}

/** Detect prerequisite cycles in published competency graph (ULR-2). */
export function validateUlrPrerequisiteGraph(): UlrValidationResult {
  const issues: UlrValidationIssue[] = [];
  const graph = new Map<string, string[]>();

  for (const competency of getAllUlrCompetencies()) {
    graph.set(competency.competencyKey, [
      ...competency.prerequisiteCompetencyKeys,
      ...getUlrRelationships({
        sourceKey: competency.competencyKey,
        relationshipType: "prerequisite",
      }).map((rel) => rel.targetKey),
    ]);
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();

  function dfs(node: string, stack: string[]): void {
    if (visiting.has(node)) {
      issues.push({
        code: "prerequisite_cycle",
        message: `Prerequisite cycle detected: ${[...stack, node].join(" -> ")}`,
      });
      return;
    }
    if (visited.has(node)) return;
    visiting.add(node);
    for (const next of graph.get(node) ?? []) {
      dfs(next, [...stack, node]);
    }
    visiting.delete(node);
    visited.add(node);
  }

  for (const key of graph.keys()) dfs(key, []);

  for (const competency of getAllUlrCompetencies()) {
    if (!isValidUlrCompetencyKey(competency.competencyKey)) {
      issues.push({
        code: "invalid_competency_key_format",
        message: `Invalid competency key format: ${competency.competencyKey}`,
      });
    }
  }

  return { ok: issues.length === 0, issues };
}

export function validateUlrRegistry(): UlrValidationResult {
  const prerequisiteResult = validateUlrPrerequisiteGraph();
  return prerequisiteResult;
}
