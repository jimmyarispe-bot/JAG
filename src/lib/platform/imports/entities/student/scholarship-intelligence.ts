import {
  FUNDING_SOURCES,
  LEGACY_FUNDING_SOURCE_MAP,
  type FundingSourceValue,
} from "@/lib/constants/programs";
import type { ImportLookupContext, ValidationIssue } from "../../types";

const ALIAS_MAP: Record<string, FundingSourceValue> = {
  ...LEGACY_FUNDING_SOURCE_MAP,
  "private pay": "parent_pay",
  privatepay: "parent_pay",
  "parent pay": "parent_pay",
  self: "parent_pay",
  grant: "grant_funded",
  "grant funded": "grant_funded",
  esa: "esa",
  contract: "district_placement",
  "district placement": "district_placement",
  // Florida scholarships
  "florida scholarship": "step_up_for_students",
  "fl scholarship": "step_up_for_students",
  "step up": "step_up_for_students",
  "step up for students": "step_up_for_students",
  mckay: "mckay_scholarship",
  "mckay scholarship": "mckay_scholarship",
  "fes-ua": "fes_ua",
  fesua: "fes_ua",
  fes: "fes_ua",
  // Georgia scholarships / funding labels
  "georgia scholarship": "family_scholarship",
  "ga scholarship": "family_scholarship",
  "georgia esa": "esa",
  "ga esa": "esa",
};

function normalizeScholarshipLabel(value: string): string {
  return value.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

export interface ScholarshipMatch {
  code: FundingSourceValue | null;
  label: string | null;
  known: boolean;
  source: "funding_catalog" | "alias" | "fund_name" | "unknown";
}

export function recognizeScholarship(
  raw: string | null | undefined,
  ctx?: ImportLookupContext
): ScholarshipMatch {
  if (!raw || !String(raw).trim()) {
    return { code: null, label: null, known: true, source: "funding_catalog" };
  }

  const trimmed = String(raw).trim();
  const normalized = normalizeScholarshipLabel(trimmed);

  // Exact funding code
  const byCode = FUNDING_SOURCES.find((f) => f.value === trimmed || f.value === normalized.replace(/\s+/g, "_"));
  if (byCode) {
    return { code: byCode.value, label: byCode.label, known: true, source: "funding_catalog" };
  }

  // Exact funding label
  const byLabel = FUNDING_SOURCES.find((f) => normalizeScholarshipLabel(f.label) === normalized);
  if (byLabel) {
    return { code: byLabel.value, label: byLabel.label, known: true, source: "funding_catalog" };
  }

  // Alias map
  if (ALIAS_MAP[normalized]) {
    const code = ALIAS_MAP[normalized];
    const fund = FUNDING_SOURCES.find((f) => f.value === code);
    return { code, label: fund?.label ?? code, known: true, source: "alias" };
  }

  // Partial contains for common phrases
  if (normalized.includes("private pay") || normalized === "pp") {
    return { code: "parent_pay", label: "Parent Pay", known: true, source: "alias" };
  }
  if (normalized.includes("step up")) {
    return { code: "step_up_for_students", label: "Step Up For Students", known: true, source: "alias" };
  }
  if (normalized.includes("mckay")) {
    return { code: "mckay_scholarship", label: "McKay Scholarship", known: true, source: "alias" };
  }
  if (normalized.includes("esa")) {
    return { code: "esa", label: "ESA", known: true, source: "alias" };
  }
  if (normalized.includes("grant")) {
    return { code: "grant_funded", label: "Grant Funded", known: true, source: "alias" };
  }
  if (normalized.includes("contract")) {
    return { code: "district_placement", label: "District Placement", known: true, source: "alias" };
  }

  // Scholarship fund catalog match
  if (ctx) {
    for (const [fundId, fundName] of ctx.scholarshipFundNames.entries()) {
      if (normalizeScholarshipLabel(fundName) === normalized) {
        return { code: null, label: fundName, known: true, source: "fund_name" };
      }
      void fundId;
    }
  }

  return { code: null, label: trimmed, known: false, source: "unknown" };
}

export function scholarshipValidationIssue(
  raw: string | null | undefined,
  rowNumber: number,
  ctx?: ImportLookupContext
): { match: ScholarshipMatch; issue?: ValidationIssue } {
  const match = recognizeScholarship(raw, ctx);
  if (!raw || !String(raw).trim()) return { match };
  if (match.known) return { match };
  return {
    match,
    issue: {
      severity: "warning",
      code: "unknown_scholarship",
      message: `Unknown scholarship "${raw}" — will not auto-assign funding`,
      fieldName: "scholarship",
      rowNumber,
      resolutionHint: "Use a known Florida/Georgia scholarship, Private Pay, Grant, ESA, or Contract label",
    },
  };
}
