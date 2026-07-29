/**
 * Domain validation — manifest, versions, contributors, constitution.
 */

import {
  CAPABILITY_CONTRIBUTOR_EXPECTATIONS,
  isDomainCapability,
  type DomainCapability,
} from "./domain-capabilities";
import type { DomainManifest } from "./domain-manifest";
import type { DomainContributorBundle } from "./domain-metadata";
import {
  checkVersionCompatibility,
  isValidSemVer,
  type VersionCompatibilityInput,
} from "./domain-version";

export type DomainValidationCode =
  | "MANIFEST_INCOMPLETE"
  | "MANIFEST_INVALID_ID"
  | "VERSION_INVALID"
  | "VERSION_INCOMPATIBLE"
  | "CONTRIBUTOR_MISSING"
  | "CONTRIBUTOR_UNDECLARED"
  | "CONTRIBUTOR_DUPLICATE"
  | "CAPABILITY_UNSUPPORTED"
  | "CONTRACT_VIOLATION"
  | "RUNTIME_INCOMPATIBLE"
  | "CONSTITUTIONAL_VIOLATION";

export interface DomainValidationIssue {
  code: DomainValidationCode;
  message: string;
  path?: string;
  severity: "error" | "warning";
}

export interface DomainValidationResult {
  ok: boolean;
  errors: DomainValidationIssue[];
  warnings: DomainValidationIssue[];
}

export interface DomainValidationOptions {
  host?: {
    runtimeVersion: string;
    coreVersion: string;
    sdkVersion?: string;
  };
  /** Registered contributor instances (from builder). */
  bundle?: DomainContributorBundle;
  /** When true, treat warnings as failures. */
  strict?: boolean;
}

const DOMAIN_ID_RE = /^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/;
const RESERVED_IDS = new Set([
  "jag",
  "jag.core",
  "jag.runtime",
  "runtime",
  "core",
  "sdk",
  "domain-sdk",
]);

function issue(
  code: DomainValidationCode,
  message: string,
  severity: "error" | "warning" = "error",
  path?: string
): DomainValidationIssue {
  return { code, message, severity, path };
}

export function validateDomainManifest(
  manifest: DomainManifest,
  options: DomainValidationOptions = {}
): DomainValidationResult {
  const errors: DomainValidationIssue[] = [];
  const warnings: DomainValidationIssue[] = [];

  const requiredStrings: Array<[keyof DomainManifest, string]> = [
    ["id", manifest.id],
    ["name", manifest.name],
    ["displayName", manifest.displayName],
    ["version", manifest.version],
    ["description", manifest.description],
    ["requiredRuntimeVersion", manifest.requiredRuntimeVersion],
    ["minimumCoreVersion", manifest.minimumCoreVersion],
  ];
  for (const [key, value] of requiredStrings) {
    if (typeof value !== "string" || value.trim().length === 0) {
      errors.push(
        issue("MANIFEST_INCOMPLETE", `Manifest field "${key}" is required`, "error", key)
      );
    }
  }

  if (!manifest.owner?.name?.trim()) {
    errors.push(
      issue("MANIFEST_INCOMPLETE", "Manifest owner.name is required", "error", "owner.name")
    );
  }

  if (manifest.id && !DOMAIN_ID_RE.test(manifest.id)) {
    errors.push(
      issue(
        "MANIFEST_INVALID_ID",
        `Domain id must be lowercase dotted/kebab id: ${manifest.id}`,
        "error",
        "id"
      )
    );
  }

  if (manifest.id && RESERVED_IDS.has(manifest.id)) {
    errors.push(
      issue(
        "CONSTITUTIONAL_VIOLATION",
        `Domain id "${manifest.id}" is reserved — domains must not claim Core identity`,
        "error",
        "id"
      )
    );
  }

  const productClaims = [manifest.name, manifest.displayName].map((s) =>
    s.trim().toLowerCase()
  );
  if (
    productClaims.some(
      (s) => s === "jag" || s === "jag™" || s === "jag os" || s === "jag runtime"
    )
  ) {
    errors.push(
      issue(
        "CONSTITUTIONAL_VIOLATION",
        "Domain must not claim to be the JAG product (Law 1)",
        "error",
        "displayName"
      )
    );
  }

  if (manifest.version && !isValidSemVer(manifest.version)) {
    errors.push(
      issue("VERSION_INVALID", `Invalid domain version: ${manifest.version}`, "error", "version")
    );
  }

  for (const capability of manifest.supportedCapabilities) {
    if (!isDomainCapability(capability)) {
      errors.push(
        issue(
          "CAPABILITY_UNSUPPORTED",
          `Unknown capability: ${capability}`,
          "error",
          "supportedCapabilities"
        )
      );
    }
  }

  const declaredIds = new Set<string>();
  for (const contrib of manifest.contributors) {
    if (!contrib.id?.trim()) {
      errors.push(
        issue("MANIFEST_INCOMPLETE", "Contributor declaration missing id", "error", "contributors")
      );
      continue;
    }
    if (declaredIds.has(contrib.id)) {
      errors.push(
        issue(
          "CONTRIBUTOR_DUPLICATE",
          `Duplicate contributor id in manifest: ${contrib.id}`,
          "error",
          "contributors"
        )
      );
    }
    declaredIds.add(contrib.id);
    if (!isDomainCapability(contrib.kind)) {
      errors.push(
        issue(
          "CONTRACT_VIOLATION",
          `Contributor ${contrib.id} has invalid kind: ${contrib.kind}`,
          "error",
          "contributors"
        )
      );
    }
  }

  for (const capability of manifest.supportedCapabilities) {
    const expectation = CAPABILITY_CONTRIBUTOR_EXPECTATIONS[capability as DomainCapability];
    if (!expectation?.required) continue;
    const hasKind = manifest.contributors.some((c) => c.kind === expectation.contributorKind);
    if (!hasKind) {
      errors.push(
        issue(
          "CONTRIBUTOR_MISSING",
          `Capability "${capability}" requires a ${expectation.contributorKind} contributor declaration`,
          "error",
          "contributors"
        )
      );
    }
  }

  if (
    manifest.supportedCapabilities.includes("action") &&
    manifest.permissions.length === 0
  ) {
    warnings.push(
      issue(
        "CONTRACT_VIOLATION",
        "Action capability declared but permissions list is empty",
        "warning",
        "permissions"
      )
    );
  }

  if (options.host) {
    const versionInput: VersionCompatibilityInput = {
      domainVersion: manifest.version,
      runtimeVersion: options.host.runtimeVersion,
      coreVersion: options.host.coreVersion,
      requiredRuntimeVersion: manifest.requiredRuntimeVersion,
      minimumCoreVersion: manifest.minimumCoreVersion,
      sdkVersion: options.host.sdkVersion,
      requiredSdkVersion: manifest.requiredSdkVersion,
    };
    const compat = checkVersionCompatibility(versionInput);
    for (const message of compat.errors) {
      errors.push(issue("VERSION_INCOMPATIBLE", message, "error", "version"));
    }
    for (const message of compat.warnings) {
      warnings.push(issue("VERSION_INCOMPATIBLE", message, "warning", "version"));
    }
    if (!compat.ok) {
      errors.push(
        issue(
          "RUNTIME_INCOMPATIBLE",
          "Domain is not compatible with host Runtime/Core versions",
          "error"
        )
      );
    }
  }

  if (options.bundle) {
    validateContributorBundle(manifest, options.bundle, errors, warnings);
  }

  const ok =
    errors.length === 0 && (!options.strict || warnings.length === 0);
  return { ok, errors, warnings };
}

