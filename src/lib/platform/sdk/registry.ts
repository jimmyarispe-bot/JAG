import type { RegisteredApplication } from "@/lib/platform/sdk/types";

const registry = new Map<string, RegisteredApplication>();

export function resetSdkRegistryForTests(): void {
  registry.clear();
}

export function putApplication(
  record: RegisteredApplication
): RegisteredApplication {
  const stored: RegisteredApplication = {
    ...record,
    manifest: {
      ...record.manifest,
      capabilities: [...record.manifest.capabilities],
      schemas: record.manifest.schemas.map((s) => ({ ...s })),
      entities: record.manifest.entities.map((e) => ({ ...e })),
      forms: record.manifest.forms.map((f) => ({ ...f })),
      workflows: record.manifest.workflows.map((w) => ({ ...w })),
      apis: record.manifest.apis.map((a) => ({ ...a })),
      permissions: record.manifest.permissions.map((p) => ({ ...p })),
      automation: record.manifest.automation.map((a) => ({ ...a })),
      dependencies: record.manifest.dependencies.map((d) => ({ ...d })),
      extensions: record.manifest.extensions.map((e) => ({
        ...e,
        metadata: { ...(e.metadata ?? {}) },
      })),
      compatibility: {
        ...record.manifest.compatibility,
        deprecatedCapabilities: [
          ...(record.manifest.compatibility.deprecatedCapabilities ?? []),
        ],
      },
      metadata: { ...record.manifest.metadata },
    },
    validationIssues: record.validationIssues.map((i) => ({ ...i })),
  };
  registry.set(stored.manifest.id, stored);
  return stored;
}

export function removeApplication(applicationId: string): boolean {
  return registry.delete(applicationId);
}

export function getApplication(
  applicationId: string
): RegisteredApplication | null {
  return registry.get(applicationId) ?? null;
}

export function listApplications(filter?: {
  state?: RegisteredApplication["state"];
}): RegisteredApplication[] {
  let rows = [...registry.values()];
  if (filter?.state) {
    rows = rows.filter((r) => r.state === filter.state);
  }
  return rows.sort((a, b) => a.manifest.id.localeCompare(b.manifest.id));
}

export function assertApplicationRegistered(
  applicationId: string
): RegisteredApplication {
  const record = getApplication(applicationId);
  if (!record) {
    throw new Error(
      `Application "${applicationId}" is not registered. Applications must SdkService.register().`
    );
  }
  return record;
}

export const SdkRegistry = {
  put: putApplication,
  remove: removeApplication,
  get: getApplication,
  list: listApplications,
  assert: assertApplicationRegistered,
  resetForTests: resetSdkRegistryForTests,
} as const;
