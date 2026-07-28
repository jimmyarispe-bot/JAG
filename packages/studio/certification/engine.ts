/**
 * Product Certification Engine — records, history, blockers, signed artifacts.
 */

import { randomUUID } from "node:crypto";
import {
  getApprovalWorkflow,
  listApprovals,
  type ApprovalRecord,
} from "../governance/approvals";
import { createProductRegistryService } from "../products/registry";
import {
  evaluateReleaseGates,
  type GateEvaluationReport,
} from "../releases/gates";
import { generateReleaseArtifacts } from "../releases/artifacts";
import type { ReleaseStatus, StudioProductId } from "../types";

export type CertificationHistoryEntry = {
  readonly at: string;
  readonly stage: ReleaseStatus;
  readonly actor: string;
  readonly note: string;
};

export type SignedArtifact = {
  readonly id: string;
  readonly name: string;
  readonly signedAt: string;
  readonly signedBy: string;
  readonly digest: string;
  readonly artifactId: string;
};

export type CertificationRecord = {
  readonly id: string;
  readonly productId: string;
  readonly currentVersion: string;
  readonly releaseStage: ReleaseStatus;
  readonly requiredGates: readonly string[];
  readonly outstandingBlockers: readonly string[];
  readonly certificationHistory: readonly CertificationHistoryEntry[];
  readonly signedArtifacts: readonly SignedArtifact[];
  readonly approvalHistory: readonly ApprovalRecord[];
  readonly lastGateReport: GateEvaluationReport | null;
  readonly updatedAt: string;
};

const g = globalThis as typeof globalThis & {
  __jagStudioCertifications?: Map<string, CertificationRecord>;
};

function certStore(): Map<string, CertificationRecord> {
  if (!g.__jagStudioCertifications) g.__jagStudioCertifications = new Map();
  return g.__jagStudioCertifications;
}

export function clearCertificationsForTests(): void {
  g.__jagStudioCertifications = new Map();
}

function digestFor(text: string): string {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return `sha1-lite:${(h >>> 0).toString(16)}`;
}

export function ensureCertificationRecord(
  productId: StudioProductId | string,
  root?: string,
  options?: { lightweight?: boolean }
): CertificationRecord {
  const existing = certStore().get(productId);
  if (existing) {
    if (options?.lightweight) return existing;
    return refreshCertification(productId, { root });
  }

  const product = createProductRegistryService().get(
    productId as StudioProductId
  );
  const now = new Date().toISOString();
  const gates = options?.lightweight
    ? null
    : evaluateReleaseGates({
        productId,
        targetStage: product?.releaseStatus ?? "Development",
        root,
      });
  const record: CertificationRecord = {
    id: `cert:${productId}`,
    productId,
    currentVersion: product?.version ?? "0.0.0",
    releaseStage: product?.releaseStatus ?? "Development",
    requiredGates: Object.freeze(
      gates ? gates.gates.filter((g) => g.required).map((g) => g.id) : []
    ),
    outstandingBlockers: Object.freeze(gates ? [...gates.blockers] : []),
    certificationHistory: Object.freeze([
      {
        at: now,
        stage: product?.releaseStatus ?? "Development",
        actor: "studio",
        note: options?.lightweight
          ? "Certification record created (deferred gate eval)"
          : "Certification record created",
      },
    ]),
    signedArtifacts: Object.freeze([]),
    approvalHistory: Object.freeze([...listApprovals({ productId })]),
    lastGateReport: gates,
    updatedAt: now,
  };
  certStore().set(productId, record);
  return record;
}

export function refreshCertification(
  productId: string,
  input?: { root?: string; actor?: string; note?: string }
): CertificationRecord {
  const product = createProductRegistryService().get(
    productId as StudioProductId
  );
  const prev = certStore().get(productId);
  const now = new Date().toISOString();
  const gates = evaluateReleaseGates({
    productId,
    targetStage: product?.releaseStatus ?? prev?.releaseStage ?? "Development",
    root: input?.root,
  });

  const history = [
    ...(prev?.certificationHistory ?? []),
  ];
  if (
    input?.note ||
    (prev && prev.releaseStage !== (product?.releaseStatus ?? prev.releaseStage))
  ) {
    history.push({
      at: now,
      stage: product?.releaseStatus ?? "Development",
      actor: input?.actor ?? "studio",
      note:
        input?.note ??
        `Stage sync → ${product?.releaseStatus ?? "Development"}`,
    });
  }

  const record: CertificationRecord = {
    id: prev?.id ?? `cert:${productId}`,
    productId,
    currentVersion: product?.version ?? prev?.currentVersion ?? "0.0.0",
    releaseStage: product?.releaseStatus ?? prev?.releaseStage ?? "Development",
    requiredGates: Object.freeze(
      gates.gates.filter((g) => g.required).map((g) => g.id)
    ),
    outstandingBlockers: Object.freeze([...gates.blockers]),
    certificationHistory: Object.freeze(history),
    signedArtifacts: Object.freeze([...(prev?.signedArtifacts ?? [])]),
    approvalHistory: Object.freeze([...listApprovals({ productId })]),
    lastGateReport: gates,
    updatedAt: now,
  };
  certStore().set(productId, record);
  return record;
}

export function signCertificationArtifact(input: {
  productId: string;
  signedBy: string;
  root?: string;
}): CertificationRecord | { error: string } {
  const cert = ensureCertificationRecord(input.productId, input.root);
  const artifacts = generateReleaseArtifacts({
    productId: input.productId,
    root: input.root,
  });
  if ("error" in artifacts) return artifacts;

  const signed: SignedArtifact = {
    id: randomUUID(),
    name: `release-package-${artifacts.version}`,
    signedAt: new Date().toISOString(),
    signedBy: input.signedBy,
    digest: digestFor(JSON.stringify(artifacts)),
    artifactId: artifacts.id,
  };

  const updated: CertificationRecord = {
    ...cert,
    signedArtifacts: Object.freeze([...cert.signedArtifacts, signed]),
    approvalHistory: Object.freeze([...listApprovals({ productId: input.productId })]),
    updatedAt: new Date().toISOString(),
  };
  certStore().set(input.productId, updated);

  const products = createProductRegistryService();
  if (cert.releaseStage === "Certified" || cert.releaseStage === "Released") {
    products.upsert({
      id: input.productId as StudioProductId,
      certification: "Certified",
    });
  } else if (cert.outstandingBlockers.length === 0) {
    products.upsert({
      id: input.productId as StudioProductId,
      certification: "Pending",
    });
  }

  return updated;
}

export function listCertifications(root?: string): readonly CertificationRecord[] {
  const products = createProductRegistryService().list();
  return Object.freeze(
    products.map((p) => ensureCertificationRecord(p.id, root))
  );
}

export function createCertificationEngine() {
  return {
    get: ensureCertificationRecord,
    refresh: refreshCertification,
    list: listCertifications,
    sign: signCertificationArtifact,
    workflow(productId: string, releaseId?: string) {
      return getApprovalWorkflow({ productId, releaseId });
    },
  };
}
