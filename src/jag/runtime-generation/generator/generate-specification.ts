/**
 * Artifact generator — Resolved Runtime Model → Runtime Specification.
 * Deterministic: same inputs always yield the same frozen output.
 */

import type { RuntimeSpecification } from "@/jag/blueprints/contracts";
import type { DocumentTemplate } from "@/jag/documents";
import type { ResolvedRuntimeModel } from "@/jag/runtime-generation/contracts";

export function generateSpecificationFromResolved(
  resolved: ResolvedRuntimeModel
): RuntimeSpecification {
  return Object.freeze({
    metadata: resolved.metadata,
    entities: Object.freeze([...(resolved.entities ?? [])]),
    processes: Object.freeze([...(resolved.processes ?? [])]),
    decisions: Object.freeze([...(resolved.decisions ?? [])]),
    forms: Object.freeze([...(resolved.forms ?? [])]),
    documents: resolved.documents
      ? Object.freeze({
          categories: resolved.documents.categories
            ? Object.freeze([...resolved.documents.categories])
            : undefined,
          definitions: Object.freeze([
            ...(resolved.documents.definitions ?? []),
          ]),
          templates: (
            resolved.documents as {
              templates?: readonly DocumentTemplate[];
            }
          ).templates
            ? Object.freeze([
                ...((
                  resolved.documents as {
                    templates: readonly DocumentTemplate[];
                  }
                ).templates ?? []),
              ])
            : undefined,
        })
      : undefined,
    communications: resolved.communications
      ? Object.freeze({
          definitions: Object.freeze([
            ...(resolved.communications.definitions ?? []),
          ]),
          templates: Object.freeze([
            ...(resolved.communications.templates ?? []),
          ]),
        })
      : undefined,
    permissions: Object.freeze([...(resolved.permissions ?? [])]),
    reports: Object.freeze([...(resolved.reports ?? [])]),
    navigation: Object.freeze([...(resolved.navigation ?? [])]),
    workflows: Object.freeze([...(resolved.workflows ?? [])]),
    terminology: Object.freeze([...(resolved.terminology ?? [])]),
    localization: Object.freeze([...(resolved.localization ?? [])]),
    integrations: Object.freeze([...(resolved.integrations ?? [])]),
    configuration: resolved.configuration,
  });
}
