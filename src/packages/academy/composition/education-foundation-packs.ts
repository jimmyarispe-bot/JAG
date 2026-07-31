/**
 * Organization-layer resolution of Education foundation modules → Capability Packs.
 *
 * Industry Blueprints must not own package ids (constitution).
 * The Academy Organization Blueprint owns pack attachment.
 */

import type { CapabilityPack } from "@/jag/blueprints";
import { EDUCATION_FOUNDATION_MODULES } from "@/jag/blueprints";
import { buildAnalyticsCapabilityPacks } from "@/packages/analytics/capability-packs";
import { buildCommunicationsCapabilityPacks } from "@/packages/communications/capability-packs";
import { buildDecisionCapabilityPacks } from "@/packages/decision/capability-packs";
import { buildDocumentsCapabilityPacks } from "@/packages/documents/capability-packs";
import { buildIdentityCapabilityPacks } from "@/packages/identity/capability-packs";
import { buildPolicyCapabilityPacks } from "@/packages/policy/capability-packs";
import { buildReportingCapabilityPacks } from "@/packages/reporting/capability-packs";
import { buildSchedulingCapabilityPacks } from "@/packages/scheduling/capability-packs";
import { buildWorkCapabilityPacks } from "@/packages/work/capability-packs";

/** Documented module → pack id mapping (Organization owns these ids). */
export const EDUCATION_FOUNDATION_PACK_IDS = Object.freeze([
  "identity.core",
  "documents.core",
  "communications.core",
  "scheduling.core",
  "work.core",
  "decision.core",
  "policy.core",
  "reporting.core",
  "analytics.core",
] as const);

/**
 * Build production foundation packs for Education composition.
 * Order is stable for deterministic Runtime Generation.
 */
export function buildEducationFoundationCapabilityPacks(): readonly CapabilityPack[] {
  return Object.freeze([
    ...buildIdentityCapabilityPacks(),
    ...buildDocumentsCapabilityPacks(),
    ...buildCommunicationsCapabilityPacks(),
    ...buildSchedulingCapabilityPacks(),
    ...buildWorkCapabilityPacks(),
    ...buildDecisionCapabilityPacks(),
    ...buildPolicyCapabilityPacks(),
    ...buildReportingCapabilityPacks(),
    ...buildAnalyticsCapabilityPacks(),
  ]);
}

export function educationFoundationModules(): readonly string[] {
  return EDUCATION_FOUNDATION_MODULES;
}
