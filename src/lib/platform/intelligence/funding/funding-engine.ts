/** Funding Intelligence orchestration engine (Sprint 034). */
import type * as C from "@/lib/platform/intelligence/funding/contracts";
import { FederalFunding, StateFunding, CountyFunding, CityFunding, EducationFunding, HealthcareFunding, InfrastructureFunding, EconomicDevelopmentFunding, DisasterFunding, ResearchFunding } from "@/lib/platform/intelligence/funding/government-funding";
import { GrantIntelligencePipeline } from "@/lib/platform/intelligence/funding/grant-intelligence";
import { GovernmentContracts, CorporateContracts, RFPDiscovery, BidScoring, ProposalOptimization, ContractForecast } from "@/lib/platform/intelligence/funding/contracts-procurement";
import { FoundationMatching, MajorDonorInsights, CorporateGiving, FamilyFoundations, CommunityFoundations, CapitalCampaignPlanning } from "@/lib/platform/intelligence/funding/philanthropy-intelligence";
import { AngelInvestors, VentureCapital, PrivateEquity, StrategicInvestors, DebtFinancing, RevenueBasedFinancing } from "@/lib/platform/intelligence/funding/investment-intelligence";
import { Crowdfunding, Sponsorships, TaxCredits, TaxIncentives, OpportunityZones, NewMarketsTaxCredits, CarbonCredits, LicensingRevenue, RoyaltyRevenue } from "@/lib/platform/intelligence/funding/alternative-funding";
import { FundingStrategyEngine } from "@/lib/platform/intelligence/funding/funding-strategy";
import { FundingIntelligence, FundingHealth, FundingDashboard, GrantPipelineDashboard, CapitalStrategyDashboard, FundingDiversificationDashboard, FundingRiskDashboard, FundingCalendarComposer, ExecutiveFundingBriefGenerator, TopOpportunityAggregator, ProposalPriorityAggregator, defaultFundingConfidence } from "@/lib/platform/intelligence/funding/funding-intelligence";
import { FundingProjection, FundingQueries } from "@/lib/platform/intelligence/funding/projection";
import { FundingRepositoryStore } from "@/lib/platform/intelligence/funding/repository";
import { defaultPeriodLabel, deriveFundingBaseline, emptyFundingScope } from "@/lib/platform/intelligence/funding/models";
import { FUNDING_INTELLIGENCE_VERSION, type FundingRequest, type FundingResult } from "@/lib/platform/intelligence/funding/types";

