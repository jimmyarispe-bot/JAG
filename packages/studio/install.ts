/**
 * Install JAG Studio through the Platform SDK Extension Framework.
 * Consumes existing SDK APIs only — no Foundation / AcademyOS / SDK edits.
 */

import { createPlatformSdk, getPlatformSdk } from "@/lib/platform-sdk";
import { createStudioInsightProvider } from "./insights/provider";
import {
  STUDIO_EXTENSION_MANIFEST,
  STUDIO_PACK_ID,
} from "./manifest";
import { ensureCertificationRecord } from "./certification/engine";
import { createPerEngine } from "./per/engine";
import { createProductRegistryService } from "./products/registry";
import { createReleaseManager } from "./release/manager";

export type StudioInstallResult = {
  readonly extensionId: string;
  readonly status: string;
  readonly enabled: boolean;
  readonly insightProviderId: string;
  readonly productsSeeded: number;
  readonly persSynced: number;
};

export function installJagStudio(input: {
  organizationId: string;
  freshSdk?: boolean;
  repositoryRoot?: string;
}): StudioInstallResult {
  const sdk = input.freshSdk ? createPlatformSdk() : getPlatformSdk();

  sdk.extensions.registerCatalog(STUDIO_EXTENSION_MANIFEST);
  sdk.extensions.lifecycle.install(
    input.organizationId,
    STUDIO_EXTENSION_MANIFEST
  );
  const enabled = sdk.extensions.lifecycle.enable(
    input.organizationId,
    STUDIO_PACK_ID
  );

  const insightProvider = createStudioInsightProvider();
  sdk.registry.registerInsightProvider(insightProvider);

  createProductRegistryService().ensureSeed();
  const pers = createPerEngine().sync(input.repositoryRoot);

  // Seed AcademyOS release track as first Studio customer
  const releases = createReleaseManager();
  if (releases.list("academyos").length === 0) {
    releases.create({
      productId: "academyos",
      version: "1.0.0-rc.3",
      status: "RC-3",
      releaseNotes:
        "AcademyOS production-readiness track — RC-3 deployment/operations complete; Studio governs RC-4 advancement.",
      migrationHistory: [
        "2.1 Industry Pack",
        "2.3 SIS",
        "2.4 Academic Ops",
        "2.5 Learning",
        "2.6 Finance",
        "2.7 Workforce",
        "3.1 Communications",
        "RC-1 Validation",
        "RC-2 Hardening",
        "RC-3 Operations",
      ],
      upgradePath: ["RC-3", "RC-4", "Certified", "Released"],
      compatibilityMatrix: {
        platform: "1.x",
        sdk: "1.x",
        twin: "1.x",
      },
      createdBy: "studio",
      skipGateCheck: true,
    });
  }

  // Full gate eval for AcademyOS; lightweight stubs for other products
  ensureCertificationRecord("academyos", input.repositoryRoot);
  for (const p of createProductRegistryService().list()) {
    if (p.id === "academyos") continue;
    ensureCertificationRecord(p.id, input.repositoryRoot, {
      lightweight: true,
    });
  }

  return {
    extensionId: enabled.manifest.id,
    status: enabled.status,
    enabled: enabled.enabled,
    insightProviderId: insightProvider.id,
    productsSeeded: createProductRegistryService().list().length,
    persSynced: pers.length,
  };
}

export function getStudioInstallRecord(organizationId: string) {
  return getPlatformSdk().extensions.get(organizationId, STUDIO_PACK_ID);
}
