/** Government funding discovery suite. */
import type * as C from "@/lib/platform/intelligence/funding/contracts";
import { buildLenses, clamp, priorityFromScore } from "@/lib/platform/intelligence/funding/models";
import type * as T from "@/lib/platform/intelligence/funding/types";

type Id = (prefix: string) => string;
const lenses = (channel: string) => buildLenses({
  availableFunding: `${channel} expands the addressable funding pool.`,
  diversification: `${channel} adds a distinct public funding source.`,
  fundingRisk: "Eligibility, appropriation, and timing risks require active controls.",
  sustainability: "Multi-year alignment can stabilize the capital plan.",
  missionImpact: "Public funding is directed to measurable community outcomes.",
});
function core(input: C.BaselineInput, createId: Id, prefix: string, name: string, factor: number): T.FundingRecordBase {
  const score = clamp(input.baseline.complianceReadiness * 0.55 + input.baseline.proposalCapacity * 0.3 + (1 - input.baseline.concentrationRisk) * 15);
  const amount = Math.round(input.baseline.annualFundingNeed * factor * (0.7 + score / 250));
  return { id: createId(prefix), name, amount, score, priority: priorityFromScore(100 - score), deadline: new Date(input.now.getTime() + 90 * 86_400_000).toISOString(), eligibility: ["school", "nonprofit", "government"], lenses: lenses(name), narrative: `${name} offers approximately $${amount.toLocaleString()} with a ${Math.round(score)} readiness score.` };
}
class Base { constructor(protected readonly createId: Id = (p) => `${p}-${Date.now()}`) {} }
export class FederalFunding extends Base implements C.FederalFunding { analyze(input: C.BaselineInput): T.FederalFundingRecord[] { return [{ ...core(input, this.createId, "fed", "Federal education and community innovation", 0.2), agency: "U.S. Department of Education", assistanceListing: "84.411" }]; } }
export class StateFunding extends Base implements C.StateFunding { analyze(input: C.BaselineInput): T.StateFundingRecord[] { return [{ ...core(input, this.createId, "state", "State learning recovery fund", 0.12), state: "Applicable state", program: "Learning Recovery" }]; } }
export class CountyFunding extends Base implements C.CountyFunding { analyze(input: C.BaselineInput): T.CountyFundingRecord[] { return [{ ...core(input, this.createId, "county", "County youth development allocation", 0.05), county: "Local county", program: "Youth Development" }]; } }
export class CityFunding extends Base implements C.CityFunding { analyze(input: C.BaselineInput): T.CityFundingRecord[] { return [{ ...core(input, this.createId, "city", "City workforce readiness initiative", 0.04), city: "Local city", program: "Workforce Readiness" }]; } }
export class EducationFunding extends Base implements C.EducationFunding { analyze(input: C.BaselineInput): T.EducationFundingRecord[] { return [{ ...core(input, this.createId, "edu", "Student success innovation grant", 0.14), educationLevel: "K-12 and postsecondary" }]; } }
export class HealthcareFunding extends Base implements C.HealthcareFunding { analyze(input: C.BaselineInput): T.HealthcareFundingRecord[] { return [{ ...core(input, this.createId, "health", "School health and wellness fund", 0.08), healthFocus: "Behavioral health and prevention" }]; } }
export class InfrastructureFunding extends Base implements C.InfrastructureFunding { analyze(input: C.BaselineInput): T.InfrastructureFundingRecord[] { return [{ ...core(input, this.createId, "infra", "Digital learning infrastructure", 0.16), infrastructureType: "Broadband and learning technology" }]; } }
export class EconomicDevelopmentFunding extends Base implements C.EconomicDevelopmentFunding { analyze(input: C.BaselineInput): T.EconomicDevelopmentFundingRecord[] { return [{ ...core(input, this.createId, "econ", "Regional talent development fund", 0.1), developmentGoal: "Workforce and entrepreneurship" }]; } }
export class DisasterFunding extends Base implements C.DisasterFunding { analyze(input: C.BaselineInput): T.DisasterFundingRecord[] { return [{ ...core(input, this.createId, "disaster", "Education continuity preparedness", 0.06), disasterPhase: "Mitigation and preparedness" }]; } }
export class ResearchFunding extends Base implements C.ResearchFunding { analyze(input: C.BaselineInput): T.ResearchFundingRecord[] { return [{ ...core(input, this.createId, "research", "Education outcomes research", 0.11), researchArea: "Learning science and outcomes" }]; } }
