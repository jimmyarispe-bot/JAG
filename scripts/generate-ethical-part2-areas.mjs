import fs from "node:fs";
import path from "node:path";
const DEST = path.resolve("src/lib/platform/intelligence/ethical");
const w = (name, content) => fs.writeFileSync(path.join(DEST, name), content, "utf8");
const AREA_META = [
  ["ethical_decision_analysis", "EthicalDecisionAnalysisIntelligence", ["Ethical decision clarity", "Ethical decision paralysis"], "Ethical Decision Analysis"],
  ["values_alignment", "ValuesAlignmentIntelligence", ["Values living evidence", "Values gap hotspot"], "Values Alignment"],
  ["fairness", "FairnessIntelligence", ["Fairness strength signal", "Fairness failure hotspot"], "Fairness"],
  ["transparency", "TransparencyIntelligence", ["Transparency openness", "Transparency collapse"], "Transparency"],
  ["accountability", "AccountabilityIntelligence", ["Accountability clarity", "Accountability gap"], "Accountability"],
  ["human_impact", "HumanImpactIntelligence", ["Human impact care signal", "Human harm hotspot"], "Human Impact"],
  ["ai_ethics", "AiEthicsIntelligence", ["AI ethics readiness", "AI bias incident risk"], "AI Ethics"],
  ["responsible_automation", "ResponsibleAutomationIntelligence", ["Responsible automation signal", "Automation overreach"], "Responsible Automation"],
  ["bias_discrimination", "BiasDiscriminationIntelligence", ["Bias control signal", "Discrimination hotspot"], "Bias Discrimination"],
  ["governance_ethics", "GovernanceEthicsIntelligence", ["Governance integrity signal", "Governance ethics gap"], "Governance Ethics"],
  ["privacy_data_ethics", "PrivacyDataEthicsIntelligence", ["Privacy ethics strength", "Privacy violation risk"], "Privacy Data Ethics"],
  ["sustainability_ethics", "SustainabilityEthicsIntelligence", ["Sustainability ethics signal", "Sustainability ethics gap"], "Sustainability Ethics"],
  ["social_responsibility", "SocialResponsibilityIntelligence", ["Social responsibility signal", "Social backlash risk"], "Social Responsibility"],
  ["ethical_risk", "EthicalRiskIntelligence", ["Ethical risk calm", "Ethical risk spike"], "Ethical Risk"],
  ["ethical_opportunity", "EthicalOpportunityIntelligence", ["Ethical opportunity signal", "Missed ethical opportunity"], "Ethical Opportunity"],
  ["ethical_stewardship", "EthicalStewardshipIntelligence", ["Stewardship strength", "Stewardship gap"], "Ethical Stewardship"],
  ["recommendation_validation", "RecommendationValidationIntelligence", ["Recommendation validity", "Recommendation validation gap"], "Recommendation Validation"],
];
for (const [area, cls, titles, label] of AREA_META) {
  const file = area.replaceAll("_", "-") + "-intelligence.ts";
  w(file, `import { createAreaIntelligence } from "@/lib/platform/intelligence/ethical/area-factory";
export class ${cls} extends createAreaIntelligence("${area}", ["${titles[0]}", "${titles[1]}"], "${label}") {}
`);
}
w("area-factory.ts", `import type { EthicalAreaIntelligence } from "@/lib/platform/intelligence/ethical/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/ethical/models";
import type { EthicalArea, EthicalAreaSuite } from "@/lib/platform/intelligence/ethical/types";

export function createAreaIntelligence(
  area: EthicalArea,
  titles: [string, string],
  forceLabel: string,
): new () => EthicalAreaIntelligence {
  return class implements EthicalAreaIntelligence {
    assess(input: Parameters<EthicalAreaIntelligence["assess"]>[0]): EthicalAreaSuite {
      const score = clamp(input.baseline.areaScores[area]);
      const records = [
        { title: titles[0], delta: 3 },
        { title: titles[1], delta: -4 },
      ].map((item) => {
        const value = clamp(score + item.delta);
        return {
          id: input.createId("eth-signal"),
          area,
          title: item.title,
          score: value,
          status: value >= 75 ? "favorable" as const : value >= 60 ? "improving" as const : "at_risk" as const,
          signal: \`\${item.title} reading \${Math.round(value)}.\`,
          evidence: [\`baseline:\${area}\`, \`indicator:\${area}:current\`],
          lenses: buildLens({
            valuesAlignment: \`Values alignment linked to \${area} at \${Math.round(value)}.\`,
            fairness: \`Fairness implications of \${area} conditions.\`,
            transparency: \`Transparency surrounding \${area}.\`,
            accountability: \`Accountability reading for \${area}.\`,
            humanImpact: \`Human impact associated with \${area}.\`,
            biasRisk: \`Bias risk reading for \${area}.\`,
            governanceIntegrity: \`Governance integrity around \${area}.\`,
            longTermEthicalOutlook: \`Long-term ethical outlook for \${area} developments.\`,
          }),
          narrative: \`\${item.title} score \${Math.round(value)}.\`,
        };
      });
      return {
        area,
        records,
        score,
        favorableCount: records.filter(r => r.status === "favorable").length,
        atRiskCount: records.filter(r => r.status === "at_risk").length,
        narrative: \`\${forceLabel} ethical score \${Math.round(score)}.\`,
      };
    }
  };
}
`);
console.log("areas + factory written");