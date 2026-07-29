export interface RuntimeTwinReference {
  publicationId: string;
  entityType?: string;
  entityId?: string;
  publishedAt: string;
  attributes?: Readonly<Record<string, unknown>>;
}
