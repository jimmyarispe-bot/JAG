/**
 * Thin loader for Production Readiness UI — Sprint 209.
 */

import { ProductionReadinessService } from "./ProductionReadinessService";
import {
  listReadinessObservations,
  type ReadinessObservation,
} from "./observability";
import type { ValidationReport } from "./types";

export type JagReadinessWorkspaceModel = {
  readonly report: ValidationReport;
  readonly observations: readonly ReadinessObservation[];
};

export function loadReadinessWorkspace(): JagReadinessWorkspaceModel {
  const report = ProductionReadinessService.runFullValidation();
  return {
    report,
    observations: listReadinessObservations(20),
  };
}

export { listReadinessObservations };
