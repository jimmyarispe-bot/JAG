import type {
  EducationAnalysisContext,
  EducationRecommendationBuilder,
} from "../framework";
import {
  analyzeScholarship,
  type ScholarshipAnalysis,
} from "./ScholarshipAnalyzer";
import type { ScholarshipObservation } from "./ScholarshipObservation";
import { SCHOLARSHIP_ACTION_PROPOSAL_IDS } from "./ScholarshipTypes";

export function buildScholarshipRecommendations(
  builder: EducationRecommendationBuilder,
  ctx: EducationAnalysisContext<ScholarshipObservation>,
  analysis?: ScholarshipAnalysis
): void {
  const a = analysis ?? analyzeScholarship(ctx.observation);
  const byCode = new Set(ctx.evidence.map((e) => e.code));

  if (byCode.has("insufficient_scholarship_data")) {
    builder
      .recommend("gather_scholarship_data", "Gather Scholarship Data")
      .because("Scholarship intelligence requires award metadata.")
      .confidence("medium")
      .priority("high")
      .supportedBy("insufficient_scholarship_data")
      .proposeAction({
        kind: "PublishScholarshipBrief",
        actionId: SCHOLARSHIP_ACTION_PROPOSAL_IDS.PublishScholarshipBrief,
        rationale: "Propose scholarship data brief",
      })
      .asWarning();
    return;
  }

  if (byCode.has("eligible_scholarship") || byCode.has("funding_opportunity")) {
    builder
      .recommend("pursue_eligible_scholarship", "Pursue Eligible Scholarships")
      .because(
        `${a.eligibleIds.length} eligible award(s) and/or funding opportunities identified.`
      )
      .confidence(0.9)
      .priority("high")
      .supportedBy("eligible_scholarship", "funding_opportunity")
      .proposeAction({
        kind: "ApplyScholarship",
        actionId: SCHOLARSHIP_ACTION_PROPOSAL_IDS.ApplyScholarship,
        rationale: "Propose pursuing eligible scholarship",
      });
  }

  if (byCode.has("renewal_risk")) {
    builder
      .recommend("address_renewal_risk", "Address Scholarship Renewal Risk")
      .because(
        `${a.renewalRiskIds.length} award(s) show renewal risk (GPA, docs, or deadline).`
      )
      .confidence(0.92)
      .priority("critical")
      .supportedBy("renewal_risk")
      .proposeAction({
        kind: "RenewScholarship",
        actionId: SCHOLARSHIP_ACTION_PROPOSAL_IDS.RenewScholarship,
        rationale: "Propose renewal action",
      })
      .proposeAction({
        kind: "RequestFundingDocs",
        actionId: SCHOLARSHIP_ACTION_PROPOSAL_IDS.RequestFundingDocs,
        priority: 2,
        rationale: "Propose collecting missing funding docs",
      })
      .asWarning();

    builder
      .recommend("complete_funding_docs", "Complete Funding Documentation")
      .because("Renewal or eligibility may be blocked by missing documentation.")
      .confidence(0.86)
      .priority("high")
      .supportedBy("renewal_risk")
      .proposeAction({
        kind: "RequestFundingDocs",
        actionId: SCHOLARSHIP_ACTION_PROPOSAL_IDS.RequestFundingDocs,
        rationale: "Propose funding documentation completion",
      });
  }

  if (byCode.has("scholarship_healthy")) {
    builder
      .recommend("maintain_scholarship_health", "Maintain Scholarship Health")
      .because("No dominant renewal risks; continue monitoring award utilization.")
      .confidence(0.85)
      .priority("low")
      .supportedBy("scholarship_healthy")
      .proposeAction({
        kind: "PublishScholarshipBrief",
        actionId: SCHOLARSHIP_ACTION_PROPOSAL_IDS.PublishScholarshipBrief,
        rationale: "Propose scholarship health brief",
      })
      .asInformational();
  }
}
