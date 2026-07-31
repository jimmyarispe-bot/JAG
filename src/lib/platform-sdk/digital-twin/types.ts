/** Digital Twin SDK — canonical interfaces for every future entity type. */

export type TwinEntityDescriptor = {
  readonly id: string;
  readonly organizationId: string;
  readonly entityType: string;
  readonly label: string;
  readonly status: "Active" | "Archived";
  readonly externalKey: string;
  readonly metadata: Readonly<Record<string, string>>;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type TwinRelationshipDescriptor = {
  readonly id: string;
  readonly organizationId: string;
  readonly fromTwinId: string;
  readonly toTwinId: string;
  readonly relationshipType: string;
  readonly metadata: Readonly<Record<string, string>>;
  readonly createdAt: string;
};

export type TwinValidationResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly error: string; readonly fieldErrors?: Readonly<Record<string, string>> };

export type TwinMetricsDescriptor = {
  readonly organizationId: string;
  readonly entityCount: number;
  readonly relationshipCount: number;
  readonly activeCount: number;
  readonly archivedCount: number;
  readonly lastUpdatedAt: string | null;
};

export interface TwinEntity {
  describe(): TwinEntityDescriptor;
  validate(): TwinValidationResult;
}

export interface TwinRelationship {
  describe(): TwinRelationshipDescriptor;
  validate(): TwinValidationResult;
}

export interface TwinLifecycle {
  activate(entityId: string): TwinValidationResult;
  archive(entityId: string): TwinValidationResult;
  restore(entityId: string): TwinValidationResult;
}

export interface TwinValidation {
  validateEntity(entity: TwinEntityDescriptor): TwinValidationResult;
  validateRelationship(
    relationship: TwinRelationshipDescriptor
  ): TwinValidationResult;
  validateIntegrity(organizationId: string): TwinValidationResult;
}

export interface TwinMetrics {
  snapshot(organizationId: string): TwinMetricsDescriptor;
}

export type TwinEntityTypeRegistration = {
  readonly entityType: string;
  readonly version: string;
  readonly description: string;
  readonly registeredAt: string;
};
