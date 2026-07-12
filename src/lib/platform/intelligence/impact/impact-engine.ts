import type { ImpactDependencies, ImpactEngine as Contract } from "@/lib/platform/intelligence/impact/contracts";
import { defaultCreateId, defaultPeriodLabel, deriveImpactBaseline, emptyImpactScope, buildConfidence } from "@/lib/platform/intelligence/impact/models";
import { IMPACT_AREAS, IMPACT_INTELLIGENCE_VERSION, type ImpactArea, type ImpactAreaSuite, type ImpactRequest, type ImpactResult } from "@/lib/platform/intelligence/impact/types";
import { MissionImpactIntelligence } from "@/lib/platform/intelligence/impact/mission-impact-intelligence";
import { CustomerImpactIntelligence } from "@/lib/platform/intelligence/impact/customer-impact-intelligence";
import { EmployeeImpactIntelligence } from "@/lib/platform/intelligence/impact/employee-impact-intelligence";
import { StudentImpactIntelligence } from "@/lib/platform/intelligence/impact/student-impact-intelligence";
import { CommunityImpactIntelligence } from "@/lib/platform/intelligence/impact/community-impact-intelligence";
import { FinancialImpactIntelligence } from "@/lib/platform/intelligence/impact/financial-impact-intelligence";
import { GrantImpactIntelligence } from "@/lib/platform/intelligence/impact/grant-impact-intelligence";
import { ProgramEffectivenessImpactIntelligence } from "@/lib/platform/intelligence/impact/program-effectiveness-intelligence";
import { StrategicGoalAchievementImpactIntelligence } from "@/lib/platform/intelligence/impact/strategic-goal-achievement-intelligence";
import { OperationalImpactIntelligence } from "@/lib/platform/intelligence/impact/operational-impact-intelligence";
import { InnovationImpactIntelligence } from "@/lib/platform/intelligence/impact/innovation-impact-intelligence";
import { LongTermOrganizationalImpactIntelligence } from "@/lib/platform/intelligence/impact/long-term-organizational-impact-intelligence";
import { ImpactMeasurementEngine } from "@/lib/platform/intelligence/impact/impact-measurement-engine";
import { OutcomeEngine } from "@/lib/platform/intelligence/impact/outcome-engine";
import { RoiEngine } from "@/lib/platform/intelligence/impact/roi-engine";
import { ImpactKnowledgeContributionEngine } from "@/lib/platform/intelligence/impact/knowledge-contribution";
import { ClosedLearningLoop } from "@/lib/platform/intelligence/impact/closed-learning-loop";
import { ImpactReasoner } from "@/lib/platform/intelligence/impact/impact-reasoner";
import { ImpactIntelligence, ImpactRecommendationComposer, composeDashboard, composeHealth, composeRisksOpportunities, impactLens } from "@/lib/platform/intelligence/impact/impact-intelligence";
import { ImpactProjection } from "@/lib/platform/intelligence/impact/projection";
import { ImpactRepositoryStore } from "@/lib/platform/intelligence/impact/repository";
import { ImpactRegistryStore } from "@/lib/platform/intelligence/impact/impact-registry";

