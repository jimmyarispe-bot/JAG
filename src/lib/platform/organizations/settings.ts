import {
  DEFAULT_ACADEMIC_CONFIG,
  DEFAULT_ORGANIZATION_CONFIG,
} from "@/lib/configuration/types";
import type {
  OrganizationPolicies,
  OrganizationSettings,
  OrganizationSettingsJson,
} from "@/lib/platform/organizations/types";

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function pickString(...candidates: unknown[]): string {
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim();
  }
  return "";
}

function pickStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const items = value.filter((v): v is string => typeof v === "string" && Boolean(v.trim()));
  return items.length ? items : fallback;
}

export function resolveOrganizationSettings(input: {
  orgTimezone?: string | null;
  orgSettings?: unknown;
  organizationConfig?: Record<string, unknown>;
  academicConfig?: Record<string, unknown>;
}): OrganizationSettings {
  const orgConfig = input.organizationConfig ?? {};
  const academic = input.academicConfig ?? {};
  const settingsJson = asRecord(input.orgSettings) as OrganizationSettingsJson;

  const languages = pickStringArray(
    orgConfig.languages,
    DEFAULT_ORGANIZATION_CONFIG.languages
  );
  const currencies = pickStringArray(
    orgConfig.currencies,
    DEFAULT_ORGANIZATION_CONFIG.currencies
  );

  const timezone =
    pickString(input.orgTimezone, orgConfig.timezone, settingsJson.timezone as string) ||
    DEFAULT_ORGANIZATION_CONFIG.timezone;

  const locale =
    pickString(settingsJson.locale, languages[0]) || "en";

  const currency =
    pickString(settingsJson.currency, currencies[0]) || "USD";

  const schoolYears = Array.isArray(academic.school_years)
    ? academic.school_years
    : DEFAULT_ACADEMIC_CONFIG.school_years;

  const terms = Array.isArray(academic.terms)
    ? academic.terms
    : DEFAULT_ACADEMIC_CONFIG.terms;

  const gradeLevels = Array.isArray(academic.grade_levels)
    ? academic.grade_levels
    : DEFAULT_ACADEMIC_CONFIG.grade_levels;

  const gradingSystems = Array.isArray(academic.grading_systems)
    ? academic.grading_systems
    : DEFAULT_ACADEMIC_CONFIG.grading_systems;

  const attendance = asRecord(academic.attendance_policies);
  const minimumPct =
    typeof attendance.minimum_pct === "number" ? attendance.minimum_pct : null;

  return {
    timezone,
    locale,
    currency,
    languages,
    schoolYears,
    academicCalendar: {
      terms,
      gradeLevels,
    },
    gradingPolicy: {
      systems: gradingSystems,
      attendanceMinimumPct: minimumPct,
    },
  };
}

export function resolveOrganizationPolicies(input: {
  academicConfig?: Record<string, unknown>;
  securityConfig?: Record<string, unknown>;
}): OrganizationPolicies {
  const academic = input.academicConfig ?? {};
  const security = input.securityConfig ?? {};
  const attendance = asRecord(academic.attendance_policies);
  const password = asRecord(security.password_policy);

  return {
    attendanceMinimumPct:
      typeof attendance.minimum_pct === "number" ? attendance.minimum_pct : null,
    mfaRequired: Boolean(security.mfa_required),
    sessionTimeoutMinutes:
      typeof security.session_timeout_minutes === "number"
        ? security.session_timeout_minutes
        : typeof password.session_timeout_minutes === "number"
          ? (password.session_timeout_minutes as number)
          : null,
    raw: {
      academic,
      security,
    },
  };
}

export function resolveSupportInfo(organizationConfig: Record<string, unknown>): {
  email: string;
  phone: string | null;
} {
  const contact = asRecord(organizationConfig.contact);
  return {
    email: pickString(contact.email),
    phone: pickString(contact.phone) || null,
  };
}
