import { collectRegistryAuditReport } from "@/lib/platform/diagnostics/registry-audit";

export interface PlatformRegistryValidationIssue {
  code:
    | "duplicate_section_key"
    | "missing_module_registration"
    | "orphaned_section_module"
    | "invalid_navigation_group";
  message: string;
}

export interface PlatformRegistryValidationResult {
  ok: boolean;
  issues: PlatformRegistryValidationIssue[];
}

/** Validate profile registry integrity — intended for build-time checks. */
export function validatePlatformRegistry(): PlatformRegistryValidationResult {
  const report = collectRegistryAuditReport();
  const issues: PlatformRegistryValidationIssue[] = [];

  for (const duplicate of report.duplicateSectionKeys) {
    issues.push({
      code: "duplicate_section_key",
      message: `Duplicate section key "${duplicate.key}" registered for profile kind "${duplicate.kind}"`,
    });
  }

  for (const missing of report.missingModuleRegistrations) {
    issues.push({
      code: "missing_module_registration",
      message: `Section "${missing.sectionKey}" on profile kind "${missing.kind}" has no registered section module`,
    });
  }

  for (const orphaned of report.orphanedSectionModules) {
    issues.push({
      code: "orphaned_section_module",
      message: `Orphaned section module "${orphaned.id}" is not backed by a registered section definition`,
    });
  }

  for (const invalid of report.invalidNavigationGroups) {
    issues.push({
      code: "invalid_navigation_group",
      message: `Section "${invalid.sectionKey}" on profile kind "${invalid.kind}" uses invalid navigation group "${invalid.group}"`,
    });
  }

  return { ok: issues.length === 0, issues };
}
