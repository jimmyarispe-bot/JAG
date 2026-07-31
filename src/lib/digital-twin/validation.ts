/**
 * TwinValidation — structural integrity checks (deterministic).
 */

import {
  TWIN_ENTITY_TYPES,
  TWIN_RELATIONSHIP_TYPES,
  type TwinEntityType,
  type TwinRelationshipType,
} from "@/lib/digital-twin/types";
import {
  getTwinEntity,
  listTwinRelationships,
} from "@/lib/digital-twin/store";

export type TwinValidationResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly error: string };

export type TwinValidationService = {
  isEntityType(value: string): value is TwinEntityType;
  isRelationshipType(value: string): value is TwinRelationshipType;
  validateCreateEntity(input: {
    organizationId: string;
    entityType: string;
    label: string;
    externalKey: string;
  }): TwinValidationResult;
  validateRelationship(input: {
    organizationId: string;
    fromTwinId: string;
    toTwinId: string;
    relationshipType: string;
  }): TwinValidationResult;
  validateOrganizationIntegrity(organizationId: string): {
    readonly ok: boolean;
    readonly issues: readonly string[];
  };
};

export function createTwinValidationService(): TwinValidationService {
  return {
    isEntityType(value): value is TwinEntityType {
      return (TWIN_ENTITY_TYPES as readonly string[]).includes(value);
    },
    isRelationshipType(value): value is TwinRelationshipType {
      return (TWIN_RELATIONSHIP_TYPES as readonly string[]).includes(value);
    },
    validateCreateEntity(input) {
      if (!input.organizationId.trim()) {
        return { ok: false, error: "organizationId is required." };
      }
      if (!this.isEntityType(input.entityType)) {
        return { ok: false, error: "Invalid twin entity type." };
      }
      if (!input.label.trim()) {
        return { ok: false, error: "label is required." };
      }
      if (!input.externalKey.trim()) {
        return { ok: false, error: "externalKey is required." };
      }
      return { ok: true };
    },
    validateRelationship(input) {
      if (!this.isRelationshipType(input.relationshipType)) {
        return { ok: false, error: "Invalid twin relationship type." };
      }
      if (input.fromTwinId === input.toTwinId) {
        return { ok: false, error: "A twin cannot relate to itself." };
      }
      const from = getTwinEntity(input.organizationId, input.fromTwinId);
      const to = getTwinEntity(input.organizationId, input.toTwinId);
      if (!from || !to) {
        return {
          ok: false,
          error: "Both twin entities must exist in the organization.",
        };
      }
      return { ok: true };
    },
    validateOrganizationIntegrity(organizationId) {
      const issues: string[] = [];
      const rels = listTwinRelationships(organizationId);
      for (const r of rels) {
        if (!getTwinEntity(organizationId, r.fromTwinId)) {
          issues.push(`Orphan relationship ${r.id}: missing from twin.`);
        }
        if (!getTwinEntity(organizationId, r.toTwinId)) {
          issues.push(`Orphan relationship ${r.id}: missing to twin.`);
        }
      }
      return { ok: issues.length === 0, issues: Object.freeze(issues) };
    },
  };
}
