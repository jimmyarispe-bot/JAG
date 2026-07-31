import { buildFallbackBranding } from "@/lib/branding/defaults";
import { resolveOrganizationBranding } from "@/lib/branding/resolve";
import type { OrganizationBranding } from "@/lib/branding/types";
import {
  platformDefaultEmailBrand,
  resolveOrganizationEmailBrand,
} from "@/lib/platform/auth-email/branding";
import type { OrganizationEmailBrand } from "@/lib/platform/auth-email/types";
import type { PlatformApplicationKey } from "@/lib/platform/applications/types";

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

/**
 * Resolve UI branding for OrganizationContext.
 * Delegates to existing branding resolve (Sprint P002) — no duplicate rules.
 */
export function resolveContextBranding(input: {
  organizationId: string;
  organizationName: string;
  brandingConfig?: Record<string, unknown>;
  organizationConfig?: Record<string, unknown>;
}): OrganizationBranding {
  if (!input.organizationId) {
    return buildFallbackBranding("unknown", input.organizationName || "School Platform");
  }

  return resolveOrganizationBranding({
    organizationId: input.organizationId,
    organizationName: input.organizationName,
    brandingConfig: input.brandingConfig ?? {},
    organizationConfig: input.organizationConfig ?? {},
  });
}

/**
 * Resolve email branding for OrganizationContext.
 * Delegates to auth-email branding (Sprint 060B).
 */
export function resolveContextEmailBrand(input: {
  organizationId: string;
  organizationName: string;
  applicationKey?: PlatformApplicationKey | null;
  brandingConfig?: Record<string, unknown>;
  organizationConfig?: Record<string, unknown>;
}): OrganizationEmailBrand {
  if (!input.organizationId || input.organizationId === "platform") {
    return platformDefaultEmailBrand(input.applicationKey ?? undefined);
  }

  return resolveOrganizationEmailBrand({
    organizationId: input.organizationId,
    organizationName: input.organizationName,
    applicationKey: input.applicationKey,
    brandingConfig: asRecord(input.brandingConfig),
    organizationConfig: asRecord(input.organizationConfig),
  });
}