export interface FundingEngineDependencies extends C.FundingDependencies {}
export class FundingIntelligenceEngineImpl implements C.FundingIntelligenceEngine {
  private readonly federal: C.FederalFunding; private readonly state: C.StateFunding; private readonly county: C.CountyFunding; private readonly city: C.CityFunding;
  private readonly education: C.EducationFunding; private readonly healthcare: C.HealthcareFunding; private readonly infrastructure: C.InfrastructureFunding;
  private readonly economic: C.EconomicDevelopmentFunding; private readonly disaster: C.DisasterFunding; private readonly research: C.ResearchFunding;
  private readonly grants: C.GrantIntelligencePipeline; private readonly govContracts: C.GovernmentContracts; private readonly corpContracts: C.CorporateContracts;
  private readonly rfp: C.RFPDiscovery; private readonly bid: C.BidScoring; private readonly proposal: C.ProposalOptimization; private readonly contractForecasting: C.ContractForecast;
  private readonly foundation: C.FoundationMatching; private readonly donors: C.MajorDonorInsights; private readonly giving: C.CorporateGiving;
  private readonly family: C.FamilyFoundations; private readonly community: C.CommunityFoundations; private readonly campaign: C.CapitalCampaignPlanning;
  private readonly angels: C.AngelInvestors; private readonly venture: C.VentureCapital; private readonly equity: C.PrivateEquity; private readonly strategic: C.StrategicInvestors;
  private readonly debt: C.DebtFinancing; private readonly revenueBased: C.RevenueBasedFinancing; private readonly crowd: C.Crowdfunding; private readonly sponsors: C.Sponsorships;
  private readonly credits: C.TaxCredits; private readonly incentives: C.TaxIncentives; private readonly zones: C.OpportunityZones; private readonly nmtc: C.NewMarketsTaxCredits;
  private readonly carbon: C.CarbonCredits; private readonly licensing: C.LicensingRevenue; private readonly royalties: C.RoyaltyRevenue;
  private readonly strategy: C.FundingStrategyEngine; private readonly intelligence: C.FundingIntelligence; private readonly health: C.FundingHealth;
  private readonly dashboard: C.FundingDashboard; private readonly grantDashboard: C.GrantPipelineDashboard; private readonly capitalDashboard: C.CapitalStrategyDashboard;
  private readonly diversityDashboard: C.FundingDiversificationDashboard; private readonly riskDashboardBuilder: C.FundingRiskDashboard; private readonly calendar: C.FundingCalendarComposer;
  private readonly brief: C.ExecutiveFundingBriefGenerator; private readonly top: C.TopOpportunityAggregator; private readonly priorities: C.ProposalPriorityAggregator;
  private readonly projection: C.FundingProjection; private readonly store: C.FundingRepository; private readonly now: () => Date; private readonly createId: (prefix: string) => string;
  readonly queries: C.FundingQueries;
  constructor(d: FundingEngineDependencies = {}) {
    const id = d.createId ?? ((p: string) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`); this.createId = id; this.now = d.now ?? (() => new Date());
    this.federal = d.federalFunding ?? new FederalFunding(id); this.state = d.stateFunding ?? new StateFunding(id); this.county = d.countyFunding ?? new CountyFunding(id); this.city = d.cityFunding ?? new CityFunding(id);
    this.education = d.educationFunding ?? new EducationFunding(id); this.healthcare = d.healthcareFunding ?? new HealthcareFunding(id); this.infrastructure = d.infrastructureFunding ?? new InfrastructureFunding(id); this.economic = d.economicDevelopmentFunding ?? new EconomicDevelopmentFunding(id); this.disaster = d.disasterFunding ?? new DisasterFunding(id); this.research = d.researchFunding ?? new ResearchFunding(id);
    this.grants = d.grantPipeline ?? new GrantIntelligencePipeline({ createId: id });
    this.govContracts = d.governmentContracts ?? new GovernmentContracts(id); this.corpContracts = d.corporateContracts ?? new CorporateContracts(id); this.rfp = d.rfpDiscovery ?? new RFPDiscovery(id); this.bid = d.bidScoring ?? new BidScoring(id); this.proposal = d.proposalOptimization ?? new ProposalOptimization(id); this.contractForecasting = d.contractForecast ?? new ContractForecast();
    this.foundation = d.foundationMatching ?? new FoundationMatching(id); this.donors = d.majorDonorInsights ?? new MajorDonorInsights(id); this.giving = d.corporateGiving ?? new CorporateGiving(id); this.family = d.familyFoundations ?? new FamilyFoundations(id); this.community = d.communityFoundations ?? new CommunityFoundations(id); this.campaign = d.capitalCampaignPlanning ?? new CapitalCampaignPlanning(id);
    this.angels = d.angelInvestors ?? new AngelInvestors(id); this.venture = d.ventureCapital ?? new VentureCapital(id); this.equity = d.privateEquity ?? new PrivateEquity(id); this.strategic = d.strategicInvestors ?? new StrategicInvestors(id); this.debt = d.debtFinancing ?? new DebtFinancing(id); this.revenueBased = d.revenueBasedFinancing ?? new RevenueBasedFinancing(id);
    this.crowd = d.crowdfunding ?? new Crowdfunding(id); this.sponsors = d.sponsorships ?? new Sponsorships(id); this.credits = d.taxCredits ?? new TaxCredits(id); this.incentives = d.taxIncentives ?? new TaxIncentives(id); this.zones = d.opportunityZones ?? new OpportunityZones(id); this.nmtc = d.newMarketsTaxCredits ?? new NewMarketsTaxCredits(id); this.carbon = d.carbonCredits ?? new CarbonCredits(id); this.licensing = d.licensingRevenue ?? new LicensingRevenue(id); this.royalties = d.royaltyRevenue ?? new RoyaltyRevenue(id);
    this.strategy = d.strategyEngine ?? new FundingStrategyEngine({ createId: id }); this.intelligence = d.fundingIntelligence ?? new FundingIntelligence(); this.health = d.fundingHealth ?? new FundingHealth(); this.dashboard = d.fundingDashboard ?? new FundingDashboard(); this.grantDashboard = d.grantPipelineDashboard ?? new GrantPipelineDashboard(); this.capitalDashboard = d.capitalStrategyDashboard ?? new CapitalStrategyDashboard(); this.diversityDashboard = d.diversificationDashboard ?? new FundingDiversificationDashboard(); this.riskDashboardBuilder = d.riskDashboard ?? new FundingRiskDashboard(); this.calendar = d.calendarComposer ?? new FundingCalendarComposer(); this.brief = d.briefGenerator ?? new ExecutiveFundingBriefGenerator(id); this.top = d.topOpportunityAggregator ?? new TopOpportunityAggregator(); this.priorities = d.proposalPriorityAggregator ?? new ProposalPriorityAggregator(); this.projection = d.projection ?? new FundingProjection(); this.queries = d.queries ?? new FundingQueries(); this.store = d.repository ?? new FundingRepositoryStore();
  }
  get repository(): C.FundingRepository { return this.store; }
  get strategyEngine(): C.FundingStrategyEngine { return this.strategy; }
  build(request: FundingRequest): FundingResult {
    const now = this.now(); const scope = request.scope ?? emptyFundingScope(); const dna = request.dnaResult?.dna ?? request.dna ?? null;
    // 1. baseline
    const baseline = deriveFundingBaseline(dna, request.oiosResult, request.analysis, request.graphInput, request.predictionResult, request.financialSignal, request.revenueResult, request.baselineOverrides);
    const common = { baseline, now }; const periodLabel = request.periodLabel ?? defaultPeriodLabel(now);
    // 2. government suite
    const federalFunding = this.federal.analyze(common); const stateFunding = this.state.analyze(common); const countyFunding = this.county.analyze(common); const cityFunding = this.city.analyze(common); const educationFunding = this.education.analyze(common); const healthcareFunding = this.healthcare.analyze(common); const infrastructureFunding = this.infrastructure.analyze(common); const economicDevelopmentFunding = this.economic.analyze(common); const disasterFunding = this.disaster.analyze(common); const researchFunding = this.research.analyze(common);
    // 3. grant suite
    const grantPipeline = this.grants.run(common);
    // 4. contracts suite
    const governmentContracts = this.govContracts.analyze(common); const corporateContracts = this.corpContracts.analyze(common); const rfpOpportunities = this.rfp.discover(common); const bidScores = this.bid.score({ ...common, opportunities: rfpOpportunities }); const proposalOptimizations = this.proposal.optimize({ ...common, bids: bidScores }); const contractForecast = this.contractForecasting.forecast({ ...common, contracts: governmentContracts });
    // 5. philanthropy suite
    const foundationMatches = this.foundation.analyze(common); const majorDonorInsights = this.donors.analyze(common); const corporateGiving = this.giving.analyze(common); const familyFoundations = this.family.analyze(common); const communityFoundations = this.community.analyze(common); const capitalCampaigns = this.campaign.plan(common);
    // 6. investment suite
    const angelInvestors = this.angels.analyze(common); const ventureCapital = this.venture.analyze(common); const privateEquity = this.equity.analyze(common); const strategicInvestors = this.strategic.analyze(common); const debtFinancing = this.debt.analyze(common); const revenueBasedFinancing = this.revenueBased.analyze(common);
    // 7. alternative suite
    const crowdfunding = this.crowd.analyze(common); const sponsorships = this.sponsors.analyze(common); const taxCredits = this.credits.analyze(common); const taxIncentives = this.incentives.analyze(common); const opportunityZones = this.zones.analyze(common); const newMarketsTaxCredits = this.nmtc.analyze(common); const carbonCredits = this.carbon.analyze(common); const licensingRevenue = this.licensing.analyze(common); const royaltyRevenue = this.royalties.analyze(common);
    // 8. strategy suite
    const strategy = this.strategy.run(common);
    // 9. aggregate priorities
    const topOpportunities = this.top.aggregate({ government: [...federalFunding, ...stateFunding, ...countyFunding, ...cityFunding, ...educationFunding, ...healthcareFunding, ...infrastructureFunding, ...economicDevelopmentFunding, ...disasterFunding, ...researchFunding], grants: grantPipeline.opportunities, contracts: rfpOpportunities, philanthropy: foundationMatches, investment: angelInvestors, alternative: crowdfunding });
    const proposalPriorities = this.priorities.aggregate({ grants: grantPipeline.scores, bids: bidScores });
    // 10. scores and health
    const scores = this.intelligence.composeScores({ baseline, diversification: strategy.diversification, risks: strategy.risks, topOpportunities });
    const fundingHealth = this.health.assess({ baseline, scores, diversification: strategy.diversification });
    // 11. dashboards and calendar
    const dashboard = this.dashboard.compose({ baseline, scores, now }); const grantPipelineDashboard = this.grantDashboard.build({ pipeline: grantPipeline, baseline, now }); const capitalStrategyDashboard = this.capitalDashboard.build({ capitalPlan: strategy.capitalPlan, runway: strategy.runway, now }); const diversificationDashboard = this.diversityDashboard.build({ diversification: strategy.diversification, now }); const riskDashboard = this.riskDashboardBuilder.build({ risks: strategy.risks, riskScore: scores.riskScore, now }); const calendar = this.calendar.compose({ events: grantPipeline.calendar, now });
    // 12. brief, projection, confidence, history, recommendations
    const confidence = defaultFundingConfidence(baseline, Boolean(dna), Boolean(request.oiosResult));
    const brief = this.brief.generate({ request, baseline, scores, topOpportunities, risks: strategy.risks, confidence, now });
    const projection = this.projection.project({ baseline, scores, forecast: grantPipeline.forecast, topOpportunities, brief, dashboard, confidence });
    const recommendations = [...topOpportunities.slice(0, 3).map((o) => `${o.narrative} Five-lens impact: ${o.lenses.availableFunding}; ${o.lenses.diversification}; ${o.lenses.fundingRisk}; ${o.lenses.sustainability}; ${o.lenses.missionImpact}`), ...strategy.risks.slice(0, 2).map((r) => `${r.narrative} Five-lens impact: ${r.lenses.availableFunding}; ${r.lenses.diversification}; ${r.lenses.fundingRisk}; ${r.lenses.sustainability}; ${r.lenses.missionImpact}`)];
    const historyRecord = { id: this.createId("fund-hist"), requestId: request.requestId, generatedAt: now.toISOString(), status: "generated" as const, summary: brief.headline, scope, confidence, scores: { health: scores.healthScore.value, opportunity: scores.opportunityScore.value, risk: scores.riskScore.value } };
    const result: FundingResult = { requestId: request.requestId, version: FUNDING_INTELLIGENCE_VERSION, generatedAt: now.toISOString(), periodLabel, scope, baseline, federalFunding, stateFunding, countyFunding, cityFunding, educationFunding, healthcareFunding, infrastructureFunding, economicDevelopmentFunding, disasterFunding, researchFunding, grantPipeline, governmentContracts, corporateContracts, rfpOpportunities, bidScores, proposalOptimizations, contractForecast, foundationMatches, majorDonorInsights, corporateGiving, familyFoundations, communityFoundations, capitalCampaigns, angelInvestors, ventureCapital, privateEquity, strategicInvestors, debtFinancing, revenueBasedFinancing, crowdfunding, sponsorships, taxCredits, taxIncentives, opportunityZones, newMarketsTaxCredits, carbonCredits, licensingRevenue, royaltyRevenue, ...strategy, topOpportunities, proposalPriorities, ...scores, fundingHealth, dashboard, grantPipelineDashboard, capitalStrategyDashboard, diversificationDashboard, riskDashboard, calendar, brief, projection, confidence, historyRecord, recommendations };
    this.store.save(result); this.store.saveHistory(historyRecord); return result;
  }
}
export { FundingIntelligenceEngineImpl as FundingIntelligenceEngine, FundingIntelligenceEngineImpl as FundingEngine, FundingIntelligenceEngineImpl as FundingEngineImpl };
