/**
 * Intellectual Property Intelligence — IP coverage and protection depth.
 */

import type { IntellectualPropertyIntelligence as IntellectualPropertyIntelligenceContract } from "@/lib/platform/intelligence/innovation/contracts";
import { clamp } from "@/lib/platform/intelligence/innovation/models";
import type {
  InnovationArtifactStatus,
  InnovationBaseline,
  IntellectualPropertySuite,
  IpAssetRecord,
  IpKind,
  ProductServiceInnovationSuite,
  ResearchDevelopmentSuite,
} from "@/lib/platform/intelligence/innovation/types";

const IP_TEMPLATES: Array<{ title: string; kind: IpKind; status: InnovationArtifactStatus }> = [
  { title: "Learning pathway methodology", kind: "trade_secret", status: "monitored" },
  { title: "Campus OS trademark", kind: "trademark", status: "assessed" },
  { title: "Assessment scoring copyright suite", kind: "copyright", status: "advancing" },
  { title: "Adaptive tutoring patent filing", kind: "patent", status: "draft" },
  { title: "Partner content license stack", kind: "license", status: "monitored" },
];

export class IntellectualPropertyIntelligence implements IntellectualPropertyIntelligenceContract {
  assess(input: {
    baseline: InnovationBaseline;
    productServiceInnovation: ProductServiceInnovationSuite;
    researchDevelopment: ResearchDevelopmentSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): IntellectualPropertySuite {
    const { baseline, productServiceInnovation, researchDevelopment, createId } = input;
    void input.now;
    const count = Math.max(4, Math.min(IP_TEMPLATES.length, baseline.ipAssetCount + 1));
    const assets: IpAssetRecord[] = IP_TEMPLATES.slice(0, count).map((template, index) => {
      const coverageScore = clamp(
        baseline.ipCoverage + (index % 3) * 5 - (template.status === "draft" ? 8 : 0)
      );
      return {
        id: createId("inn-ip"),
        title: template.title,
        kind: template.kind,
        coverageScore,
        status: template.status,
        narrative: `${template.title} (${template.kind}) coverage ${Math.round(coverageScore)}.`,
      };
    });
    const coverageScore = clamp(
      assets.reduce((sum, asset) => sum + asset.coverageScore, 0) / assets.length
    );
    const protectionDepth = clamp(
      coverageScore * 0.5 +
        researchDevelopment.capabilityCoverage * 0.25 +
        productServiceInnovation.noveltyIndex * 0.25
    );
    const exposurePressure = clamp(100 - protectionDepth);

    return {
      assets,
      coverageScore,
      protectionDepth,
      exposurePressure,
      narrative: `IP coverage ${Math.round(coverageScore)}; protection depth ${Math.round(protectionDepth)}.`,
    };
  }
}
