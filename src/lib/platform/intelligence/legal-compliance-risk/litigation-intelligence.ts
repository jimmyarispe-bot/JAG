/**
 * Litigation Tracking Framework — active matters, exposure, and milestones.
 */

import type { LitigationIntelligence as LitigationIntelligenceContract } from "@/lib/platform/intelligence/legal-compliance-risk/contracts";
import { clamp } from "@/lib/platform/intelligence/legal-compliance-risk/models";
import {
  type LegalComplianceRiskBaseline,
  type LitigationMatterRecord,
  type LitigationStatus,
  type LitigationSuite,
} from "@/lib/platform/intelligence/legal-compliance-risk/types";

const MATTER_TEMPLATES: Array<{ title: string; matterType: string; owner: string }> = [
  { title: "Employment dispute", matterType: "employment", owner: "legal" },
  { title: "Vendor contract claim", matterType: "contract", owner: "legal" },
  { title: "Regulatory inquiry", matterType: "regulatory", owner: "compliance" },
  { title: "Facilities liability claim", matterType: "liability", owner: "operations" },
];

const STAGES = ["intake", "discovery", "mediation", "resolution"];

export class LitigationIntelligence implements LitigationIntelligenceContract {
  track(input: {
    baseline: LegalComplianceRiskBaseline;
    now: Date;
    createId: (prefix: string) => string;
  }): LitigationSuite {
    const { baseline, now, createId } = input;
    const matterCount = Math.max(1, Math.round(baseline.litigationExposure * MATTER_TEMPLATES.length + 1));
    const matters: LitigationMatterRecord[] = MATTER_TEMPLATES.slice(0, matterCount).map((template, index) => {
      const exposureBand = baseline.litigationExposure * 100 + index * 8;
      const status: LitigationStatus = exposureBand > 55 ? "active" : exposureBand > 35 ? "monitoring" : index % 2 === 0 ? "settled" : "closed";
      const exposure = Math.round(50_000 + exposureBand * 6_000);
      return {
        id: createId("lcr-litigation"),
        title: template.title,
        matterType: template.matterType,
        status,
        exposure,
        stage: STAGES[index % STAGES.length]!,
        owner: template.owner,
        nextMilestone: new Date(now.getTime() + (30 + index * 25) * 86_400_000).toISOString(),
        narrative: `${template.title} (${template.matterType}) is ${status}; exposure $${exposure.toLocaleString()}.`,
      };
    });

    const activeMatters = matters.filter((matter) => matter.status === "active" || matter.status === "monitoring").length;
    const totalExposure = matters.reduce((sum, matter) => sum + matter.exposure, 0);
    const exposureScore = clamp(100 - baseline.litigationExposure * 70 - activeMatters * 6);

    return {
      matters,
      exposureScore,
      activeMatters,
      totalExposure,
      narrative: `Litigation exposure score ${Math.round(exposureScore)}; ${activeMatters} active matters, $${totalExposure.toLocaleString()} exposure.`,
    };
  }
}
