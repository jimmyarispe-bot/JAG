import fs from "node:fs";
import path from "node:path";
const DEST = path.resolve("src/lib/platform/intelligence/ethical");
const w = (n, c) => fs.writeFileSync(path.join(DEST, n), c, "utf8");

w("README.md", `# Ethical Intelligence (Sprint 054)

Leaf-safe Ethical Intelligence domain package. Soft-reads Cultural, Behavioral, Legal Compliance Risk, Executive Decision, Opportunity, Predictive, and Reputation via light types only.

## Areas (17)

ethical_decision_analysis, values_alignment, fairness, transparency, accountability, human_impact, ai_ethics, responsible_automation, bias_discrimination, governance_ethics, privacy_data_ethics, sustainability_ethics, social_responsibility, ethical_risk, ethical_opportunity, ethical_stewardship, recommendation_validation

## Entry point

\`\`\`ts
import { createEthicalIntelligence } from "@/lib/platform/intelligence/ethical";

const { service } = createEthicalIntelligence({ wireOrganizationDna: false, wireOios: false });
const result = service.build({ requestId: "eth-1", scope: { organizationId: "org-1", schoolId: "school-1" } });
\`\`\`

## Lens (8 fields)

valuesAlignment · fairness · transparency · accountability · humanImpact · biasRisk · governanceIntegrity · longTermEthicalOutlook

## Hard DAG

\`["cultural"]\` - follows Cultural Intelligence.

## Layer

Internal-facing ethical intelligence after Cultural - how values, fairness, AI ethics, and stewardship sustain principled decisions.
`);

w("ARCHITECTURE.md", `# Ethical Intelligence Architecture (Sprint 054)

## Placement

Internal-facing domain after Cultural (053). Hard DAG dependency: \`["cultural"]\`. Soft-reads Cultural, Behavioral, Legal Compliance Risk, Executive Decision, Opportunity, Predictive, and Reputation via leaf light types only.

## Package layout

- \`types.ts\` / \`contracts.ts\` / \`models.ts\` - leaf-safe contracts and baseline derivation
- \`area-factory.ts\` + 17 \`*-intelligence.ts\` area assessors
- Specialized engines: ValuesAlignment, Fairness, HumanImpact, AiEthics, GovernanceEthics, EarlyWarning
- Standard engines: Analysis, Forecast, Trend, Scenario
- Composers in \`ethical-intelligence.ts\`; orchestration in \`ethical-engine.ts\`
- \`createEthicalIntelligence\` factory in \`index.ts\`

## Soft integrations

No circular imports. \`EthicalRequest\` accepts \`CulturalResultLight\` and peer light types only.

## Closed learning

Destinations: cultural, behavioral, legal-compliance-risk, opportunity, executive-decision, predictive, reputation.
`);

w("VERIFICATION.md", `# Ethical Intelligence Verification (Sprint 054)

## Checks

1. \`npx tsc --noEmit\`
2. \`npx vitest run tests/unit/intelligence/ethical.test.ts\`
3. Pipeline order includes \`cultural\`, \`ethical\`
4. OIOS registry marks \`ethical\` active with deps \`["organization-dna", "cultural"]\`

## Expected

- 17 area suites, 12 analysis kinds, 10 scenarios
- EthicalLens eight fields on recommendations
- Closed learning destinations length 7 including cultural and reputation
`);

w("CHANGELOG.md", `# Ethical Intelligence Changelog

## 0.1.0 - Sprint 054

- Initial Ethical Intelligence domain package
- Seventeen ethical areas with specialized values, fairness, human impact, AI ethics, and governance engines
- Platform module after Cultural Intelligence
`);

console.log("docs written");
console.log("file count", fs.readdirSync(DEST).length);
console.log(fs.readdirSync(DEST).sort().join("\\n"));