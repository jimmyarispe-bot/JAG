/** Grant discovery, scoring, compliance, and pipeline intelligence. */
import type * as C from "@/lib/platform/intelligence/funding/contracts";
import { buildLenses, clamp, clamp01, priorityFromScore, statusFromScore } from "@/lib/platform/intelligence/funding/models";
import type * as T from "@/lib/platform/intelligence/funding/types";

type Id = (prefix: string) => string;
const lens = buildLenses({ availableFunding: "A qualified grant expands non-dilutive funding.", diversification: "The grant reduces dependence on earned and investment capital.", fundingRisk: "Submission, restriction, and reporting risks are explicitly managed.", sustainability: "Renewal planning and unrestricted cost recovery support continuity.", missionImpact: "The opportunity directly funds measurable learner outcomes." });
const due = (now: Date, days: number) => new Date(now.getTime() + days * 86_400_000).toISOString();
export class GrantDiscovery implements C.GrantDiscovery {
  constructor(private readonly createId: Id = (p) => `${p}-${Date.now()}`) {}
  discover({ baseline, now }: C.BaselineInput): T.GrantOpportunityRecord[] {
    const data = [["Student Success Innovation Fund", "National Education Foundation", 0.18, 75], ["Community Learning Accelerator", "Regional Community Trust", 0.1, 120], ["Digital Equity Capacity Grant", "Technology Access Foundation", 0.13, 60]] as const;
    return data.map(([name, funder, share, days], i) => {
      const score = clamp(baseline.complianceReadiness * 0.45 + baseline.proposalCapacity * 0.4 + 12 - i * 4);
      return { id: this.createId("grant"), name, funder, amount: Math.round(baseline.annualFundingNeed * share), score, priority: priorityFromScore(100 - score), deadline: due(now, days), eligibility: ["school", "nonprofit"], stage: i ? "qualified" : "planned", matchRequiredPct: i * 0.1, lenses: lens, narrative: `${name} is a $${Math.round(baseline.annualFundingNeed * share).toLocaleString()} prospect with ${Math.round(score)}% fit.` };
    });
  }
}
export class GrantMatching implements C.GrantMatching {
  constructor(private readonly createId: Id = (p) => `${p}-${Date.now()}`) {}
  match({ baseline, opportunities }: Parameters<C.GrantMatching["match"]>[0]): T.GrantMatchRecord[] { return opportunities.map((o) => ({ ...o, id: this.createId("grant-match"), opportunityId: o.id, missionFit: clamp(o.score + 8), eligibilityFit: baseline.complianceReadiness, narrative: `${o.name} has strong mission and eligibility alignment.` })); }
}
export class GrantScoring implements C.GrantScoring {
  constructor(private readonly createId: Id = (p) => `${p}-${Date.now()}`) {}
  score({ baseline, matches }: Parameters<C.GrantScoring["score"]>[0]): T.GrantScoreRecord[] { return matches.map((m) => ({ ...m, id: this.createId("grant-score"), opportunityId: m.opportunityId, probability: clamp01(baseline.grantWinRate * 0.6 + m.score / 250), effortScore: clamp(100 - baseline.proposalCapacity + m.amount / Math.max(1, baseline.annualFundingNeed) * 20), narrative: `${m.name} has a calibrated ${Math.round(clamp01(baseline.grantWinRate * 0.6 + m.score / 250) * 100)}% win probability.` })); }
}
export class GrantCalendar implements C.GrantCalendar {
  constructor(private readonly createId: Id = (p) => `${p}-${Date.now()}`) {}
  build({ opportunities }: Parameters<C.GrantCalendar["build"]>[0]): T.GrantCalendarEvent[] { return opportunities.map((o) => ({ id: this.createId("grant-event"), opportunityId: o.id, title: `${o.name} submission`, date: o.deadline ?? new Date().toISOString(), stage: o.stage, priority: o.priority })); }
}
export class GrantForecasting implements C.GrantForecasting {
  forecast({ baseline, scores, now }: Parameters<C.GrantForecasting["forecast"]>[0]): T.GrantForecastPoint[] { return [0, 1, 2, 3].map((quarter) => ({ period: `Q${quarter + 1} ${now.getUTCFullYear()}`, submitted: Math.round(scores.reduce((s, x) => s + x.amount, 0) * (quarter + 1) / 4), weightedAwards: Math.round(scores.reduce((s, x) => s + x.amount * x.probability, 0) * (quarter + 1) / 4), expectedAwards: Math.round(baseline.pipelineFunding * baseline.grantWinRate * (quarter + 1) / 4) })); }
}
class OpportunityMapper {
  constructor(protected readonly createId: Id = (p) => `${p}-${Date.now()}`) {}
  protected base(o: T.GrantOpportunityRecord, prefix: string): T.FundingRecordBase { return { ...o, id: this.createId(prefix) }; }
}
export class GrantRequirements extends OpportunityMapper implements C.GrantRequirements { analyze({ baseline, opportunities }: Parameters<C.GrantRequirements["analyze"]>[0]): T.GrantRequirementRecord[] { return opportunities.map((o) => ({ ...this.base(o, "grant-req"), opportunityId: o.id, requirements: ["Narrative", "Budget", "Outcomes plan", "Letters of support"], readiness: baseline.proposalCapacity, narrative: `${o.name} requirements are ${Math.round(baseline.proposalCapacity)}% ready.` })); } }
export class GrantCompliance extends OpportunityMapper implements C.GrantCompliance { analyze({ baseline, opportunities }: Parameters<C.GrantCompliance["analyze"]>[0]): T.GrantComplianceRecord[] { return opportunities.map((o) => ({ ...this.base(o, "grant-comp"), awardId: o.id, obligations: ["Allowable costs", "Outcome tracking", "Financial controls"], readiness: baseline.complianceReadiness, narrative: `${o.name} compliance readiness is ${Math.round(baseline.complianceReadiness)}%.` })); } }
export class GrantReporting extends OpportunityMapper implements C.GrantReporting { analyze({ opportunities, now }: Parameters<C.GrantReporting["analyze"]>[0]): T.GrantReportingRecord[] { return opportunities.map((o) => ({ ...this.base(o, "grant-report"), awardId: o.id, reportsDue: 4, nextReportDate: due(now, 120), narrative: `${o.name} requires quarterly financial and outcome reporting.` })); } }
export class GrantRenewals extends OpportunityMapper implements C.GrantRenewals { analyze({ baseline, opportunities, now }: Parameters<C.GrantRenewals["analyze"]>[0]): T.GrantRenewalRecord[] { return opportunities.map((o) => ({ ...this.base(o, "grant-renew"), awardId: o.id, renewalProbability: clamp01(0.35 + baseline.complianceReadiness / 200), renewalDate: due(now, 300), narrative: `${o.name} renewal probability is ${Math.round(clamp01(0.35 + baseline.complianceReadiness / 200) * 100)}%.` })); } }

