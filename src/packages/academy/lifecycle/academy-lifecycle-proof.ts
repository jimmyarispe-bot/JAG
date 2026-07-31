/**
 * Academy Runtime Lifecycle proof — Version 1 → Version 2 → Diff → Publish.
 * No runtime execution; governance metadata only.
 */

import { EducationIndustryBlueprint } from "@/jag/blueprints";
import {
  RuntimeLifecycleManager,
  type RuntimeLineage,
  type RuntimeVersion,
  type SnapshotCompareResult,
} from "@/jag/runtime-lifecycle";
import { generateAcademyRuntimeSpecification } from "@/packages/academy/blueprints/materialize";
import { buildAcademyOrganizationBlueprint } from "@/packages/academy/blueprints/academy.organization";
import { ACADEMY_PACKAGE_VERSION } from "@/packages/academy/package";

export type AcademyLifecycleProofResult = {
  readonly ok: boolean;
  readonly version1?: RuntimeVersion;
  readonly version2?: RuntimeVersion;
  readonly snapshotCompare?: SnapshotCompareResult;
  readonly lineage?: RuntimeLineage;
  readonly publishedVersionId?: string;
  readonly error?: { readonly code: string; readonly message: string };
};

/**
 * Demonstrate governed evolution for Academy:
 * generate v1 → validate → approve → publish → generate v2 → validate → diff snapshots → approve → publish.
 */
export function runAcademyLifecycleProof(
  manager: RuntimeLifecycleManager = new RuntimeLifecycleManager()
): AcademyLifecycleProofResult {
  const org = buildAcademyOrganizationBlueprint();
  const industry = EducationIndustryBlueprint;

  const gen1 = generateAcademyRuntimeSpecification();
  if (!gen1.ok || !gen1.specification) {
    return {
      ok: false,
      error: gen1.error ?? {
        code: "generation_failed",
        message: "Failed to generate Academy runtime v1",
      },
    };
  }

  const packVersions = (org.capabilityPacks ?? []).map((p) =>
    Object.freeze({
      packId: p.id,
      version: p.version ?? ACADEMY_PACKAGE_VERSION,
    })
  );

  const v1Create = manager.createVersion({
    specification: gen1.specification,
    industryId: industry.id,
    industryBlueprintVersion: industry.version,
    organizationId: org.id,
    organizationBlueprintVersion: org.version,
    packageId: org.packageId,
    applicationId: org.applicationId,
    capabilityPackVersions: packVersions,
    labels: Object.freeze(["academy", "v1"]),
  });
  if (!v1Create.ok || !v1Create.value) {
    return { ok: false, error: v1Create.error };
  }

  const v1Validate = manager.validate(v1Create.value.versionId);
  if (!v1Validate.ok || !v1Validate.value) {
    return { ok: false, error: v1Validate.error };
  }

  manager.addApproval(v1Create.value.versionId, {
    kind: "technical",
    approverId: "platform.engineer",
  });
  manager.addApproval(v1Create.value.versionId, {
    kind: "organization",
    approverId: "academy.ceo",
  });

  const v1Approve = manager.promote(v1Create.value.versionId, "approved");
  if (!v1Approve.ok) return { ok: false, error: v1Approve.error };
  const v1Publish = manager.promote(v1Create.value.versionId, "published");
  if (!v1Publish.ok) return { ok: false, error: v1Publish.error };

  const snap1 = manager.createSnapshot(v1Create.value.versionId, {
    label: "academy-published-v1",
  });
  if (!snap1.ok || !snap1.value) return { ok: false, error: snap1.error };

  // Version 2 — new generation (immutable; parent = v1)
  const gen2 = generateAcademyRuntimeSpecification();
  if (!gen2.ok || !gen2.specification) {
    return {
      ok: false,
      error: gen2.error ?? {
        code: "generation_failed",
        message: "Failed to generate Academy runtime v2",
      },
    };
  }

  const v2Create = manager.createVersion({
    specification: gen2.specification,
    industryId: industry.id,
    industryBlueprintVersion: industry.version,
    organizationId: org.id,
    organizationBlueprintVersion: org.version,
    packageId: org.packageId,
    applicationId: org.applicationId,
    capabilityPackVersions: packVersions,
    parentVersionId: v1Create.value.versionId,
    labels: Object.freeze(["academy", "v2"]),
  });
  if (!v2Create.ok || !v2Create.value) {
    return { ok: false, error: v2Create.error };
  }

  const v2Validate = manager.validate(v2Create.value.versionId);
  if (!v2Validate.ok) return { ok: false, error: v2Validate.error };

  const snap2 = manager.createSnapshot(v2Create.value.versionId, {
    label: "academy-draft-v2",
  });
  if (!snap2.ok || !snap2.value) return { ok: false, error: snap2.error };

  const compare = manager.compareSnapshots(
    snap1.value.snapshotId,
    snap2.value.snapshotId
  );
  if (!compare.ok) return { ok: false, error: compare.error };

  manager.addApproval(v2Create.value.versionId, {
    kind: "technical",
    approverId: "platform.engineer",
  });
  manager.addApproval(v2Create.value.versionId, {
    kind: "organization",
    approverId: "academy.ceo",
  });
  const v2Approve = manager.promote(v2Create.value.versionId, "approved");
  if (!v2Approve.ok) return { ok: false, error: v2Approve.error };
  const v2Publish = manager.promote(v2Create.value.versionId, "published");
  if (!v2Publish.ok) return { ok: false, error: v2Publish.error };

  const lineage = manager.getLineage(org.id);
  const published = manager.getPublishedVersion(org.id);

  return {
    ok: true,
    version1: manager.getVersion(v1Create.value.versionId),
    version2: manager.getVersion(v2Create.value.versionId),
    snapshotCompare: compare.value,
    lineage,
    publishedVersionId: published?.versionId,
  };
}
