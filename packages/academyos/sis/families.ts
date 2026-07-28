import { randomUUID } from "node:crypto";
import { projectAcademyEntityToTwin } from "../twin/project";
import { recordStudentTimeline } from "./audit";
import { emitSisEvent } from "./events";
import { getStudent, listFamilies, upsertFamily } from "./store";
import type { FamilyMember, FamilyRelationshipKind } from "./types";

export function createFamiliesService() {
  return {
    add(input: {
      organizationId: string;
      studentId: string;
      kind: FamilyRelationshipKind;
      firstName: string;
      lastName: string;
      email?: string | null;
      phone?: string | null;
      relationship: string;
      custodyFlag?: boolean;
      communicationPreference?: FamilyMember["communicationPreference"];
      financialResponsibility?: boolean;
      createdBy: string;
    }): FamilyMember | { error: string } {
      if (!getStudent(input.organizationId, input.studentId)) {
        return { error: "Student not found." };
      }
      if (!input.firstName.trim() || !input.lastName.trim()) {
        return { error: "First and last name are required." };
      }
      const now = new Date().toISOString();
      const id = randomUUID();
      const twinId = projectAcademyEntityToTwin({
        organizationId: input.organizationId,
        academyEntity: "Parent/Guardian",
        twinEntityType: "Person",
        id,
        label: `${input.firstName.trim()} ${input.lastName.trim()}`,
        kind: input.kind.toLowerCase().replace(/\s+/g, "_"),
        actor: input.createdBy,
        metadata: { studentId: input.studentId },
      });
      const member = upsertFamily({
        id,
        organizationId: input.organizationId,
        studentId: input.studentId,
        kind: input.kind,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        email: input.email ?? null,
        phone: input.phone ?? null,
        relationship: input.relationship.trim() || input.kind,
        custodyFlag: input.custodyFlag ?? false,
        communicationPreference: input.communicationPreference ?? "any",
        financialResponsibility: input.financialResponsibility ?? false,
        twinEntityId: twinId,
        createdAt: now,
        updatedAt: now,
      });
      recordStudentTimeline({
        organizationId: input.organizationId,
        studentId: input.studentId,
        kind: "family",
        message: `${input.kind} added: ${member.firstName} ${member.lastName}.`,
        actor: input.createdBy,
      });
      emitSisEvent({
        organizationId: input.organizationId,
        entityType: "FamilyMember",
        entityId: id,
        eventType: "family_added",
        actor: input.createdBy,
        metadata: { studentId: input.studentId, kind: input.kind },
      });
      return member;
    },

    list: listFamilies,

    patch(input: {
      organizationId: string;
      memberId: string;
      actor: string;
      custodyFlag?: boolean;
      communicationPreference?: FamilyMember["communicationPreference"];
      financialResponsibility?: boolean;
      email?: string | null;
      phone?: string | null;
    }): FamilyMember | null {
      const current = listFamilies(input.organizationId).find(
        (m) => m.id === input.memberId
      );
      if (!current) return null;
      return upsertFamily({
        ...current,
        custodyFlag: input.custodyFlag ?? current.custodyFlag,
        communicationPreference:
          input.communicationPreference ?? current.communicationPreference,
        financialResponsibility:
          input.financialResponsibility ?? current.financialResponsibility,
        email: input.email !== undefined ? input.email : current.email,
        phone: input.phone !== undefined ? input.phone : current.phone,
        updatedAt: new Date().toISOString(),
      });
    },
  };
}
