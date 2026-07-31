/**
 * Validation pipeline — blueprint integrity, deps, duplicates, refs.
 */

import type {
  CapabilityPack,
  IndustryBlueprint,
  OrganizationBlueprint,
} from "@/jag/blueprints/contracts";
import { validateBlueprintPair } from "@/jag/blueprints/validation";
import { validateCapabilityPackSet } from "@/jag/capability-packs";
import type {
  GenerationDiagnostic,
  GenerationPlan,
  GenerationValidationResult,
  ResolvedRuntimeModel,
} from "@/jag/runtime-generation/contracts";

function diag(
  path: string,
  code: string,
  message: string,
  severity: "error" | "warning" = "error"
): GenerationDiagnostic {
  return { path, code, message, severity };
}

function findDuplicateIds(
  items: readonly { id?: string; entityType?: string | null }[] | undefined,
  path: string,
  key: "id" | "entityType"
): GenerationDiagnostic[] {
  const seen = new Set<string>();
  const out: GenerationDiagnostic[] = [];
  for (const item of items ?? []) {
    const value = key === "id" ? item.id : item.entityType ?? undefined;
    if (!value) continue;
    if (seen.has(value)) {
      out.push(
        diag(path, "duplicate_identifier", `Duplicate ${key} "${value}"`)
      );
    }
    seen.add(value);
  }
  return out;
}

function collectFormIds(model: ResolvedRuntimeModel): Set<string> {
  return new Set((model.forms ?? []).map((f) => f.id));
}

function collectEntityTypes(model: ResolvedRuntimeModel): Set<string> {
  return new Set((model.entities ?? []).map((e) => e.entityType));
}

/** Validate inputs before / after resolution. */
export function validateGenerationInputs(
  industry: IndustryBlueprint,
  organization: OrganizationBlueprint,
  packs: readonly CapabilityPack[]
): GenerationValidationResult {
  const diagnostics: GenerationDiagnostic[] = [];
  const pair = validateBlueprintPair(industry, organization);
  if (!pair.ok) {
    for (const issue of pair.issues) {
      diagnostics.push(
        diag(issue.path, issue.code, issue.message, "error")
      );
    }
  }

  const packValidation = validateCapabilityPackSet(packs);
  for (const issue of packValidation.issues) {
    diagnostics.push(
      diag(
        issue.path.startsWith("packs") || issue.path.startsWith("dependencies")
          ? `capabilityPacks.${issue.path}`
          : `capabilityPacks.${issue.path}`,
        issue.code,
        issue.message,
        issue.severity
      )
    );
  }

  const industryModules = new Set(industry.modules ?? []);
  if (industryModules.size > 0) {
    for (const mod of organization.enabledModules ?? []) {
      if (!industryModules.has(mod)) {
        diagnostics.push(
          diag(
            "enabledModules",
            "capability_incompatible",
            `Module "${mod}" is not declared on industry "${industry.id}"`,
            "warning"
          )
        );
      }
    }
  }

  const errors = diagnostics.filter((d) => d.severity === "error");
  return { ok: errors.length === 0, diagnostics };
}

export function validateResolvedModel(
  model: ResolvedRuntimeModel,
  plan: GenerationPlan
): GenerationValidationResult {
  const diagnostics: GenerationDiagnostic[] = [];

  diagnostics.push(
    ...findDuplicateIds(model.entities, "entities", "entityType")
  );
  diagnostics.push(...findDuplicateIds(model.processes, "processes", "id"));
  diagnostics.push(...findDuplicateIds(model.decisions, "decisions", "id"));
  diagnostics.push(...findDuplicateIds(model.forms, "forms", "id"));
  diagnostics.push(
    ...findDuplicateIds(model.documents?.definitions, "documents", "id")
  );
  diagnostics.push(
    ...findDuplicateIds(
      model.communications?.definitions,
      "communications",
      "id"
    )
  );
  diagnostics.push(
    ...findDuplicateIds(model.permissions, "permissions", "id")
  );
  diagnostics.push(...findDuplicateIds(model.reports, "reports", "id"));
  diagnostics.push(...findDuplicateIds(model.navigation, "navigation", "id"));
  diagnostics.push(
    ...findDuplicateIds(model.workflows, "workflows", "id")
  );

  const formIds = collectFormIds(model);
  const entityTypes = collectEntityTypes(model);

  for (const report of model.reports ?? []) {
    if (report.entityType && !entityTypes.has(report.entityType)) {
      diagnostics.push(
        diag(
          `reports.${report.id}`,
          "missing_reference",
          `Report "${report.id}" references unknown entityType "${report.entityType}"`,
          "warning"
        )
      );
    }
  }

  // Process → form references when present on process model shape.
  for (const process of model.processes ?? []) {
    const formRefs = (process as { formDefinitionIds?: readonly string[] })
      .formDefinitionIds;
    for (const formId of formRefs ?? []) {
      if (!formIds.has(formId)) {
        diagnostics.push(
          diag(
            `processes.${process.id}`,
            "missing_reference",
            `Process "${process.id}" references missing form "${formId}"`,
            "warning"
          )
        );
      }
    }
  }

  if (!plan.selectedPackIds.length && !model.entities?.length) {
    diagnostics.push(
      diag(
        "resolved",
        "empty_runtime",
        "Resolved runtime has no capability packs and no entities",
        "warning"
      )
    );
  }

  // Circular pack module references are not expressible as a graph today;
  // pack ids must remain unique (checked above) — no cycle possible without edges.

  const errors = diagnostics.filter((d) => d.severity === "error");
  return { ok: errors.length === 0, diagnostics };
}
