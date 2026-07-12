import { buildConfidence } from "@/lib/platform/intelligence/impact/models";
import type { ImpactProjectionResult, ImpactQueryRequest, ImpactQueryResult, ImpactResult } from "@/lib/platform/intelligence/impact/types";
export class ImpactProjection {
  project(input: Omit<ImpactProjectionResult, "forecast">): ImpactProjectionResult { return { ...input, forecast: Math.min(100, input.healthScore + 5) }; }
}
export class ImpactQueries {
  ask(result: ImpactResult, request: ImpactQueryRequest): ImpactQueryResult {
    const focus=request.focus??"general", max=request.maxResults??5; let answer=result.brief.headline; let references:string[]=result.recommendations.slice(0,max).map(r=>r.title);
    if (focus==="measurement") { answer=result.measurementSuite.narrative; references=result.measurementSuite.measurements.slice(0,max).map(m=>m.name); }
    else if (focus==="outcomes") { answer=result.outcomeSuite.narrative; references=result.outcomeSuite.outcomes.slice(0,max).map(o=>o.title); }
    else if (focus==="roi") { answer=result.roiSuite.narrative; references=result.roiSuite.analyses.map(r=>r.narrative); }
    else if (focus==="reasoning") { answer=result.reasoning.answer; references=result.reasoning.connectedOutcomes.slice(0,max); }
    else if (focus==="learning") { answer=result.closedLearningLoop.narrative; references=result.closedLearningLoop.lessons.slice(0,max); }
    else if (focus==="recommendations") { answer=`${result.recommendations.length} impact recommendations.`; }
    else if (focus in result.areaSuites) { const suite=result.areaSuites[focus as keyof typeof result.areaSuites]; answer=suite.narrative; references=suite.records.slice(0,max).map(r=>r.title); }
    return {question:request.question,focus,answer,references,confidence:buildConfidence([{key:"result",label:"Result confidence",contribution:result.confidence.value},{key:"focus",label:"Focus specificity",contribution:focus==="general"?.6:.85}])};
  }
}
