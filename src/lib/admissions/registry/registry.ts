import { ADMISSIONS_ENTITIES } from "@/lib/admissions/registry/entities";
import { ADMISSIONS_INTEGRATIONS } from "@/lib/admissions/registry/integrations";
import { ADMISSIONS_PIPELINE_STAGES } from "@/lib/admissions/registry/stages";
import { ADMISSIONS_WORKFLOW_CATALOG } from "@/lib/admissions/registry/workflows";
import {
  ADMISSIONS_DASHBOARD_TILES,
  ADMISSIONS_FUNNEL_STEPS,
} from "@/lib/admissions/registry/dashboard";
import type { AdmissionsRegistrySnapshot } from "@/lib/admissions/registry/types";

let registered = false;

/** Build a snapshot of the Admissions OS registry catalog. */
export function getAdmissionsRegistrySnapshot(): AdmissionsRegistrySnapshot {
  return {
    entities: [...ADMISSIONS_ENTITIES],
    integrations: [...ADMISSIONS_INTEGRATIONS],
    pipelineStages: [...ADMISSIONS_PIPELINE_STAGES],
    workflows: [...ADMISSIONS_WORKFLOW_CATALOG],
    dashboardTiles: [...ADMISSIONS_DASHBOARD_TILES],
    funnelSteps: [...ADMISSIONS_FUNNEL_STEPS],
  };
}

export function isAdmissionsRegistryRegistered(): boolean {
  return registered;
}

/** Register the Admissions OS catalog (idempotent). */
export function registerAdmissionsCatalog(): void {
  if (registered) return;
  registered = true;
}

export function getAdmissionsEntity(key: string) {
  return ADMISSIONS_ENTITIES.find((entity) => entity.key === key);
}

export function getAdmissionsIntegration(key: string) {
  return ADMISSIONS_INTEGRATIONS.find((integration) => integration.key === key);
}
