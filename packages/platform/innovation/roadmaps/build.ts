/**
 * Roadmap aggregation — Now / Next / Later / Future.
 */

import { listOpportunities } from "../store";
import type { InnovationRoadmap } from "../types";

export function buildInnovationRoadmap(): InnovationRoadmap {
  const all = listOpportunities({ limit: 100 });
  return {
    generatedAt: new Date().toISOString(),
    now: Object.freeze(all.filter((o) => o.roadmapHorizon === "Now")),
    next: Object.freeze(all.filter((o) => o.roadmapHorizon === "Next")),
    later: Object.freeze(all.filter((o) => o.roadmapHorizon === "Later")),
    future: Object.freeze(all.filter((o) => o.roadmapHorizon === "Future")),
  };
}
