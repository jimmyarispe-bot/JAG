/**
 * Blueprint Framework v1 — validate an Industry Blueprint against the standard.
 * Structural checks only. Does not execute Runtime Generation or Compiler.
 */

import type { IndustryBlueprint } from "@/jag/blueprints/contracts";
import {
  BLUEPRINT_FRAMEWORK_VERSION,
  REQUIRED_INDUSTRY_CATALOG_KEYS,
  type FrameworkValidationIssue,
  type FrameworkValidationResult,
} from "@/jag/blueprint-framework/contracts";
import {
  BLUEPRINT_FOUNDATION_MODULES,
  FORBIDDEN_INDUSTRY_PACK_IDS,
} from "@/jag/blueprint-framework/conventions";

function issue(
  path: string,
  code: string,
  message: string
): FrameworkValidationIssue {
  return { path, code, message };
}

function isNonEmptyArray(value: unknown): value is readonly unknown[] {
  return Array.isArray(value) && value.length > 0;
}

/**
 * Validate that an Industry Blueprint conforms to Blueprint Framework v1.
 */
export function validateIndustryAgainstBlueprintFramework(
  industry: IndustryBlueprint
): FrameworkValidationResult {
  const issues: FrameworkValidationIssue[] = [];

  if (!industry.id?.trim()) {
    issues.push(issue("id", "required", "Industry id is required"));
  }
  if (!industry.label?.trim()) {
    issues.push(issue("label", "required", "Industry label is required"));
  }
  if (!industry.version?.trim()) {
    issues.push(issue("version", "required", "Industry version is required"));
  }
  if (!industry.studioProfile) {
    issues.push(
      issue("studioProfile", "required", "studioProfile is required")
    );
  }

  const modules = new Set(industry.modules ?? []);
  for (const mod of BLUEPRINT_FOUNDATION_MODULES) {
    if (!modules.has(mod)) {
      issues.push(
        issue(
          "modules",
          "missing_foundation_module",
          `Foundation module "${mod}" is required`
        )
      );
    }
  }

  const keys = (industry.configuration?.keys ?? {}) as Record<string, unknown>;
  const composition = keys.composition as
    | {
        version?: string;
        foundationModules?: readonly string[];
        verticalModules?: readonly string[];
        foundationCapabilities?: readonly {
          module?: string;
          capability?: string;
        }[];
      }
    | undefined;

  if (!composition) {
    issues.push(
      issue(
        "configuration.keys.composition",
        "required",
        "composition is required on configuration.keys"
      )
    );
  } else {
    if (!composition.version?.trim()) {
      issues.push(
        issue(
          "configuration.keys.composition.version",
          "required",
          "composition.version is required"
        )
      );
    }
    if (!isNonEmptyArray(composition.foundationModules)) {
      issues.push(
        issue(
          "configuration.keys.composition.foundationModules",
          "required",
          "foundationModules must be a non-empty array"
        )
      );
    } else {
      for (const mod of BLUEPRINT_FOUNDATION_MODULES) {
        if (!composition.foundationModules.includes(mod)) {
          issues.push(
            issue(
              "configuration.keys.composition.foundationModules",
              "missing_foundation_module",
              `composition.foundationModules must include "${mod}"`
            )
          );
        }
      }
    }
    if (!Array.isArray(composition.verticalModules)) {
      issues.push(
        issue(
          "configuration.keys.composition.verticalModules",
          "required",
          "verticalModules must be an array"
        )
      );
    }
    const caps = composition.foundationCapabilities;
    if (!isNonEmptyArray(caps)) {
      issues.push(
        issue(
          "configuration.keys.composition.foundationCapabilities",
          "required",
          "foundationCapabilities must be a non-empty array"
        )
      );
    } else if (caps.length !== BLUEPRINT_FOUNDATION_MODULES.length) {
      issues.push(
        issue(
          "configuration.keys.composition.foundationCapabilities",
          "count",
          `foundationCapabilities must have ${BLUEPRINT_FOUNDATION_MODULES.length} entries`
        )
      );
    } else {
      for (const binding of caps) {
        if (!binding.module?.trim() || !binding.capability?.trim()) {
          issues.push(
            issue(
              "configuration.keys.composition.foundationCapabilities",
              "invalid",
              "Each foundationCapabilities entry needs module and capability"
            )
          );
          break;
        }
        if (binding.module.includes(".core") || binding.capability.includes(".core")) {
          issues.push(
            issue(
              "configuration.keys.composition.foundationCapabilities",
              "pack_id_forbidden",
              "foundationCapabilities must use module/capability keys, not pack ids"
            )
          );
          break;
        }
      }
    }
  }

  const catalogs = keys.catalogs as Record<string, unknown> | undefined;
  if (!catalogs || typeof catalogs !== "object") {
    issues.push(
      issue(
        "configuration.keys.catalogs",
        "required",
        "catalogs payload is required on configuration.keys"
      )
    );
  } else {
    for (const catalogKey of REQUIRED_INDUSTRY_CATALOG_KEYS) {
      if (!isNonEmptyArray(catalogs[catalogKey])) {
        issues.push(
          issue(
            `configuration.keys.catalogs.${catalogKey}`,
            "required",
            `Catalog "${catalogKey}" must be a non-empty array`
          )
        );
      }
    }
  }

  const configJson = JSON.stringify(keys);
  for (const packId of FORBIDDEN_INDUSTRY_PACK_IDS) {
    if (configJson.includes(packId)) {
      issues.push(
        issue(
          "configuration.keys",
          "pack_id_forbidden",
          `Industry Blueprint must not contain pack id "${packId}"`
        )
      );
    }
  }

  if (keys.stub === true) {
    issues.push(
      issue(
        "configuration.keys.stub",
        "stub_forbidden",
        "Stub industry blueprints do not satisfy Blueprint Framework v1"
      )
    );
  }

  return {
    ok: issues.length === 0,
    frameworkVersion: BLUEPRINT_FRAMEWORK_VERSION,
    industryId: industry.id,
    issues,
  };
}
