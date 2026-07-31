/**
 * Pluggable mapping architecture — interfaces only.
 * Future connectors transform external payloads into evidence format.
 */

export type ExternalRecord = {
  readonly sourceSystem: string;
  readonly externalId: string;
  readonly payload: Readonly<Record<string, unknown>>;
};

export type MappedEvidenceDraft = {
  readonly name: string;
  readonly domain: string;
  readonly evidenceType: string;
  readonly source: string;
  readonly reportingPeriodLabel?: string;
  readonly metadata: Readonly<Record<string, string>>;
};

/**
 * Maps vendor-specific data into a common evidence draft
 * for the Evidence Processing Pipeline™.
 */
export interface ConnectorMappingInterface {
  readonly connectorId: string;
  mapToEvidence(record: ExternalRecord): MappedEvidenceDraft;
}

/** Registry of mapping modules — empty until production connectors ship. */
export type ConnectorMappingRegistry = {
  register(mapper: ConnectorMappingInterface): void;
  get(connectorId: string): ConnectorMappingInterface | undefined;
  list(): readonly ConnectorMappingInterface[];
};

export function createConnectorMappingRegistry(): ConnectorMappingRegistry {
  const map = new Map<string, ConnectorMappingInterface>();
  return {
    register(mapper) {
      map.set(mapper.connectorId, mapper);
    },
    get(connectorId) {
      return map.get(connectorId);
    },
    list() {
      return Object.freeze([...map.values()]);
    },
  };
}
