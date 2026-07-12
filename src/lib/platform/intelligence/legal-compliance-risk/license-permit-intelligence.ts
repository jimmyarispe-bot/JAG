/**
 * License + Permit Intelligence — issuance, expiration, and renewal monitoring.
 */

import type { LicensePermitIntelligence as LicensePermitIntelligenceContract } from "@/lib/platform/intelligence/legal-compliance-risk/contracts";
import { clamp } from "@/lib/platform/intelligence/legal-compliance-risk/models";
import {
  type LegalComplianceRiskBaseline,
  type LicensePermitKind,
  type LicensePermitRecord,
  type LicensePermitStatus,
  type LicensePermitSuite,
} from "@/lib/platform/intelligence/legal-compliance-risk/types";

const LICENSE_TEMPLATES: Array<{ name: string; kind: LicensePermitKind; authority: string; owner: string }> = [
  { name: "Operating License", kind: "license", authority: "State Department of Education", owner: "executive" },
  { name: "Occupancy Permit", kind: "permit", authority: "Local Building Authority", owner: "operations" },
  { name: "Food Service Permit", kind: "permit", authority: "County Health Department", owner: "operations" },
  { name: "Fire Safety Certificate", kind: "permit", authority: "Fire Marshal", owner: "operations" },
  { name: "Accreditation Certificate", kind: "license", authority: "Accrediting Body", owner: "executive" },
  { name: "Transportation Permit", kind: "permit", authority: "Department of Transportation", owner: "operations" },
];

export class LicensePermitIntelligence implements LicensePermitIntelligenceContract {
  monitor(input: {
    baseline: LegalComplianceRiskBaseline;
    now: Date;
    createId: (prefix: string) => string;
  }): LicensePermitSuite {
    const { baseline, now, createId } = input;
    const soonWindow = now.getTime() + 90 * 86_400_000;
    const records: LicensePermitRecord[] = LICENSE_TEMPLATES.map((template, index) => {
      const coverage = clamp(baseline.licensePermitCoverage + (index % 3) * 6 - (index % 2) * 10);
      const expiresInDays = Math.round((coverage - 55) * 6) + (index % 3) * 45;
      const expiresAt = new Date(now.getTime() + expiresInDays * 86_400_000).toISOString();
      const expiredNow = new Date(expiresAt).getTime() < now.getTime();
      const status: LicensePermitStatus = expiredNow
        ? "expired"
        : new Date(expiresAt).getTime() <= soonWindow
          ? "expiring"
          : coverage < 55
            ? "pending"
            : "active";
      return {
        id: createId("lcr-license"),
        name: template.name,
        kind: template.kind,
        authority: template.authority,
        status,
        issuedAt: new Date(now.getTime() - (500 + index * 60) * 86_400_000).toISOString(),
        expiresAt,
        owner: template.owner,
        narrative: `${template.name} (${template.kind}) from ${template.authority} is ${status}.`,
      };
    });

    const expiringSoon = records.filter((record) => record.status === "expiring");
    const expired = records.filter((record) => record.status === "expired");
    const nextExpiration =
      records
        .map((record) => record.expiresAt)
        .filter((date): date is string => date !== null)
        .sort()[0] ?? null;
    const monitoringScore = clamp(
      100 - baseline.expiredLicenseRatio * 55 - expired.length * 10 - expiringSoon.length * 4
    );

    return {
      records,
      monitoringScore,
      expiringSoon,
      expired,
      nextExpiration,
      narrative: `License/permit monitoring ${Math.round(monitoringScore)}; ${expired.length} expired, ${expiringSoon.length} expiring soon.`,
    };
  }
}
