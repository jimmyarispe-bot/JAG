/**
 * Cyber Governance Intelligence — control maturity and posture.
 */

import type { CyberGovernanceIntelligence as CyberGovernanceIntelligenceContract } from "@/lib/platform/intelligence/legal-compliance-risk/contracts";
import { clamp } from "@/lib/platform/intelligence/legal-compliance-risk/models";
import {
  type CyberControlRecord,
  type CyberControlStatus,
  type CyberGovernanceSuite,
  type LegalComplianceRiskBaseline,
} from "@/lib/platform/intelligence/legal-compliance-risk/types";

const CONTROL_TEMPLATES: Array<{ control: string; domain: string; owner: string }> = [
  { control: "Access Management", domain: "identity", owner: "operations" },
  { control: "Data Encryption", domain: "data_protection", owner: "operations" },
  { control: "Incident Response Plan", domain: "resilience", owner: "operations" },
  { control: "Vendor Security Review", domain: "third_party", owner: "operations" },
  { control: "Security Awareness Training", domain: "people", owner: "human_capital" },
  { control: "Backup & Recovery", domain: "resilience", owner: "operations" },
  { control: "Vulnerability Management", domain: "infrastructure", owner: "operations" },
];

export class CyberGovernanceIntelligence implements CyberGovernanceIntelligenceContract {
  assess(input: {
    baseline: LegalComplianceRiskBaseline;
    now: Date;
    createId: (prefix: string) => string;
  }): CyberGovernanceSuite {
    const { baseline, now, createId } = input;
    void now;
    const controls: CyberControlRecord[] = CONTROL_TEMPLATES.map((template, index) => {
      const maturity = clamp(baseline.cyberPosture + (index % 3) * 6 - (index % 2) * 11);
      const status: CyberControlStatus = maturity >= 70 ? "implemented" : maturity >= 45 ? "partial" : "gap";
      return {
        id: createId("lcr-cyber"),
        control: template.control,
        domain: template.domain,
        maturity,
        status,
        owner: template.owner,
        narrative: `${template.control} (${template.domain}) is ${status}; maturity ${Math.round(maturity)}.`,
      };
    });

    const gaps = controls.filter((control) => control.status === "gap").length;
    const domainScores = new Map<string, number[]>();
    for (const control of controls) {
      domainScores.set(control.domain, [...(domainScores.get(control.domain) ?? []), control.maturity]);
    }
    const weakestDomain =
      [...domainScores.entries()]
        .map(([domain, scores]) => ({ domain, avg: scores.reduce((s, v) => s + v, 0) / scores.length }))
        .sort((a, b) => a.avg - b.avg)[0]?.domain ?? "identity";
    const postureScore = clamp(
      baseline.cyberPosture * 0.7 + (1 - gaps / Math.max(1, controls.length)) * 30
    );

    return {
      controls,
      postureScore,
      gaps,
      weakestDomain,
      narrative: `Cyber posture ${Math.round(postureScore)} across ${controls.length} controls; ${gaps} gaps, weakest ${weakestDomain}.`,
    };
  }
}
