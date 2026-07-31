import type { AcademyBootstrapResult } from "@/applications/academyos/bootstrap";
import type { AcademyContainer } from "@/applications/academyos/composition/types";
import { listAcademyServiceNames } from "@/applications/academyos/composition/services";
import { ACADEMYOS_APPLICATION_ID } from "@/applications/academyos/manifest";
import { SdkService } from "@/lib/platform/sdk";
import { SchemaService } from "@/lib/platform/schema";
import { WorkflowService } from "@/lib/platform/workflows/framework";
import { EntityService } from "@/lib/platform/entities";
import { FormService } from "@/lib/platform/forms";
import { ApiService } from "@/lib/platform/api";

export type AcademyHealthIssue = {
  code: string;
  message: string;
};

export type AcademyHealthReport = {
  ok: boolean;
  applicationId: string;
  checks: Array<{ name: string; ok: boolean; detail?: string }>;
  issues: AcademyHealthIssue[];
};

/**
 * Fail closed before serving requests when registration/composition is incomplete.
 */
export function validateAcademyStartup(input: {
  registration: AcademyBootstrapResult | null;
  container: AcademyContainer;
  requirePlatformRegistration?: boolean;
}): AcademyHealthReport {
  const issues: AcademyHealthIssue[] = [];
  const checks: AcademyHealthReport["checks"] = [];
  const requirePlatform = input.requirePlatformRegistration !== false;

  const push = (name: string, ok: boolean, detail?: string, code?: string) => {
    checks.push({ name, ok, detail });
    if (!ok) {
      issues.push({
        code: code ?? `failed_${name}`,
        message: detail ?? `${name} check failed`,
      });
    }
  };

  push("container_ready", input.container.ready === true);

  push(
    "infrastructure_bound",
    Boolean(
      input.container.infrastructure?.database &&
        input.container.infrastructure?.transactions &&
        input.container.infrastructure?.email &&
        input.container.infrastructure?.documents &&
        input.container.infrastructure?.identity
    ),
    "database/transactions/email/documents/identity"
  );

  for (const name of listAcademyServiceNames()) {
    push(
      `service_${name}`,
      typeof input.container.services[name] === "object" &&
        input.container.services[name] != null
    );
  }

  const repoKeys = Object.keys(input.container.repositories);
  push("repositories_bound", repoKeys.length >= 10, `${repoKeys.length} repos`);

  if (requirePlatform) {
    push(
      "sdk_enabled",
      SdkService.isEnabled(ACADEMYOS_APPLICATION_ID),
      "AcademyOS must be enabled in SdkService"
    );
    push(
      "registration_present",
      input.registration != null &&
        input.registration.applicationId === ACADEMYOS_APPLICATION_ID,
      "bootstrapAcademyOS registration result required"
    );
    push(
      "schemas_registered",
      SchemaService.list().some((s) => s.applicationId === ACADEMYOS_APPLICATION_ID),
      `count=${SchemaService.list().length}`
    );
    push(
      "workflows_registered",
      WorkflowService.listDefinitions().some(
        (w) => w.applicationId === ACADEMYOS_APPLICATION_ID
      )
    );
    push("entities_registered", EntityService.isRegistered("Student"));
    push(
      "forms_registered",
      FormService.get("academyos.student.create") != null
    );
    push(
      "apis_registered",
      ApiService.get("academyos.students.create") != null
    );
  }

  return {
    ok: issues.length === 0,
    applicationId: ACADEMYOS_APPLICATION_ID,
    checks,
    issues,
  };
}

export function assertAcademyStartupHealthy(
  report: AcademyHealthReport
): void {
  if (report.ok) return;
  const detail = report.issues
    .map((i) => `${i.code}: ${i.message}`)
    .join("; ");
  throw new Error(`AcademyOS startup health check failed — ${detail}`);
}
