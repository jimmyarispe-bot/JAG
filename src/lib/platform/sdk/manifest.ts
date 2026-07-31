import { normalizeCompatibility } from "@/lib/platform/sdk/compatibility";
import type { ApplicationManifest } from "@/lib/platform/sdk/types";

/**
 * Normalize a manifest before validation / registration.
 */
export function normalizeManifest(
  manifest: ApplicationManifest
): ApplicationManifest {
  if (!manifest.id?.trim()) {
    throw new Error("ApplicationManifest.id is required");
  }
  if (!manifest.name?.trim()) {
    throw new Error("ApplicationManifest.name is required");
  }
  if (!manifest.version?.trim()) {
    throw new Error("ApplicationManifest.version is required");
  }

  return {
    ...manifest,
    id: manifest.id.trim(),
    name: manifest.name.trim(),
    version: manifest.version.trim(),
    description: manifest.description ?? null,
    capabilities: [...(manifest.capabilities ?? [])],
    schemas: (manifest.schemas ?? []).map((s) => ({ ...s })),
    entities: (manifest.entities ?? []).map((e) => ({ ...e })),
    forms: (manifest.forms ?? []).map((f) => ({ ...f })),
    workflows: (manifest.workflows ?? []).map((w) => ({ ...w })),
    apis: (manifest.apis ?? []).map((a) => ({ ...a })),
    permissions: (manifest.permissions ?? []).map((p) => ({ ...p })),
    automation: (manifest.automation ?? []).map((a) => ({ ...a })),
    dependencies: (manifest.dependencies ?? []).map((d) => ({ ...d })),
    extensions: (manifest.extensions ?? []).map((e) => ({
      ...e,
      metadata: { ...(e.metadata ?? {}) },
    })),
    compatibility: normalizeCompatibility(
      manifest.compatibility ?? {
        minPlatformVersion: "0.0.0",
      }
    ),
    metadata: { ...(manifest.metadata ?? {}) },
  };
}

export function emptyManifest(
  partial: Pick<ApplicationManifest, "id" | "name" | "version"> &
    Partial<ApplicationManifest>
): ApplicationManifest {
  return normalizeManifest({
    id: partial.id,
    name: partial.name,
    version: partial.version,
    description: partial.description ?? null,
    capabilities: partial.capabilities ?? [],
    schemas: partial.schemas ?? [],
    entities: partial.entities ?? [],
    forms: partial.forms ?? [],
    workflows: partial.workflows ?? [],
    apis: partial.apis ?? [],
    permissions: partial.permissions ?? [],
    automation: partial.automation ?? [],
    dependencies: partial.dependencies ?? [],
    extensions: partial.extensions ?? [],
    compatibility: partial.compatibility ?? {
      minPlatformVersion: "0.78.0",
    },
    metadata: partial.metadata ?? {},
  });
}
