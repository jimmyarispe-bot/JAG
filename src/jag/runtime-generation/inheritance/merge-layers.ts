/**
 * Universal inheritance merge — Industry → Capability Packs → Organization.
 * Reuses Blueprint Engine merge helpers; no industry-specific branches.
 */

import type { BlueprintContributionBundle } from "@/jag/blueprints/contracts";
import {
  mergeByKey,
  mergeCommunicationBundles,
  mergeDocumentBundles,
  mergeTerminology,
} from "@/jag/blueprints/materialize/merge";
import { sortByKey } from "@/jag/runtime-generation/artifacts";

export type DisableLists = {
  readonly disableEntityTypes?: readonly string[];
  readonly disablePermissionIds?: readonly string[];
  readonly disableReportIds?: readonly string[];
  readonly disableTerminologyIds?: readonly string[];
  readonly disableIntegrationIds?: readonly string[];
  readonly disableProcessIds?: readonly string[];
  readonly disableDecisionIds?: readonly string[];
  readonly disableFormIds?: readonly string[];
};

/** Merge contribution bundles left-to-right; later layers override by key. */
export function mergeContributionLayers(
  layers: readonly BlueprintContributionBundle[]
): BlueprintContributionBundle {
  let entities = undefined as BlueprintContributionBundle["entities"];
  let processes = undefined as BlueprintContributionBundle["processes"];
  let decisions = undefined as BlueprintContributionBundle["decisions"];
  let forms = undefined as BlueprintContributionBundle["forms"];
  let documents = undefined as BlueprintContributionBundle["documents"];
  let communications =
    undefined as BlueprintContributionBundle["communications"];
  let permissions = undefined as BlueprintContributionBundle["permissions"];
  let reports = undefined as BlueprintContributionBundle["reports"];
  let navigation = undefined as BlueprintContributionBundle["navigation"];
  let workflows = undefined as BlueprintContributionBundle["workflows"];
  let terminology = undefined as BlueprintContributionBundle["terminology"];
  let localization = undefined as BlueprintContributionBundle["localization"];
  let integrations = undefined as BlueprintContributionBundle["integrations"];

  for (const layer of layers) {
    entities = mergeByKey(entities, layer.entities, (e) => e.entityType);
    processes = mergeByKey(processes, layer.processes, (p) => p.id);
    decisions = mergeByKey(decisions, layer.decisions, (d) => d.id);
    forms = mergeByKey(forms, layer.forms, (f) => f.id);
    documents = mergeDocumentBundles(documents, layer.documents) as
      | BlueprintContributionBundle["documents"]
      | undefined;
    communications = mergeCommunicationBundles(
      communications,
      layer.communications
    ) as BlueprintContributionBundle["communications"] | undefined;
    permissions = mergeByKey(permissions, layer.permissions, (p) => p.id);
    reports = mergeByKey(reports, layer.reports, (r) => r.id);
    navigation = mergeByKey(navigation, layer.navigation, (n) => n.id);
    workflows = mergeByKey(workflows, layer.workflows, (w) => String(w.id));
    terminology = mergeTerminology(terminology, layer.terminology);
    localization = mergeByKey(localization, layer.localization, (l) => l.id);
    integrations = mergeByKey(integrations, layer.integrations, (i) => i.id);
  }

  return {
    entities,
    processes,
    decisions,
    forms,
    documents,
    communications,
    permissions,
    reports,
    navigation,
    workflows,
    terminology,
    localization,
    integrations,
  };
}

export function applyDisableLists(
  bundle: BlueprintContributionBundle,
  disables: DisableLists
): BlueprintContributionBundle {
  const entityDisable = new Set(disables.disableEntityTypes ?? []);
  const permissionDisable = new Set(disables.disablePermissionIds ?? []);
  const reportDisable = new Set(disables.disableReportIds ?? []);
  const terminologyDisable = new Set(disables.disableTerminologyIds ?? []);
  const integrationDisable = new Set(disables.disableIntegrationIds ?? []);
  const processDisable = new Set(disables.disableProcessIds ?? []);
  const decisionDisable = new Set(disables.disableDecisionIds ?? []);
  const formDisable = new Set(disables.disableFormIds ?? []);

  return {
    entities: bundle.entities?.filter((e) => !entityDisable.has(e.entityType)),
    processes: bundle.processes?.filter((p) => !processDisable.has(p.id)),
    decisions: bundle.decisions?.filter((d) => !decisionDisable.has(d.id)),
    forms: bundle.forms?.filter((f) => !formDisable.has(f.id)),
    documents: bundle.documents,
    communications: bundle.communications,
    permissions: bundle.permissions?.filter(
      (p) => !permissionDisable.has(p.id)
    ),
    reports: bundle.reports?.filter((r) => !reportDisable.has(r.id)),
    navigation: bundle.navigation,
    workflows: bundle.workflows,
    terminology: bundle.terminology?.filter(
      (t) => !terminologyDisable.has(t.id)
    ),
    localization: bundle.localization,
    integrations: bundle.integrations?.filter(
      (i) => !integrationDisable.has(i.id)
    ),
  };
}

export function normalizeContributionBundle(
  bundle: BlueprintContributionBundle
): BlueprintContributionBundle {
  return {
    entities: sortByKey(bundle.entities, (e) => e.entityType),
    processes: sortByKey(bundle.processes, (p) => p.id),
    decisions: sortByKey(bundle.decisions, (d) => d.id),
    forms: sortByKey(bundle.forms, (f) => f.id),
    documents: bundle.documents
      ? (Object.freeze({
          categories: sortByKey(bundle.documents.categories, (c) => c.id),
          definitions: sortByKey(bundle.documents.definitions, (d) => d.id),
          templates: sortByKey(
            (
              bundle.documents as {
                templates?: readonly {
                  id: string;
                  definitionId: string;
                  label: string;
                }[];
              }
            ).templates,
            (t) => t.id
          ),
        }) as typeof bundle.documents)
      : undefined,
    communications: bundle.communications
      ? Object.freeze({
          definitions: sortByKey(
            bundle.communications.definitions,
            (d) => d.id
          ),
          templates: sortByKey(bundle.communications.templates, (t) => t.id),
        })
      : undefined,
    permissions: sortByKey(bundle.permissions, (p) => p.id),
    reports: sortByKey(bundle.reports, (r) => r.id),
    navigation: sortByKey(bundle.navigation, (n) => n.id),
    workflows: sortByKey(bundle.workflows, (w) => String(w.id)),
    terminology: sortByKey(bundle.terminology, (t) => t.id),
    localization: sortByKey(bundle.localization, (l) => l.id),
    integrations: sortByKey(bundle.integrations, (i) => i.id),
  };
}
