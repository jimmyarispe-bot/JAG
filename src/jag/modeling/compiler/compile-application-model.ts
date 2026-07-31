/**
 * Model Compiler — translates ApplicationModel into package registrations.
 * Universal: no industry packages. Uses existing JAG registries + optional ports.
 */

import {
  CommunicationRegistry,
  registerCommunication,
  registerCommunicationTemplate,
} from "@/jag/communications";
import { registerDecision, DecisionRegistry } from "@/jag/decisions";
import {
  DocumentRegistry,
  registerDocument,
  registerDocumentCategory,
  registerDocumentTemplate,
} from "@/jag/documents";
import { EntityService } from "@/jag/entities";
import { FormService } from "@/jag/forms";
import type { ApplicationModel } from "@/jag/modeling/application-model";
import type {
  ApplicationModelCompilerPorts,
  ApplicationModelCompileResult,
  CompiledContributionSnapshot,
} from "@/jag/modeling/runtime";
import { validateApplicationModel } from "@/jag/modeling/validation";
import { registerPackageNavigation } from "@/jag/navigation";
import { registerProcess, ProcessRegistry } from "@/jag/processes";
import { WorkflowService } from "@/jag/workflows";
import type { EntityTypeDefinition } from "@/lib/platform/entities";

export type CompileApplicationModelOptions = {
  readonly ports?: ApplicationModelCompilerPorts;
  /** When true, skip register if id already present (idempotent host boots). */
  readonly skipIfRegistered?: boolean;
};

function snapshot(
  kind: CompiledContributionSnapshot["kind"],
  ids: readonly string[]
): CompiledContributionSnapshot {
  return Object.freeze({ kind, ids: Object.freeze([...ids]) });
}

