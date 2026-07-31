/**
 * Package-local Scheduling entity contribution shapes.
 * Structurally compatible with EntityTypeDefinition; registration casts at the boundary.
 */

export type SchedulingSearchableField = {
  readonly key: string;
  readonly label: string;
  readonly type: "string" | "number" | "date" | "enum" | "boolean";
  readonly filterable?: boolean;
  readonly sortable?: boolean;
};

export type SchedulingEntityPermissionRule = {
  readonly action: string;
  readonly permission: string;
  readonly description?: string;
};

export type SchedulingEntityTypeDefinition = {
  readonly entityType: string;
  readonly label: string;
  readonly applicationId: string | null;
  readonly capabilities: readonly string[];
  readonly searchable: {
    readonly fields: readonly SchedulingSearchableField[];
    readonly defaultSort?: {
      readonly field: string;
      readonly direction: "asc" | "desc";
    };
  };
  readonly permissions: readonly SchedulingEntityPermissionRule[];
  readonly metadataKeys?: readonly string[];
};
