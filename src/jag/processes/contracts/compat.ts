/**
 * Sprint 002 compatibility aliases — prefer ProcessDefinition / ProcessRegistry.
 */

import type {
  ProcessDefinition,
  ProcessId,
  StageDefinition,
  StageId,
} from "@/jag/processes/contracts/definitions";

/** @deprecated Use ProcessId */
export type JagProcessId = ProcessId;
/** @deprecated Use StageId */
export type JagProcessStageId = StageId;
/** @deprecated Use ProcessDefinition */
export type JagProcessDefinition = {
  id: ProcessId;
  applicationId: string;
  version: string;
  label: string;
  description?: string;
  stages: JagProcessStageDefinition[];
  workflowDefinitionId?: string;
  initialStageId?: StageId;
  transitions?: ProcessDefinition["transitions"];
  participants?: ProcessDefinition["participants"];
  permissions?: ProcessDefinition["permissions"];
  dependsOn?: ProcessDefinition["dependsOn"];
  metadata?: ProcessDefinition["metadata"];
  extensions?: ProcessDefinition["extensions"];
};
/** @deprecated Use StageDefinition */
export type JagProcessStageDefinition = {
  id: StageId;
  label: string;
  description?: string;
  kind?: StageDefinition["kind"];
  terminal?: boolean;
  behavior?: StageDefinition["behavior"];
  transitions?: Array<{
    to: StageId;
    label?: string;
    guardPermission?: string;
  }>;
};

/** @deprecated Use ProcessRuntime.start */
export type JagProcessRuntimePort = {
  start(input: {
    processId: ProcessId;
    organizationId: string;
    actorUserId: string;
    subjectId?: string;
    payload?: Record<string, unknown>;
  }): Promise<{ instanceId: string }>;
};

/**
 * Normalize a Sprint-002-shaped definition into a ProcessDefinition.
 * Accepts either the full contract or the legacy stages-with-embedded-transitions shape.
 */
export function normalizeProcessDefinition(
  input: ProcessDefinition | JagProcessDefinition
): ProcessDefinition {
  const hasModernShape =
    typeof (input as ProcessDefinition).initialStageId === "string" &&
    Array.isArray((input as ProcessDefinition).transitions) &&
    !(input.stages ?? []).some(
      (s) => Array.isArray((s as JagProcessStageDefinition).transitions)
    );

  if (hasModernShape) {
    const def = input as ProcessDefinition;
    const extensions =
      def.extensions ??
      ((input as JagProcessDefinition).workflowDefinitionId
        ? {
            workflowDefinitionId: (input as JagProcessDefinition)
              .workflowDefinitionId,
          }
        : undefined);

    return {
      id: def.id,
      applicationId: def.applicationId,
      version: def.version,
      label: def.label,
      description: def.description,
      initialStageId: def.initialStageId,
      stages: def.stages.map((s) => ({ ...s })),
      transitions: def.transitions.map((t) => ({ ...t })),
      participants: def.participants?.map((p) => ({ ...p })),
      permissions: def.permissions?.map((p) => ({ ...p })),
      dependsOn: def.dependsOn ? [...def.dependsOn] : undefined,
      metadata: def.metadata ? { ...def.metadata } : undefined,
      extensions: extensions
        ? {
            ...extensions,
            formDefinitionIds: extensions.formDefinitionIds
              ? [...extensions.formDefinitionIds]
              : undefined,
            entityTypeIds: extensions.entityTypeIds
              ? [...extensions.entityTypeIds]
              : undefined,
            documentCategoryIds: extensions.documentCategoryIds
              ? [...extensions.documentCategoryIds]
              : undefined,
            communicationTemplateIds: extensions.communicationTemplateIds
              ? [...extensions.communicationTemplateIds]
              : undefined,
            decisionDefinitionIds: extensions.decisionDefinitionIds
              ? [...extensions.decisionDefinitionIds]
              : undefined,
            intelligencePackIds: extensions.intelligencePackIds
              ? [...extensions.intelligencePackIds]
              : undefined,
            navigationModuleIds: extensions.navigationModuleIds
              ? [...extensions.navigationModuleIds]
              : undefined,
          }
        : undefined,
    };
  }

  const legacy = input as JagProcessDefinition;
  const stages: StageDefinition[] = legacy.stages.map((stage, index) => ({
    id: stage.id,
    label: stage.label,
    description: stage.description,
    kind: stage.terminal
      ? "terminal"
      : (stage.kind ?? (index === 0 ? "initial" : "intermediate")),
    behavior: stage.behavior,
  }));

  const transitions = legacy.stages.flatMap((stage) =>
    (stage.transitions ?? []).map((t, i) => ({
      id: `${stage.id}_to_${t.to}_${i}`,
      from: stage.id,
      to: t.to,
      label: t.label,
      guardPermission: t.guardPermission,
    }))
  );

  const initial =
    stages.find((s) => s.kind === "initial")?.id ?? stages[0]?.id;
  if (!initial) {
    throw new Error(`Process "${legacy.id}" must declare at least one stage`);
  }

  // Ensure exactly one initial after legacy mapping.
  const normalizedStages = stages.map((s) =>
    s.id === initial
      ? { ...s, kind: "initial" as const }
      : s.kind === "initial"
        ? { ...s, kind: "intermediate" as const }
        : s
  );

  return {
    id: legacy.id,
    applicationId: legacy.applicationId,
    version: legacy.version,
    label: legacy.label,
    description: legacy.description,
    initialStageId: initial,
    stages: normalizedStages,
    transitions,
    extensions: legacy.workflowDefinitionId
      ? { workflowDefinitionId: legacy.workflowDefinitionId }
      : legacy.extensions,
    metadata: legacy.metadata,
    participants: legacy.participants,
    permissions: legacy.permissions,
    dependsOn: legacy.dependsOn,
  };
}
