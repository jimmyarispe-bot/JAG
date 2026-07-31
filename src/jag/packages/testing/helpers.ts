import {
  bindPackageManifestSource,
  resetPackageRuntimeExtensionsForTests,
} from "@/jag/packages/contracts/extensions";
import { resetPackageEventsForTests } from "@/jag/packages/events";
import {
  resetPackageRegistryForTests,
  setPackageRegistryClockForTests,
} from "@/jag/packages/registry";
import type { PackageManifest } from "@/jag/packages/contracts/definitions";

export function resetPackageEngineForTests(): void {
  resetPackageRegistryForTests();
  resetPackageEventsForTests();
  resetPackageRuntimeExtensionsForTests();
  bindPackageManifestSource(null);
  setPackageRegistryClockForTests(null);
}

export function freezePackageEngineForTests(input?: { now?: Date }): void {
  const now = input?.now ?? new Date("2026-01-15T12:00:00.000Z");
  setPackageRegistryClockForTests(() => now);
}

/** Minimal valid generic package — no industry semantics. */
export function createTestPackageManifest(
  overrides?: Partial<{
    id: string;
    applicationId: string;
    version: string;
    contributions: PackageManifest["contributions"];
    dependencies: PackageManifest["dependencies"];
    compatibility: PackageManifest["compatibility"];
  }>
): PackageManifest {
  const id = overrides?.id ?? "test.package.generic";
  return {
    metadata: {
      id,
      applicationId: overrides?.applicationId ?? "test-app",
      displayName: "Generic Test Package",
      version: overrides?.version ?? "1.0.0",
    },
    compatibility: overrides?.compatibility ?? {
      jagMinVersion: "1.0.0",
    },
    contributions: overrides?.contributions ?? [
      { kind: "entities", ids: [`${id}.entity.sample`] },
      { kind: "forms", ids: [`${id}.form.sample`] },
    ],
    dependencies: overrides?.dependencies,
  };
}
