import {
  isSupportedExtensionPoint,
  listExtensionPointsForCapability,
} from "@/lib/platform/sdk/contracts";
import type {
  ApplicationManifest,
  ManifestExtension,
  SdkValidationIssue,
} from "@/lib/platform/sdk/types";

export function listManifestExtensions(
  manifest: ApplicationManifest
): ManifestExtension[] {
  return manifest.extensions ?? [];
}

export function validateExtensions(
  manifest: ApplicationManifest
): SdkValidationIssue[] {
  const issues: SdkValidationIssue[] = [];
  const seen = new Set<string>();

  for (const ext of manifest.extensions ?? []) {
    if (!ext.id?.trim()) {
      issues.push({
        path: "extensions",
        code: "invalid_extension",
        message: "Extension id is required",
      });
      continue;
    }
    if (seen.has(ext.id)) {
      issues.push({
        path: `extensions.${ext.id}`,
        code: "duplicate_extension",
        message: `Duplicate extension id "${ext.id}"`,
      });
    }
    seen.add(ext.id);

    if (!ext.extensionPoint?.trim()) {
      issues.push({
        path: `extensions.${ext.id}`,
        code: "missing_extension_point",
        message: `Extension "${ext.id}" missing extensionPoint`,
      });
      continue;
    }

    if (!isSupportedExtensionPoint(ext.extensionPoint)) {
      issues.push({
        path: `extensions.${ext.id}.extensionPoint`,
        code: "unsupported_extension",
        message: `Unsupported extension point "${ext.extensionPoint}"`,
      });
    }
  }

  return issues;
}

/**
 * Soft check: extension points that belong to undeclared capabilities.
 */
export function extensionCapabilityWarnings(
  manifest: ApplicationManifest
): SdkValidationIssue[] {
  const issues: SdkValidationIssue[] = [];
  const declared = new Set(manifest.capabilities);

  for (const ext of manifest.extensions ?? []) {
    if (!isSupportedExtensionPoint(ext.extensionPoint)) continue;
    let covered = false;
    for (const cap of declared) {
      if (
        listExtensionPointsForCapability(cap).includes(
          ext.extensionPoint as never
        )
      ) {
        covered = true;
        break;
      }
    }
    if (!covered) {
      issues.push({
        path: `extensions.${ext.id}`,
        code: "extension_capability_undeclared",
        message: `Extension point "${ext.extensionPoint}" is not covered by declared capabilities`,
      });
    }
  }

  return issues;
}