export class ImpactIntelligenceEngineImpl implements Contract {
  readonly repository; readonly registry; readonly queries;
  private now; private createId; private areas; private measurement; private outcomes; private roi; private reasoner;
  constructor(d: ImpactDependencies = {}) {
    this.now=d.now??(()=>new Date()); this.createId=d.createId??defaultCreateId;
    this.repository=d.repository??new ImpactRepositoryStore(); this.registry=d.registry??new ImpactRegistryStore();
    this.queries=new (requireProjection())();
    this.areas={mission:new MissionImpactIntelligence(),customer:new CustomerImpactIntelligence(),employee:new EmployeeImpactIntelligence(),student:new StudentImpactIntelligence(),community:new CommunityImpactIntelligence(),financial:new FinancialImpactIntelligence(),grant:new GrantImpactIntelligence(),program_effectiveness:new ProgramEffectivenessImpactIntelligence(),strategic_goal_achievement:new StrategicGoalAchievementImpactIntelligence(),operational:new OperationalImpactIntelligence(),innovation:new InnovationImpactIntelligence(),long_term_organizational:new LongTermOrganizationalImpactIntelligence(),...d.areaIntelligence};
    this.measurement=d.measurementEngine??new ImpactMeasurementEngine(); this.outcomes=d.outcomeEngine??new OutcomeEngine(); this.roi=d.roiEngine??new RoiEngine(); this.reasoner=d.reasoner??new ImpactReasoner();
  }
  build(request: ImpactRequest): ImpactResult {
    const now=this.now(), baseline=deriveImpactBaseline(request), createId=this.createId, scope=request.scope??emptyImpactScope();
    const areaSuites=Object.fromEntries(IMPACT_AREAS.map(area=>[area,this.areas[area]!.assess({baseline,now,createId})])) as Record<ImpactArea,ImpactAreaSuite>;
    const measurementSuite=this.measurement.assess({baseline,now,createId}); const outcomeSuite=this.outcomes.assess({baseline,areas:areaSuites,now,createId}); const roiSuite=this.roi.assess({baseline,outcomes:outcomeSuite,now,createId});
    const knowledgeContribution=new ImpactKnowledgeContributionEngine().contribute({outcomes:outcomeSuite,now,createId});
    const confidence=buildConfidence([{key:"evidence",label:"Evidence coverage",contribution:baseline.evidenceCoverage/100},{key:"measurement",label:"Measurement maturity",contribution:measurementSuite.maturityScore/100},{key:"outcomes",label:"Outcome maturity",contribution:outcomeSuite.achievementScore/100}]);
    const reasoning=this.reasoner.reason({request,outcomes:outcomeSuite,measurements:measurementSuite,confidence});
    const intelligence=new ImpactIntelligence(); const scores=intelligence.composeScores({baseline,areas:areaSuites,measurement:measurementSuite.maturityScore,outcome:outcomeSuite.achievementScore,roi:baseline.roiMaturity,knowledge:knowledgeContribution.contributionScore});
    const {risks,opportunities}=composeRisksOpportunities(areaSuites,createId); const recommendations=new ImpactRecommendationComposer(createId).compose(areaSuites,outcomeSuite,now); const health=composeHealth(scores); const dashboard=composeDashboard(now,health,risks,opportunities);
    const commonLens=impactLens("organization",health.overallScore);
    const missionDashboard={generatedAt:now.toISOString(),headline:`Mission impact ${Math.round(areaSuites.mission.score)}`,score:areaSuites.mission.score,outcomes:areaSuites.mission.records.map(r=>r.outcome),narrative:areaSuites.mission.narrative};
    const outcomeDashboard={generatedAt:now.toISOString(),headline:outcomeSuite.narrative,achievementScore:outcomeSuite.achievementScore,achievedCount:outcomeSuite.achievedCount,totalCount:outcomeSuite.outcomes.length,narrative:outcomeSuite.narrative};
    const programEffectivenessDashboard={generatedAt:now.toISOString(),headline:areaSuites.program_effectiveness.narrative,score:areaSuites.program_effectiveness.score,programs:areaSuites.program_effectiveness.records.map(r=>r.title),narrative:areaSuites.program_effectiveness.narrative};
    const roiDashboard={generatedAt:now.toISOString(),headline:`ROI ${roiSuite.roi.toFixed(2)}x`,roi:roiSuite.roi,valueCreated:roiSuite.analyses[0]?.valueCreated??0,narrative:roiSuite.narrative};
    const sroiDashboard={generatedAt:now.toISOString(),headline:`SROI ${roiSuite.sroi.toFixed(2)}x`,sroi:roiSuite.sroi,socialValueCreated:roiSuite.analyses[1]?.valueCreated??0,narrative:roiSuite.narrative};
    const brief={generatedAt:now.toISOString(),headline:dashboard.headline,summary:`${outcomeSuite.narrative} ${roiSuite.narrative}`,healthScore:health.overallScore,topRecommendations:recommendations.map(r=>r.title),topRisks:risks.map(r=>r.title),lenses:commonLens,narrative:dashboard.narrative};
    const boardReport={generatedAt:now.toISOString(),headline:`Board Impact Report: ${dashboard.headline}`,assuranceSummary:`Evidence coverage ${Math.round(baseline.evidenceCoverage)}.`,healthScore:health.overallScore,missionScore:areaSuites.mission.score,outcomeScore:outcomeSuite.achievementScore,roi:roiSuite.roi,recommendations:recommendations.map(r=>r.title),lenses:commonLens,narrative:`Board assurance on mission, outcomes, and return.`};
    const closedLearningLoop=new ClosedLearningLoop().contribute({outcomes:outcomeSuite,recommendations,now,createId});
    const projection=new ImpactProjection().project({generatedAt:now.toISOString(),headline:brief.headline,healthScore:health.overallScore,areaScores:health.areaScores,measurementScore:health.measurementScore,outcomeScore:health.outcomeScore,roiScore:health.roiScore,dashboard,brief,overallConfidence:confidence});
    const historyRecord={id:createId("imp-history"),requestId:request.requestId,scope,status:"assessed" as const,healthScore:health.overallScore,generatedAt:now.toISOString(),summary:brief.headline,metadata:request.metadata??{}};
    const result: ImpactResult={requestId:request.requestId,version:IMPACT_INTELLIGENCE_VERSION,generatedAt:now.toISOString(),periodLabel:request.periodLabel??defaultPeriodLabel(now),scope,baseline,healthScore:scores.healthScore,missionScore:scores.areaScores.mission,customerScore:scores.areaScores.customer,employeeScore:scores.areaScores.employee,studentScore:scores.areaScores.student,communityScore:scores.areaScores.community,financialScore:scores.areaScores.financial,grantScore:scores.areaScores.grant,programEffectivenessScore:scores.areaScores.program_effectiveness,strategicGoalAchievementScore:scores.areaScores.strategic_goal_achievement,operationalScore:scores.areaScores.operational,innovationScore:scores.areaScores.innovation,longTermOrganizationalScore:scores.areaScores.long_term_organizational,measurementScore:scores.measurementScore,outcomeScore:scores.outcomeScore,roiScore:scores.roiScore,knowledgeScore:scores.knowledgeScore,health,dashboard,missionDashboard,outcomeDashboard,programEffectivenessDashboard,roiDashboard,sroiDashboard,brief,boardReport,recommendations,risks,opportunities,measurementSuite,outcomeSuite,roiSuite,areaSuites,knowledgeContribution,closedLearningLoop,reasoning,projection,historyRecord,confidence,requestMetadata:{...(request.metadata??{}),registryPublishers:this.registry.list().length}};
    this.registry.register("impact","impact_intelligence"); this.repository.save(result); this.repository.saveHistory(historyRecord); return result;
  }
}
import { ImpactQueries } from "@/lib/platform/intelligence/impact/projection";
function requireProjection(){ return ImpactQueries; }
export { ImpactIntelligenceEngineImpl as ImpactIntelligenceEngine, ImpactIntelligenceEngineImpl as ImpactEngine, ImpactIntelligenceEngineImpl as ImpactEngineImpl };