export class GrantIntelligencePipeline implements C.GrantIntelligencePipeline {
  private readonly discovery: C.GrantDiscovery; private readonly matching: C.GrantMatching; private readonly scoring: C.GrantScoring;
  private readonly calendar: C.GrantCalendar; private readonly forecasting: C.GrantForecasting; private readonly requirements: C.GrantRequirements;
  private readonly compliance: C.GrantCompliance; private readonly reporting: C.GrantReporting; private readonly renewals: C.GrantRenewals;
  constructor({ createId = (p: string) => `${p}-${Date.now()}` }: { createId?: Id } = {}) { this.discovery = new GrantDiscovery(createId); this.matching = new GrantMatching(createId); this.scoring = new GrantScoring(createId); this.calendar = new GrantCalendar(createId); this.forecasting = new GrantForecasting(); this.requirements = new GrantRequirements(createId); this.compliance = new GrantCompliance(createId); this.reporting = new GrantReporting(createId); this.renewals = new GrantRenewals(createId); }
  run(input: C.BaselineInput): T.GrantPipelineResult {
    const opportunities = this.discovery.discover(input); const matches = this.matching.match({ ...input, opportunities }); const scores = this.scoring.score({ ...input, matches });
    const calendar = this.calendar.build({ opportunities, now: input.now }); const forecast = this.forecasting.forecast({ ...input, scores });
    const requirements = this.requirements.analyze({ ...input, opportunities }); const compliance = this.compliance.analyze({ ...input, opportunities });
    const reporting = this.reporting.analyze({ ...input, opportunities }); const renewals = this.renewals.analyze({ ...input, opportunities });
    const totalPipeline = opportunities.reduce((s, o) => s + o.amount, 0); const weightedPipeline = scores.reduce((s, o) => s + o.amount * o.probability, 0);
    return { opportunities, matches, scores, calendar, forecast, requirements, compliance, reporting, renewals, totalPipeline, weightedPipeline, lenses: lens, narrative: `Grant pipeline contains ${opportunities.length} opportunities worth $${totalPipeline.toLocaleString()}; weighted value is $${Math.round(weightedPipeline).toLocaleString()} and health is ${statusFromScore(input.baseline.proposalCapacity)}.` };
  }
}
