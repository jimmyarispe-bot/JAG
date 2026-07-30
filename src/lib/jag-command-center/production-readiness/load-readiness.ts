/**
 * Thin loader for Production Readiness UI — Sprint 209 / 210.
 */

import { GaCertificationService } from "../ga-certification/GaCertificationService";
import type { GaRecommendation, Severity } from "../ga-certification/types";
import { ProductionReadinessService } from "./ProductionReadinessService";
import {
  listReadinessObservations,
  type ReadinessObservation,
} from "./observability";
import type { ValidationReport } from "./types";

export type GaCertificationSummary = {
  readonly overallScore: number;
  readonly recommendation: GaRecommendation;
  readonly findingCount: number;
  readonly blockerCount: number;
  readonly topFindings: readonly {
    readonly severity: Severity;
    readonly title: string;
    readonly detail: string;
  }[];
};

export type JagReadinessWorkspaceModel = {
  readonly report: ValidationReport;
  readonly observations: readonly ReadinessObservation[];
  readonly certification: GaCertificationSummary;
};

export async function loadReadinessWorkspace(): Promise<JagReadinessWorkspaceModel> {
  const report = ProductionReadinessService.runFullValidation();
  const certificationReport =
    await GaCertificationService.runFullCertification();
  return {
    report,
    observations: listReadinessObservations(20),
    certification: {
      overallScore: certificationReport.overallScore,
      recommendation: certificationReport.recommendation,
      findingCount: certificationReport.findings.length,
      blockerCount: certificationReport.blockers.length,
      topFindings: certificationReport.findings.slice(0, 5).map((f) => ({
        severity: f.severity,
        title: f.title,
        detail: f.detail,
      })),
    },
  };
}

export { listReadinessObservations };
