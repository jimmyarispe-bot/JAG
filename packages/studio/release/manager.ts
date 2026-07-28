import { randomUUID } from "node:crypto";
import { refreshCertification } from "../certification/engine";
import { getApprovalWorkflow } from "../governance/approvals";
import { createProductRegistryService } from "../products/registry";
import {
  evaluateReleaseGates,
  stageRank,
} from "../releases/gates";
import {
  getRelease,
  listReleases,
  upsertRelease,
} from "../store";
import type { ReleaseStatus, StudioProductId, StudioRelease } from "../types";
import { RELEASE_STATUSES } from "../types";

export function createReleaseManager() {
  const products = createProductRegistryService();

  return {
    list: listReleases,
    get: getRelease,

    create(input: {
      productId: StudioProductId;
      version: string;
      status?: ReleaseStatus;
      releaseNotes?: string;
      migrationHistory?: readonly string[];
      upgradePath?: readonly string[];
      compatibilityMatrix?: Readonly<Record<string, string>>;
      createdBy: string;
      skipGateCheck?: boolean;
    }): StudioRelease | { error: string } {
      if (!products.get(input.productId)) {
        return { error: "Unknown product." };
      }
      if (!input.version.trim()) return { error: "version is required." };
      const status = input.status ?? "Development";
      if (!(RELEASE_STATUSES as readonly string[]).includes(status)) {
        return { error: "Invalid release status." };
      }
      if (!input.skipGateCheck && stageRank(status) >= stageRank("RC-1")) {
        const gates = evaluateReleaseGates({
          productId: input.productId,
          targetStage: status,
        });
        if (!gates.passed) {
          return {
            error: `Release gates blocked ${status}: ${gates.blockers.join("; ")}`,
          };
        }
      }
      const now = new Date().toISOString();
      const release = upsertRelease({
        id: randomUUID(),
        productId: input.productId,
        version: input.version.trim(),
        status,
        releaseNotes: input.releaseNotes ?? "",
        migrationHistory: Object.freeze([...(input.migrationHistory ?? [])]),
        upgradePath: Object.freeze([...(input.upgradePath ?? [])]),
        compatibilityMatrix: Object.freeze({
          ...(input.compatibilityMatrix ?? {
            platform: "1.x",
            sdk: "1.x",
          }),
        }),
        createdAt: now,
        createdBy: input.createdBy,
        certifiedAt: status === "Certified" || status === "Released" ? now : null,
        releasedAt: status === "Released" ? now : null,
      });
      products.upsert({
        id: input.productId,
        version: release.version,
        releaseStatus: release.status,
      });
      refreshCertification(input.productId, {
        actor: input.createdBy,
        note: `Release ${release.version} created at ${status}`,
      });
      return release;
    },

    advance(input: {
      releaseId: string;
      status: ReleaseStatus;
      actor: string;
      note?: string;
      skipGateCheck?: boolean;
      requireApprovals?: boolean;
    }): StudioRelease | { error: string } | null {
      const current = getRelease(input.releaseId);
      if (!current) return null;
      if (!(RELEASE_STATUSES as readonly string[]).includes(input.status)) {
        return { error: "Invalid release status." };
      }

      if (!input.skipGateCheck) {
        const gates = evaluateReleaseGates({
          productId: current.productId,
          targetStage: input.status,
        });
        if (!gates.passed) {
          return {
            error: `Release gates blocked ${input.status}: ${gates.blockers.join("; ")}`,
          };
        }
      }

      if (
        input.requireApprovals ||
        input.status === "Certified" ||
        input.status === "Released"
      ) {
        const wf = getApprovalWorkflow({
          productId: current.productId,
          releaseId: current.id,
        });
        // Allow if all approved OR no decisions yet and skip not forced —
        // for Certified/Released require complete approval chain.
        if (
          (input.status === "Certified" || input.status === "Released") &&
          !wf.complete
        ) {
          return {
            error: wf.blocked
              ? "Approval workflow rejected — cannot certify/release."
              : `Approvals incomplete; next role: ${wf.nextRole ?? "unknown"}.`,
          };
        }
      }

      const now = new Date().toISOString();
      const notes =
        input.note != null && input.note.trim()
          ? `${current.releaseNotes}\n[${now}] ${input.actor}: ${input.note}`.trim()
          : current.releaseNotes;
      const updated = upsertRelease({
        ...current,
        status: input.status,
        releaseNotes: notes,
        certifiedAt:
          input.status === "Certified" || input.status === "Released"
            ? current.certifiedAt ?? now
            : current.certifiedAt,
        releasedAt:
          input.status === "Released" ? now : current.releasedAt,
      });
      products.upsert({
        id: current.productId,
        version: updated.version,
        releaseStatus: updated.status,
        certification:
          input.status === "Certified" || input.status === "Released"
            ? "Certified"
            : undefined,
      });
      refreshCertification(current.productId, {
        actor: input.actor,
        note: input.note ?? `Advanced to ${input.status}`,
      });
      return updated;
    },

    search(input: { productId?: StudioProductId; status?: ReleaseStatus; q?: string }) {
      const q = input.q?.trim().toLowerCase();
      return Object.freeze(
        listReleases(input.productId).filter((r) => {
          if (input.status && r.status !== input.status) return false;
          if (!q) return true;
          return (
            r.version.toLowerCase().includes(q) ||
            r.releaseNotes.toLowerCase().includes(q) ||
            r.productId.includes(q)
          );
        })
      );
    },

    evaluateGates(input: {
      productId: StudioProductId;
      targetStage: ReleaseStatus;
      root?: string;
    }) {
      return evaluateReleaseGates(input);
    },
  };
}
