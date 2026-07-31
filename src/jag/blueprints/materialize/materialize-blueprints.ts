/**
 * Blueprint Engine — materialize Industry + Organization → Runtime Specification.
 */

import type {
  IndustryBlueprint,
  MaterializeBlueprintsResult,
  OrganizationBlueprint,
  RuntimeSpecification,
} from "@/jag/blueprints/contracts";
import {
  mergeByKey,
  mergeCommunicationBundles,
  mergeDocumentBundles,
  mergeTerminology,
} from "@/jag/blueprints/materialize/merge";
import { validateBlueprintPair } from "@/jag/blueprints/validation";

export function materializeBlueprints(
  industry: IndustryBlueprint,
  organization: OrganizationBlueprint
): MaterializeBlueprintsResult {
  const validation = validateBlueprintPair(industry, organization);
  if (!validation.ok) {
    return {
      ok: false,
      industryId: industry.id,
      organizationId: organization.id,
      error: {
        code: "blueprint_invalid",
        message: validation.issues.map((i) => i.message).join("; "),
      },
    };
  }

  const tags = Object.freeze([
    ...new Set([
      industry.id,
      ...(industry.tags ?? []),
      ...(organization.tags ?? []),
    ]),
  ]);

  const disabledEntityTypes = new Set(organization.disableEntityTypes ?? []);
  const disabledPermissionIds = new Set(organization.disablePermissionIds ?? []);
  const disabledReportIds = new Set(organization.disableReportIds ?? []);
  const disabledTerminologyIds = new Set(
    organization.disableTerminologyIds ?? []
  );
  const disabledIntegrationIds = new Set(
    organization.disableIntegrationIds ?? []
  );
  const disabledProcessIds = new Set(organization.disableProcessIds ?? []);
  const disabledDecisionIds = new Set(organization.disableDecisionIds ?? []);
  const disabledFormIds = new Set(organization.disableFormIds ?? []);

  const specification: RuntimeSpecification = Object.freeze({
    metadata: Object.freeze({
      id: organization.packageId,
      applicationId: organization.applicationId,
      displayName: organization.displayName,
      description:
        organization.description ??
        industry.description ??
        `${organization.displayName} (${industry.label})`,
      version: organization.version,
      publisher: organization.publisher,
      tags,
    }),
    entities: Object.freeze(
      mergeByKey(industry.entities, organization.entities, (e) => e.entityType).filter(
        (e) => !disabledEntityTypes.has(e.entityType)
      )
    ),
    processes: Object.freeze(
      mergeByKey(industry.processes, organization.processes, (p) => p.id).filter(
        (p) => !disabledProcessIds.has(p.id)
      )
    ),
    decisions: Object.freeze(
      mergeByKey(industry.decisions, organization.decisions, (d) => d.id).filter(
        (d) => !disabledDecisionIds.has(d.id)
      )
    ),
    forms: Object.freeze(
      mergeByKey(industry.forms, organization.forms, (f) => f.id).filter(
        (f) => !disabledFormIds.has(f.id)
      )
    ),
    documents: mergeDocumentBundles(
      industry.documents,
      organization.documents
    ) as RuntimeSpecification["documents"],
    communications: mergeCommunicationBundles(
      industry.communications,
      organization.communications
    ) as RuntimeSpecification["communications"],
    permissions: Object.freeze(
      mergeByKey(
        industry.permissions,
        organization.permissions,
        (p) => p.id
      ).filter((p) => !disabledPermissionIds.has(p.id))
    ),
    reports: Object.freeze(
      mergeByKey(industry.reports, organization.reports, (r) => r.id).filter(
        (r) => !disabledReportIds.has(r.id)
      )
    ),
    navigation: Object.freeze(
      mergeByKey(industry.navigation, organization.navigation, (n) => n.id)
    ),
    workflows: Object.freeze(
      mergeByKey(industry.workflows, organization.workflows, (w) =>
        String(w.id)
      )
    ),
    terminology: Object.freeze(
      mergeTerminology(industry.terminology, organization.terminology).filter(
        (t) => !disabledTerminologyIds.has(t.id)
      )
    ),
    localization: Object.freeze(
      mergeByKey(
        industry.localization,
        organization.localization,
        (l) => l.id
      )
    ),
    integrations: Object.freeze(
      mergeByKey(
        industry.integrations,
        organization.integrations,
        (i) => i.id
      ).filter((i) => !disabledIntegrationIds.has(i.id))
    ),
    configuration: Object.freeze({
      keys: Object.freeze({
        ...(industry.configuration?.keys ?? {}),
        ...(organization.configuration?.keys ?? {}),
        industryId: industry.id,
        organizationBlueprintId: organization.id,
        enabledModules: Object.freeze([
          ...(organization.enabledModules ?? industry.modules ?? []),
        ]),
        disabledModules: Object.freeze([
          ...(organization.disabledModules ?? []),
        ]),
      }),
    }),
  });

  return {
    ok: true,
    specification,
    industryId: industry.id,
    organizationId: organization.id,
  };
}
