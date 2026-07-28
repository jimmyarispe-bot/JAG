import { randomUUID } from "node:crypto";
import { projectAcademyEntityToTwin } from "../twin/project";
import { emitWorkforceEvent } from "./events";
import {
  getEmployee,
  listCertifications,
  upsertCertification,
} from "./store";
import type { Certification, CertificationKind } from "./types";
import { CERTIFICATION_KINDS } from "./types";

function deriveStatus(
  expiresOn: string | null,
  asOf = new Date().toISOString().slice(0, 10)
): Certification["status"] {
  if (!expiresOn) return "Valid";
  if (expiresOn < asOf) return "Expired";
  const soon = new Date(`${asOf}T00:00:00.000Z`);
  soon.setUTCDate(soon.getUTCDate() + 60);
  if (expiresOn <= soon.toISOString().slice(0, 10)) return "Expiring Soon";
  return "Valid";
}

export function createCertificationService() {
  return {
    create(input: {
      organizationId: string;
      employeeId: string;
      kind: CertificationKind;
      name: string;
      issuedOn?: string | null;
      expiresOn?: string | null;
      createdBy: string;
    }): Certification | { error: string } {
      if (!getEmployee(input.organizationId, input.employeeId)) {
        return { error: "Employee not found." };
      }
      if (!(CERTIFICATION_KINDS as readonly string[]).includes(input.kind)) {
        return { error: "Invalid certification kind." };
      }
      if (!input.name.trim()) return { error: "name is required." };

      const now = new Date().toISOString();
      const id = randomUUID();
      const expiresOn = input.expiresOn?.slice(0, 10) ?? null;
      const twinId = projectAcademyEntityToTwin({
        organizationId: input.organizationId,
        academyEntity: "Certification",
        twinEntityType: "Document",
        id,
        label: input.name.trim(),
        kind: "certification",
        actor: input.createdBy,
      });

      const cert = upsertCertification({
        id,
        organizationId: input.organizationId,
        employeeId: input.employeeId,
        kind: input.kind,
        name: input.name.trim(),
        issuedOn: input.issuedOn?.slice(0, 10) ?? null,
        expiresOn,
        status: deriveStatus(expiresOn),
        twinEntityId: twinId,
        createdAt: now,
        updatedAt: now,
        createdBy: input.createdBy,
      });

      emitWorkforceEvent({
        organizationId: input.organizationId,
        entityType: "Certification",
        entityId: id,
        eventType: "certification_created",
        actor: input.createdBy,
        metadata: { employeeId: input.employeeId, kind: input.kind },
      });
      return cert;
    },

    list: listCertifications,

    renew(input: {
      organizationId: string;
      certificationId: string;
      expiresOn: string;
      actor: string;
    }): Certification | null {
      const current = listCertifications(input.organizationId).find(
        (c) => c.id === input.certificationId
      );
      if (!current) return null;
      const expiresOn = input.expiresOn.slice(0, 10);
      const next = upsertCertification({
        ...current,
        expiresOn,
        status: deriveStatus(expiresOn),
        updatedAt: new Date().toISOString(),
      });
      emitWorkforceEvent({
        organizationId: input.organizationId,
        entityType: "Certification",
        entityId: next.id,
        eventType: "certification_renewed",
        actor: input.actor,
      });
      return next;
    },

    expiringSoon(
      organizationId: string,
      asOf = new Date().toISOString().slice(0, 10)
    ) {
      return Object.freeze(
        listCertifications(organizationId)
          .map((c) =>
            upsertCertification({
              ...c,
              status: deriveStatus(c.expiresOn, asOf),
            })
          )
          .filter(
            (c) => c.status === "Expiring Soon" || c.status === "Expired"
          )
      );
    },
  };
}
