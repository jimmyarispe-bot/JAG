export interface RuntimeMemoryReference {
  entryId: string;
  kind?: string;
  writtenAt: string;
  attributes?: Readonly<Record<string, unknown>>;
}
