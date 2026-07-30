/**
 * Decision Center™ — unified engineering command center payload.
 */

import { buildActivityFeed } from "./activity";
import { buildDecisionEvidenceContext } from "./context";
import { buildDecisionOverview } from "./overview";
import { buildPerCenter } from "./per";
import { buildProductDecisionCards } from "./products";
import { buildDecisionRecommendations } from "./recommendations";
import { buildReleaseDecisionViews } from "./releases";
import { buildRiskCenter } from "./risks";
import { buildEngineeringTimeline } from "./timeline";
import type { RecommendationSort } from "./types";

export type DecisionCenterDashboard = {
  readonly overview: ReturnType<typeof buildDecisionOverview>;
  readonly products: ReturnType<typeof buildProductDecisionCards>;
  readonly releases: ReturnType<typeof buildReleaseDecisionViews>;
  readonly recommendations: ReturnType<typeof buildDecisionRecommendations>;
  readonly risks: ReturnType<typeof buildRiskCenter>;
  readonly pers: ReturnType<typeof buildPerCenter>;
  readonly timeline: ReturnType<typeof buildEngineeringTimeline>;
  readonly activity: ReturnType<typeof buildActivityFeed>;
  readonly generatedAt: string;
};

export function buildDecisionCenter(input?: {
  root?: string;
  sort?: RecommendationSort;
  productId?: string;
}): DecisionCenterDashboard {
  const root = input?.root;
  const ctx = buildDecisionEvidenceContext(root);
  const products = buildProductDecisionCards(root, ctx);
  const releases = buildReleaseDecisionViews(root, ctx);
  const risks = buildRiskCenter(root, ctx);
  const recommendations = buildDecisionRecommendations({
    root,
    productId: input?.productId ?? "academyos",
    sort: input?.sort,
    ctx,
  });
  const pers = buildPerCenter(root, ctx);
  const timeline = buildEngineeringTimeline(root, ctx);
  const activity = buildActivityFeed({ root, ctx });
  const overview = buildDecisionOverview(root, {
    products,
    releases,
    risks,
    ctx,
  });

  return {
    overview,
    products,
    releases,
    recommendations,
    risks,
    pers,
    timeline,
    activity,
    generatedAt: new Date().toISOString(),
  };
}

export function createDecisionCenterService() {
  return {
    build: buildDecisionCenter,
    overview: (root?: string) => {
      const ctx = buildDecisionEvidenceContext(root);
      const products = buildProductDecisionCards(root, ctx);
      const releases = buildReleaseDecisionViews(root, ctx);
      const risks = buildRiskCenter(root, ctx);
      return buildDecisionOverview(root, { products, releases, risks, ctx });
    },
    products: (root?: string) =>
      buildProductDecisionCards(root, buildDecisionEvidenceContext(root)),
    releases: (root?: string) =>
      buildReleaseDecisionViews(root, buildDecisionEvidenceContext(root)),
    recommendations: buildDecisionRecommendations,
    risks: (root?: string) =>
      buildRiskCenter(root, buildDecisionEvidenceContext(root)),
    pers: (root?: string) =>
      buildPerCenter(root, buildDecisionEvidenceContext(root)),
    timeline: (root?: string) =>
      buildEngineeringTimeline(root, buildDecisionEvidenceContext(root)),
    activity: buildActivityFeed,
  };
}
