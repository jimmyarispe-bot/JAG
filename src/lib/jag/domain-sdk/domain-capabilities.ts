/**
 * Declared domain capability tokens — industry-agnostic.
 * Domains advertise what they contribute; Core does not interpret industry meaning.
 */

export const DOMAIN_CAPABILITIES = [
  "identity",
  "context",
  "intent",
  "cognition",
  "experience",
  "action",
  "evidence",
  "memory",
  "twin",
] as const;

export type DomainCapability = (typeof DOMAIN_CAPABILITIES)[number];

export function isDomainCapability(value: string): value is DomainCapability {
  return (DOMAIN_CAPABILITIES as readonly string[]).includes(value);
}

/** Capabilities that imply mutating Action participation. */
export const MUTATING_CAPABILITIES: readonly DomainCapability[] = [
  "action",
] as const;

/**
 * Minimum contributors expected when a capability is declared.
 * Identity may be satisfied by host/platform — listed as recommended.
 */
export const CAPABILITY_CONTRIBUTOR_EXPECTATIONS: Readonly<
  Record<
    DomainCapability,
    { required: boolean; contributorKind: DomainCapability }
  >
> = {
  identity: { required: false, contributorKind: "identity" },
  context: { required: true, contributorKind: "context" },
  intent: { required: false, contributorKind: "intent" },
  cognition: { required: true, contributorKind: "cognition" },
  experience: { required: false, contributorKind: "experience" },
  action: { required: true, contributorKind: "action" },
  evidence: { required: false, contributorKind: "evidence" },
  memory: { required: false, contributorKind: "memory" },
  twin: { required: false, contributorKind: "twin" },
};
