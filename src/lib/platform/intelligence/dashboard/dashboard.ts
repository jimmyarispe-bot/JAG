/**
 * Executive Intelligence Dashboard — projector stub (Sprint 024).
 */

import type { IntelligenceDashboardProjection } from "@/lib/platform/intelligence/dashboard/types";

export function createEmptyDashboardProjection(
  headline = "Executive dashboard ready"
): IntelligenceDashboardProjection {
  return {
    generatedAt: new Date().toISOString(),
    headline,
    sections: [],
  };
}
