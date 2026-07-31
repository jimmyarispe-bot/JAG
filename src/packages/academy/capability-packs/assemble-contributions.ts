/**
 * Academy contribution assembly — shared by capability packs and legacy ApplicationModel.
 * Transitional: seeds Organization Blueprint capability packs until domains are fully generated.
 */

import { ACADEMYOS_FORMS } from "@/applications/academyos/forms";
import { ACADEMYOS_NAVIGATION } from "@/applications/academyos/navigation/definition";
import { ACADEMYOS_PERMISSION_ROLE_PACKS } from "@/applications/academyos/permissions";
import { ACADEMYOS_REPORTS } from "@/applications/academyos/reports";
import { ACADEMYOS_SCHEMAS } from "@/applications/academyos/schemas/definitions";
import { ACADEMYOS_WORKFLOWS } from "@/applications/academyos/workflows";
import type { BlueprintContributionBundle } from "@/jag/blueprints";
import type { EntityModel } from "@/jag/modeling";
import { SchemaService } from "@/jag/schema";
import { WorkflowService } from "@/jag/workflows";
import {
  ACADEMY_ADMISSIONS_COMMUNICATION_DEFINITIONS,
  ACADEMY_ADMISSIONS_COMMUNICATION_TEMPLATES,
} from "@/packages/academy/communications/admissions";
import { AcademyAdmissionsEligibilityDecision } from "@/packages/academy/decisions";
import {
  ACADEMY_ADMISSIONS_DOCUMENT_CATEGORY,
  ACADEMY_ADMISSIONS_DOCUMENT_DEFINITIONS,
} from "@/packages/academy/documents/admissions";
import { ACADEMY_APPLICATION_ID } from "@/packages/academy/package";
import { AcademyAdmissionsProcessDefinition } from "@/packages/academy/processes/admissions/manifest";
import { ACADEMY_LOCALIZATION_PACKS } from "@/packages/academy/registration/localization/packs";
import { ACADEMY_TERMINOLOGY_PACKS } from "@/packages/academy/registration/terminology/packs";
import {
  ACADEMY_SCHEDULING_ENTITY_DEFINITIONS,
  ACADEMY_SCHEDULING_PERMISSION_PACK,
  ACADEMY_SCHEDULING_REPORTS,
} from "@/packages/academy/scheduling";
import {
  ACADEMY_SIS_ENTITY_DEFINITIONS,
  ACADEMY_SIS_PERMISSION_PACK,
  ACADEMY_SIS_REPORTS,
} from "@/packages/academy/sis";

function ensureAcademyWorkflowsRegistered(): void {
  for (const workflow of ACADEMYOS_WORKFLOWS) {
    if (!WorkflowService.listDefinitions().some((w) => w.id === workflow.id)) {
      WorkflowService.register(workflow);
    }
  }
}

function projectAcademyEntities(): EntityModel[] {
  ensureAcademyWorkflowsRegistered();

  for (const schema of ACADEMYOS_SCHEMAS) {
    if (!SchemaService.get(schema.id)) {
      SchemaService.register(schema);
    }
  }

  const byType = new Map<string, EntityModel>();
  for (const schema of ACADEMYOS_SCHEMAS) {
    const projected = SchemaService.projectEntity(schema);
    byType.set(projected.entityType, projected as unknown as EntityModel);
  }
  for (const entity of ACADEMY_SIS_ENTITY_DEFINITIONS) {
    byType.set(entity.entityType, entity as unknown as EntityModel);
  }
  for (const entity of ACADEMY_SCHEDULING_ENTITY_DEFINITIONS) {
    byType.set(entity.entityType, entity as unknown as EntityModel);
  }
  return [...byType.values()];
}

/** Assemble Academy contribution bundle (package seed data). */
export function assembleAcademyContributionBundle(): BlueprintContributionBundle {
  return Object.freeze({
    entities: Object.freeze(projectAcademyEntities()),
    forms: Object.freeze([...ACADEMYOS_FORMS]),
    workflows: Object.freeze(
      ACADEMYOS_WORKFLOWS.map((w) => Object.freeze({ ...w }))
    ),
    processes: Object.freeze([AcademyAdmissionsProcessDefinition]),
    decisions: Object.freeze([AcademyAdmissionsEligibilityDecision]),
    documents: Object.freeze({
      categories: Object.freeze([ACADEMY_ADMISSIONS_DOCUMENT_CATEGORY]),
      definitions: Object.freeze([...ACADEMY_ADMISSIONS_DOCUMENT_DEFINITIONS]),
    }),
    communications: Object.freeze({
      definitions: Object.freeze([
        ...ACADEMY_ADMISSIONS_COMMUNICATION_DEFINITIONS,
      ]),
      templates: Object.freeze([
        ...ACADEMY_ADMISSIONS_COMMUNICATION_TEMPLATES,
      ]),
    }),
    permissions: Object.freeze([
      ...ACADEMYOS_PERMISSION_ROLE_PACKS.map((p) =>
        Object.freeze({
          id: `academy.permission.${p.id}`,
          label: p.label,
          description: p.description,
          permissions: Object.freeze([...p.permissions]),
        })
      ),
      ACADEMY_SIS_PERMISSION_PACK,
      ACADEMY_SCHEDULING_PERMISSION_PACK,
    ]),
    reports: Object.freeze([
      ...ACADEMYOS_REPORTS.map((r) =>
        Object.freeze({
          id: r.id,
          applicationId: r.applicationId,
          title: r.title,
          domain: r.domain,
          entityType: r.entityType,
          fields: Object.freeze([...r.fields]),
          requiredPermission: r.requiredPermission,
          version: r.version,
        })
      ),
      ...ACADEMY_SIS_REPORTS,
      ...ACADEMY_SCHEDULING_REPORTS,
    ]),
    navigation: Object.freeze([
      Object.freeze({
        id: ACADEMYOS_NAVIGATION.id,
        applicationId: ACADEMY_APPLICATION_ID,
        version: ACADEMYOS_NAVIGATION.version,
        items: ACADEMYOS_NAVIGATION.items,
      }),
    ]),
    terminology: Object.freeze([...ACADEMY_TERMINOLOGY_PACKS]),
    localization: Object.freeze([...ACADEMY_LOCALIZATION_PACKS]),
    integrations: Object.freeze([]),
  });
}