function validateContributorBundle(
  manifest: DomainManifest,
  bundle: DomainContributorBundle,
  errors: DomainValidationIssue[],
  warnings: DomainValidationIssue[]
): void {
  const registered = flattenBundle(bundle);
  const registeredIds = new Set(registered.map((r) => r.id));
  const declaredIds = new Set(manifest.contributors.map((c) => c.id));

  for (const declared of manifest.contributors) {
    if (!registeredIds.has(declared.id)) {
      errors.push(
        issue(
          "CONTRIBUTOR_MISSING",
          `Manifest declares contributor "${declared.id}" but it is not registered on the builder`,
          "error",
          "contributors"
        )
      );
    }
  }

  for (const reg of registered) {
    if (!reg.id?.trim()) {
      errors.push(
        issue("CONTRACT_VIOLATION", "Registered contributor missing id", "error")
      );
      continue;
    }
    if (!declaredIds.has(reg.id)) {
      warnings.push(
        issue(
          "CONTRIBUTOR_UNDECLARED",
          `Registered contributor "${reg.id}" is not listed in manifest.contributors`,
          "warning",
          "contributors"
        )
      );
    }
  }

  const idCounts = new Map<string, number>();
  for (const reg of registered) {
    idCounts.set(reg.id, (idCounts.get(reg.id) ?? 0) + 1);
  }
  for (const [id, count] of idCounts) {
    if (count > 1) {
      errors.push(
        issue("CONTRIBUTOR_DUPLICATE", `Duplicate registered contributor id: ${id}`, "error")
      );
    }
  }

  for (const capability of manifest.supportedCapabilities) {
    const expectation = CAPABILITY_CONTRIBUTOR_EXPECTATIONS[capability];
    if (!expectation.required) continue;
    const has = registered.some((r) => r.kind === expectation.contributorKind);
    if (!has) {
      errors.push(
        issue(
          "CONTRIBUTOR_MISSING",
          `Capability "${capability}" requires a registered ${expectation.contributorKind} contributor`,
          "error"
        )
      );
    }
  }
}

function flattenBundle(
  bundle: DomainContributorBundle
): Array<{ id: string; kind: DomainCapability }> {
  const out: Array<{ id: string; kind: DomainCapability }> = [];
  for (const c of bundle.identity) out.push({ id: c.id, kind: "identity" });
  for (const c of bundle.context) out.push({ id: c.id, kind: "context" });
  for (const c of bundle.intent) out.push({ id: c.id, kind: "intent" });
  for (const c of bundle.cognition) out.push({ id: c.id, kind: "cognition" });
  for (const c of bundle.experience) out.push({ id: c.id, kind: "experience" });
  for (const c of bundle.action) out.push({ id: c.id, kind: "action" });
  for (const c of bundle.evidence) out.push({ id: c.id, kind: "evidence" });
  for (const c of bundle.memory) out.push({ id: c.id, kind: "memory" });
  for (const c of bundle.twin) out.push({ id: c.id, kind: "twin" });
  return out;
}

export function validateDomain(
  manifest: DomainManifest,
  options?: DomainValidationOptions
): DomainValidationResult {
  return validateDomainManifest(manifest, options);
}
