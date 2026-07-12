/**
 * Vendor + Third-Party Risk Intelligence — vendor tiering and due diligence.
 */

import type { VendorThirdPartyRiskIntelligence as VendorThirdPartyRiskIntelligenceContract } from "@/lib/platform/intelligence/legal-compliance-risk/contracts";
import { clamp } from "@/lib/platform/intelligence/legal-compliance-risk/models";
import {
  type ComplianceStatus,
  type ContractSuite,
  type LegalComplianceRiskBaseline,
  type VendorRiskRecord,
  type VendorRiskSuite,
  type VendorTier,
} from "@/lib/platform/intelligence/legal-compliance-risk/types";

const VENDOR_TEMPLATES: Array<{ vendor: string; tier: VendorTier; dataAccess: boolean; owner: string }> = [
  { vendor: "EdTech Systems Inc", tier: "critical", dataAccess: true, owner: "operations" },
  { vendor: "CloudScale", tier: "critical", dataAccess: true, owner: "operations" },
  { vendor: "Nutrition Partners", tier: "high", dataAccess: false, owner: "operations" },
  { vendor: "SafeRide Transit", tier: "high", dataAccess: false, owner: "operations" },
  { vendor: "Advisory Group", tier: "medium", dataAccess: true, owner: "legal" },
  { vendor: "Property Holdings LLC", tier: "medium", dataAccess: false, owner: "operations" },
  { vendor: "Assurance Brokers", tier: "low", dataAccess: false, owner: "legal" },
];

export class VendorThirdPartyRiskIntelligence implements VendorThirdPartyRiskIntelligenceContract {
  assess(input: {
    baseline: LegalComplianceRiskBaseline;
    contracts: ContractSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): VendorRiskSuite {
    const { baseline, contracts, now, createId } = input;
    void now;
    const vendors: VendorRiskRecord[] = VENDOR_TEMPLATES.map((template, index) => {
      const base = baseline.vendorRiskPressure * 100;
      const tierWeight = template.tier === "critical" ? 20 : template.tier === "high" ? 12 : template.tier === "medium" ? 6 : 0;
      const dataWeight = template.dataAccess ? 12 : 0;
      const riskScore = clamp(base + tierWeight + dataWeight - baseline.cyberPosture * 0.15 + (index % 3) * 3);
      const status: ComplianceStatus = riskScore >= 65 ? "non_compliant" : riskScore >= 45 ? "at_risk" : "compliant";
      const linkedContract = contracts.contracts.find((contract) => contract.counterparty === template.vendor) ?? null;
      return {
        id: createId("lcr-vendor"),
        vendor: template.vendor,
        tier: template.tier,
        riskScore,
        dataAccess: template.dataAccess,
        contractId: linkedContract?.id ?? null,
        status,
        owner: template.owner,
        narrative: `${template.vendor} (${template.tier}) vendor risk ${Math.round(riskScore)}; ${status}.`,
      };
    });

    const criticalVendors = vendors.filter((vendor) => vendor.tier === "critical").length;
    const riskPressure = clamp(
      baseline.vendorRiskPressure * 100 * 0.6 + (vendors.filter((v) => v.status !== "compliant").length / Math.max(1, vendors.length)) * 40
    );
    const coverageScore = clamp(100 - riskPressure * 0.6 + baseline.contractCoverage * 0.3);

    return {
      vendors,
      riskPressure,
      criticalVendors,
      coverageScore,
      narrative: `Vendor risk pressure ${Math.round(riskPressure)} across ${vendors.length} vendors; ${criticalVendors} critical.`,
    };
  }
}
