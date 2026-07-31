import { DecisionService } from "@/lib/platform/decisions";
import { buildAutomationDecisionMergeKey } from "@/lib/platform/decisions";
import { EntityService } from "@/lib/platform/entities";
import { attachFormDocuments } from "@/lib/platform/forms/documents";
import { assertFormActionAllowed } from "@/lib/platform/forms/permissions";
import { assertFormRegistered } from "@/lib/platform/forms/registry";
import { applyFormDefaults } from "@/lib/platform/forms/defaults";
import {
  runUniquenessHooks,
  validateFormValues,
} from "@/lib/platform/forms/validation";
import { getValueAtPath } from "@/lib/platform/forms/visibility";
import type {
  FormSubmitContext,
  FormSubmitResult,
  FormValues,
} from "@/lib/platform/forms/types";
import { WorkflowService } from "@/lib/platform/workflows/framework";
import type { WorkflowParticipantRole } from "@/lib/platform/workflows/framework";

function displayNameFromValues(values: FormValues, formTitle: string): string {
  const candidates = ["displayName", "name", "title", "fullName", "email"];
  for (const key of candidates) {
    const v = values[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return formTitle;
}

/**
 * Validate + optional entity / workflow / document / decision side-effects.
 * No application-specific business logic.
 */
export async function submitForm(
  formId: string,
  rawValues: FormValues,
  context: FormSubmitContext = {}
): Promise<FormSubmitResult> {
  const definition = assertFormRegistered(formId);
  assertFormActionAllowed({
    definition,
    action: "submit",
    grantedPermissions: context.grantedPermissions ?? [],
  });

  const values = applyFormDefaults(definition, rawValues);
  const validation = validateFormValues(definition, values);
  const uniquenessIssues = await runUniquenessHooks(definition, values);
  if (uniquenessIssues.length) {
    validation.issues.push(...uniquenessIssues);
    validation.valid = false;
  }

  const result: FormSubmitResult = {
    formId,
    values,
    validation,
    entityId: context.entityId ?? null,
    workflowInstanceId: null,
    decisionIds: [],
    documentIds: [],
    timelineEventIds: [],
    errors: [],
  };

  if (!validation.valid) {
    result.errors = validation.issues.map((i) => `${i.path}: ${i.message}`);
    return result;
  }

  const now = context.now ?? new Date().toISOString();
  const binding = definition.workflow ?? null;
  let entityId = context.entityId ?? null;

  try {
    if (definition.entityType) {
      if (!EntityService.isRegistered(definition.entityType)) {
        throw new Error(
          `Entity type "${definition.entityType}" must be registered before form submit`
        );
      }

      if (!entityId) {
        entityId = `form-entity:${definition.id}:${now}`;
        EntityService.create({
          id: entityId,
          entityType: definition.entityType,
          applicationId: definition.applicationId,
          organizationId: context.organizationId ?? null,
          displayName: displayNameFromValues(values, definition.title),
          createdAt: now,
          metadata: { formId: definition.id, values },
        });
      } else {
        const existing = EntityService.get(definition.entityType, entityId);
        if (existing) {
          EntityService.upsert({
            ...existing,
            updatedAt: now,
            metadata: { ...existing.metadata, formId: definition.id, values },
          });
        } else {
          EntityService.create({
            id: entityId,
            entityType: definition.entityType,
            applicationId: definition.applicationId,
            organizationId: context.organizationId ?? null,
            displayName: displayNameFromValues(values, definition.title),
            createdAt: now,
            metadata: { formId: definition.id, values },
          });
        }
      }
      result.entityId = entityId;

      if (binding?.recordTimeline !== false) {
        const entry = EntityService.recordActivity({
          entityType: definition.entityType,
          entityId,
          eventType: "form.submitted",
          title: `Form submitted: ${definition.title}`,
          actorUserId: context.actorUserId,
          refId: definition.id,
          occurredAt: now,
          metadata: { formId: definition.id, version: definition.version },
        });
        result.timelineEventIds.push(entry.id);
      }

      if (binding?.attachDocuments) {
        const uploadKeys = definition.fields
          .filter((f) => f.type === "document_upload")
          .map((f) => f.key);
        result.documentIds = attachFormDocuments({
          entityType: definition.entityType,
          entityId,
          organizationId: context.organizationId,
          values,
          fieldKeys: uploadKeys,
          actorUserId: context.actorUserId,
          now,
        });
      }
    }

    if (binding?.createDecision) {
      const mergeKey = buildAutomationDecisionMergeKey({
        organizationId: context.organizationId ?? null,
        ruleId: `form:${definition.id}`,
        subjectKey: entityId ?? now,
      });
      const { decision } = DecisionService.create({
        mergeKey,
        title: `Form: ${definition.title}`,
        description: `Submitted via form ${definition.id}`,
        organizationId: context.organizationId ?? null,
        applicationId: definition.applicationId,
        priority: "medium",
        actorUserId: context.actorUserId,
        now,
        reason: "Form submission",
      });
      result.decisionIds.push(decision.id);
    }

    if (binding?.startOnSubmit && definition.entityType && entityId) {
      const participants = (binding.participantBindings ?? []).map((p) =>
        WorkflowService.bindParticipant({
          role: p.role as WorkflowParticipantRole,
          userId: p.userIdPath
            ? String(getValueAtPath(values, p.userIdPath) ?? "")
            : context.actorUserId,
          domainRole: p.domainRole ?? null,
        })
      );

      const instance = WorkflowService.startForEntity({
        definitionId: binding.startOnSubmit,
        entityType: definition.entityType,
        entityId,
        organizationId: context.organizationId,
        actorUserId: context.actorUserId,
        participants,
        facts: values,
        now,
      });
      result.workflowInstanceId = instance.id;
    }

    const advance = binding?.advanceOnSubmit ?? binding?.completeOnSubmit;
    if (advance) {
      const instanceId = String(
        getValueAtPath(values, advance.instanceIdPath) ?? ""
      );
      if (!instanceId) {
        throw new Error(
          `Workflow advance requires value at ${advance.instanceIdPath}`
        );
      }
      const next = WorkflowService.transition({
        instanceId,
        transitionKey: advance.transitionKey,
        actorUserId: context.actorUserId,
        actorParticipantRole: context.actorParticipantRole as never,
        grantedPermissions: context.workflowGrantedPermissions ?? [],
        factUpdates: values,
        now,
      });
      result.workflowInstanceId = next.id;
    }
  } catch (err) {
    result.errors.push(err instanceof Error ? err.message : String(err));
  }

  return result;
}
