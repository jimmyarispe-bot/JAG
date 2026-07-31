/**
 * Package-local SIS entity contribution shapes.
 * Structurally compatible with EntityTypeDefinition; registration casts at the boundary.
 */

export type SisSearchableField = {
  readonly key: string;
  readonly label: string;
  readonly type: "string" | "number" | "date" | "enum" | "boolean";
  readonly filterable?: boolean;
  readonly sortable?: boolean;
};

export type SisEntityPermissionRule = {
  readonly action: string;
  readonly permission: string;
  readonly description?: string;
};

export type SisEntityTypeDefinition = {
  readonly entityType: string;
  readonly label: string;
  readonly applicationId: string | null;
  readonly capabilities: readonly string[];
  readonly searchable: {
    readonly fields: readonly SisSearchableField[];
    readonly defaultSort?: {
      readonly field: string;
      readonly direction: "asc" | "desc";
    };
  };
  readonly permissions: readonly SisEntityPermissionRule[];
  readonly metadataKeys?: readonly string[];
};