export function compileApplicationModel(
  model: ApplicationModel,
  options: CompileApplicationModelOptions = {}
): ApplicationModelCompileResult {
  const validation = validateApplicationModel(model);
  if (!validation.ok) {
    return {
      ok: false,
      applicationId: model.metadata?.applicationId ?? "",
      packageId: model.metadata?.id ?? "",
      version: model.metadata?.version ?? "",
      contributions: Object.freeze([]),
      counts: emptyCounts(),
      error: {
        code: "model_invalid",
        message: validation.issues.map((i) => i.message).join("; "),
      },
    };
  }

  const skip = options.skipIfRegistered ?? true;
  const ports = options.ports ?? {};
  const contributions: CompiledContributionSnapshot[] = [];

  try {
    // Entities
    const entityIds: string[] = [];
    for (const entity of model.entities ?? []) {
      if (skip && EntityService.isRegistered(entity.entityType)) {
        entityIds.push(entity.entityType);
        continue;
      }
      EntityService.registerType(entity as unknown as EntityTypeDefinition);
      entityIds.push(entity.entityType);
    }
    if (entityIds.length) contributions.push(snapshot("entities", entityIds));

    // Forms
    const formIds: string[] = [];
    for (const form of model.forms ?? []) {
      if (skip && FormService.get(form.id)) {
        formIds.push(form.id);
        continue;
      }
      FormService.register(form);
      formIds.push(form.id);
    }
    if (formIds.length) contributions.push(snapshot("forms", formIds));

    // Workflows (framework or port)
    const workflowIds: string[] = [];
    for (const workflow of model.workflows ?? []) {
      const id = String(workflow.id);
      if (ports.registerWorkflow) {
        ports.registerWorkflow(workflow);
      } else if (
        typeof (WorkflowService as { register?: (w: unknown) => void }).register ===
        "function"
      ) {
        if (skip) {
          const listed =
            (
              WorkflowService as {
                listDefinitions?: () => { id: string }[];
              }
            ).listDefinitions?.() ?? [];
          if (listed.some((w) => w.id === id)) {
            workflowIds.push(id);
            continue;
          }
        }
        (WorkflowService as { register: (w: unknown) => void }).register(
          workflow
        );
      }
      workflowIds.push(id);
    }
    if (workflowIds.length) {
      contributions.push(snapshot("workflows", workflowIds));
    }

    // Documents
    const documentIds: string[] = [];
    for (const category of model.documents?.categories ?? []) {
      if (!DocumentRegistry.getCategory(category.id)) {
        registerDocumentCategory(category);
      }
    }
    for (const definition of model.documents?.definitions ?? []) {
      if (skip && DocumentRegistry.get(definition.id)) {
        documentIds.push(definition.id);
        continue;
      }
      registerDocument(definition);
      documentIds.push(definition.id);
    }
    for (const template of model.documents?.templates ?? []) {
      if (!DocumentRegistry.getTemplate(template.id)) {
        registerDocumentTemplate(template);
      }
    }
    if (documentIds.length) {
      contributions.push(snapshot("documents", documentIds));
    }

    // Communications
    const communicationIds: string[] = [];
    for (const definition of model.communications?.definitions ?? []) {
      if (skip && CommunicationRegistry.get(definition.id)) {
        communicationIds.push(definition.id);
        continue;
      }
      registerCommunication(definition);
      communicationIds.push(definition.id);
    }
    for (const template of model.communications?.templates ?? []) {
      if (!CommunicationRegistry.getTemplate(template.id)) {
        registerCommunicationTemplate(template);
      }
    }
    if (communicationIds.length) {
      contributions.push(snapshot("communications", communicationIds));
    }

    // Decisions (before processes that may reference them)
    const decisionIds: string[] = [];
    for (const decision of model.decisions ?? []) {
      if (skip && DecisionRegistry.get(decision.id)) {
        decisionIds.push(decision.id);
        continue;
      }
      registerDecision(decision);
      decisionIds.push(decision.id);
    }
    if (decisionIds.length) {
      contributions.push(snapshot("decisions", decisionIds));
    }

    // Processes
    const processIds: string[] = [];
    for (const process of model.processes ?? []) {
      if (skip && ProcessRegistry.get(process.id)) {
        processIds.push(process.id);
        continue;
      }
      registerProcess(process);
      processIds.push(process.id);
    }
    if (processIds.length) {
      contributions.push(snapshot("processes", processIds));
    }

    // Navigation
    const navigationIds: string[] = [];
    for (const nav of model.navigation ?? []) {
      registerPackageNavigation(nav);
      navigationIds.push(nav.id);
    }
    if (navigationIds.length) {
      contributions.push(snapshot("navigation", navigationIds));
    }

    // Permissions (ports)
    const permissionIds: string[] = [];
    for (const pack of model.permissions ?? []) {
      ports.registerPermissionPack?.(pack);
      permissionIds.push(pack.id);
    }
    if (permissionIds.length) {
      contributions.push(snapshot("permissions", permissionIds));
    }

    // Reports (ports)
    const reportIds: string[] = [];
    for (const report of model.reports ?? []) {
      ports.registerReport?.(report);
      reportIds.push(report.id);
    }
    if (reportIds.length) contributions.push(snapshot("reports", reportIds));

    // Terminology / localization (ports)
    const terminologyIds: string[] = [];
    for (const pack of model.terminology ?? []) {
      ports.registerTerminology?.(pack);
      terminologyIds.push(pack.id);
    }
    if (terminologyIds.length) {
      contributions.push(snapshot("terminology", terminologyIds));
    }

    const localizationIds: string[] = [];
    for (const pack of model.localization ?? []) {
      ports.registerLocalization?.(pack);
      localizationIds.push(pack.id);
    }
    if (localizationIds.length) {
      contributions.push(snapshot("localization", localizationIds));
    }

    return {
      ok: true,
      applicationId: model.metadata.applicationId,
      packageId: model.metadata.id,
      version: model.metadata.version,
      contributions: Object.freeze(contributions),
      counts: Object.freeze({
        entities: entityIds.length,
        forms: formIds.length,
        workflows: workflowIds.length,
        processes: processIds.length,
        decisions: decisionIds.length,
        documents: documentIds.length,
        communications: communicationIds.length,
        permissions: permissionIds.length,
        reports: reportIds.length,
        navigation: navigationIds.length,
        terminology: terminologyIds.length,
        localization: localizationIds.length,
      }),
    };
  } catch (err) {
    return {
      ok: false,
      applicationId: model.metadata.applicationId,
      packageId: model.metadata.id,
      version: model.metadata.version,
      contributions: Object.freeze([]),
      counts: emptyCounts(),
      error: {
        code: "compile_failed",
        message: err instanceof Error ? err.message : "Compile failed",
      },
    };
  }
}

function emptyCounts(): ApplicationModelCompileResult["counts"] {
  return Object.freeze({
    entities: 0,
    forms: 0,
    workflows: 0,
    processes: 0,
    decisions: 0,
    documents: 0,
    communications: 0,
    permissions: 0,
    reports: 0,
    navigation: 0,
    terminology: 0,
    localization: 0,
  });
}
