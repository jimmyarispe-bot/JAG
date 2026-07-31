/**
 * Portfolio aggregation view.
 */

import { listOpportunities } from "../store";
import type {
  InnovationCandidate,
  InnovationPortfolio,
  PortfolioCategory,
} from "../types";
import { PORTFOLIO_CATEGORIES } from "../types";

export function buildInnovationPortfolio(): InnovationPortfolio {
  const all = listOpportunities({ limit: 100 });
  const byCategory = {} as Record<
    PortfolioCategory,
    InnovationCandidate[]
  >;
  const mix = {} as Record<PortfolioCategory, number>;
  for (const cat of PORTFOLIO_CATEGORIES) {
    byCategory[cat] = [];
    mix[cat] = 0;
  }
  for (const o of all) {
    byCategory[o.portfolioCategory].push(o);
    mix[o.portfolioCategory] += 1;
  }
  const frozen = {} as Record<
    PortfolioCategory,
    readonly InnovationCandidate[]
  >;
  for (const cat of PORTFOLIO_CATEGORIES) {
    frozen[cat] = Object.freeze(byCategory[cat]);
  }
  return {
    generatedAt: new Date().toISOString(),
    byCategory: Object.freeze(frozen),
    mix: Object.freeze(mix),
  };
}
