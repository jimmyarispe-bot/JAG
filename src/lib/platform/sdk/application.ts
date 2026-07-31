import { resolveCapabilities } from "@/lib/platform/sdk/capabilities";
import { isOperational } from "@/lib/platform/sdk/lifecycle";
import {
  getApplication,
  listApplications,
} from "@/lib/platform/sdk/registry";
import type {
  ApplicationManifest,
  CapabilityResolution,
  RegisteredApplication,
} from "@/lib/platform/sdk/types";

export function getManifest(applicationId: string): ApplicationManifest | null {
  return getApplication(applicationId)?.manifest ?? null;
}

export function listManifests(): ApplicationManifest[] {
  return listApplications().map((a) => a.manifest);
}

export function listEnabledApplications(): RegisteredApplication[] {
  return listApplications({ state: "enabled" });
}

export function isApplicationEnabled(applicationId: string): boolean {
  const record = getApplication(applicationId);
  return Boolean(record && isOperational(record.state));
}

export function resolveApplicationCapabilities(
  applicationId: string
): CapabilityResolution | null {
  const manifest = getManifest(applicationId);
  if (!manifest) return null;
  return resolveCapabilities(manifest);
}

export function applicationsDeclaringCapability(
  capability: ApplicationManifest["capabilities"][number]
): RegisteredApplication[] {
  return listApplications().filter((a) =>
    a.manifest.capabilities.includes(capability)
  );
}
