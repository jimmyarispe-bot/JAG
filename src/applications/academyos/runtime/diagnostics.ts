import {
  ACADEMYOS_APPLICATION_ID,
  ACADEMYOS_VERSION,
  AcademyOSManifest,
} from "@/applications/academyos/manifest";
import { listAcademyServiceNames } from "@/applications/academyos/composition/services";
import {
  ensureAcademyOSBooted,
  getAcademyOSStartup,
} from "@/applications/academyos/runtime/boot";
import { getAcademyNavigationService } from "@/applications/academyos/navigation/service";
import { ApiService } from "@/lib/platform/api";
import { EntityService } from "@/lib/platform/entities";
import { FormService } from "@/lib/platform/forms";
import { SdkService } from "@/lib/platform/sdk";
import { WorkflowService } from "@/lib/platform/workflows/framework";

export type AcademyOSDiagnosticsSnapshot = {
  platformVersion: string | null;
  academyOsVersion: string;
  applicationId: string;
  platformInitialized: boolean;
  academyOsInitialized: boolean;
  compositionReady: boolean;
  startupStatus: "ok" | "degraded" | "not_started";
  healthOk: boolean;
  repositoryDriver: string | null;
  mode: string | null;
  registeredProviders: string[];
  registeredApplicationServices: string[];
  registeredWorkflows: string[];
  registeredEntities: string[];
  registeredForms: string[];
  registeredApis: string[];
  navigationItemCount: number;
  navigationHrefs: string[];
  healthChecks: Array<{ name: string; ok: boolean; detail?: string }>;
  healthIssues: Array<{ code: string; message: string }>;
};

/** Developer diagnostics — safe to call after ensureAcademyOSBooted. */
export function getAcademyOSDiagnosticsSnapshot(
  options?: { ensureBooted?: boolean }
): AcademyOSDiagnosticsSnapshot {
  if (options?.ensureBooted !== false) {
    ensureAcademyOSBooted();
  }

  const startup = getAcademyOSStartup();
  const container = startup?.container ?? null;
  const health = startup?.health;
  const nav = getAcademyNavigationService();

  const registeredProviders = container
    ? [
        "database",
        "transactions",
        "storage",
        "documents",
        "email",
        "search",
        "cache",
        "queue",
        "clock",
        "identity",
      ].filter((key) => {
        const infra = container.infrastructure as Record<string, unknown>;
        return infra[key] != null;
      })
    : [];

  const registeredWorkflows = WorkflowService.listDefinitions()
    .filter((w) => w.applicationId === ACADEMYOS_APPLICATION_ID)
    .map((w) => w.id);

  const registeredForms = FormService.list({
    applicationId: ACADEMYOS_APPLICATION_ID,
  }).map((f) => f.id);

  const registeredApis = ApiService.list({
    applicationId: ACADEMYOS_APPLICATION_ID,
  }).map((a) => a.id);

  // EntityService may expose list or known types via isRegistered checks.
  const entityCandidates = [
    "Student",
    "Guardian",
    "Invoice",
    "Enrollment",
    "AttendanceRecord",
    "Employee",
  ];
  const registeredEntities = entityCandidates.filter((name) => {
    try {
      return EntityService.isRegistered(name);
    } catch {
      return false;
    }
  });

  let startupStatus: AcademyOSDiagnosticsSnapshot["startupStatus"] = "not_started";
  if (startup) {
    startupStatus = health?.ok ? "ok" : "degraded";
  }

  const platformManifest = SdkService.getManifest(ACADEMYOS_APPLICATION_ID);

  return {
    platformVersion: platformManifest?.version ?? null,
    academyOsVersion: ACADEMYOS_VERSION ?? AcademyOSManifest.version,
    applicationId: ACADEMYOS_APPLICATION_ID,
    platformInitialized: SdkService.isEnabled(ACADEMYOS_APPLICATION_ID),
    academyOsInitialized: startup != null,
    compositionReady: container?.ready === true,
    startupStatus,
    healthOk: health?.ok === true,
    repositoryDriver:
      container?.infrastructure.config.persistenceDriver ?? null,
    mode: container?.mode ?? null,
    registeredProviders,
    registeredApplicationServices: container
      ? listAcademyServiceNames().filter(
          (name) => container.services[name] != null
        )
      : [],
    registeredWorkflows,
    registeredEntities,
    registeredForms,
    registeredApis,
    navigationItemCount: nav.listStaffModules().length,
    navigationHrefs: nav.listStaffModules().map((m) => m.href),
    healthChecks: health?.checks ?? [],
    healthIssues: health?.issues ?? [],
  };
}
