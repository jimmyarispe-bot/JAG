/**
 * EntityModel — declarative entity contribution (structurally EntityTypeDefinition-compatible).
 */

export type EntityModelCapability =
  | "timeline"
  | "notes"
  | "documents"
  | "attachments"
  | "tags"
  | "relationships"
  | "search"
  | "ownership"
  | "permissions";

export type EntityModelSearchField = {
  readonly key: string;
  readonly label: string;
  readonly type: "string" | "number" | "date" | "enum" | "boolean";
  readonly filterable?: boolean;
  readonly sortable?: boolean;
};

export type EntityModelPermission = {
  readonly action: string;
  readonly permission: string;
  readonly description?: string;
};

export type EntityModel = {
  readonly entityType: string;
  readonly label: string;
  readonly applicationId: string | null;
  readonly capabilities: readonly EntityModelCapability[];
  readonly searchable: {
    readonly fields: readonly EntityModelSearchField[];
    readonly defaultSort?: {
      readonly field: string;
      readonly direction: "asc" | "desc";
    };
  };
  readonly permissions: readonly EntityModelPermission[];
  readonly metadataKeys?: readonly string[];
};
