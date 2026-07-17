/**
 * Enterprise Integration Platform — connector contract.
 * Every connector implements this interface; no vendor-specific business logic required here.
 */

import type {
  AuthResult,
  ConnectorConfiguration,
  ConnectorHealthReport,
  ConnectorMetadata,
  ConnectorRuntimeState,
  NormalizedRecord,
  SyncRecord,
  SyncRequest,
  SyncResult,
  ValidationResult,
} from "@/lib/platform/integrations/common/types";

export interface Connector {
  readonly metadata: ConnectorMetadata;

  connect(config: ConnectorConfiguration): Promise<ConnectorRuntimeState>;
  disconnect(instanceId: string): Promise<ConnectorRuntimeState>;
  authenticate(instanceId: string): Promise<AuthResult>;
  refreshToken(instanceId: string): Promise<AuthResult>;
  sync(request: SyncRequest): Promise<SyncResult>;
  normalize(records: SyncRecord[], config: ConnectorConfiguration): Promise<NormalizedRecord[]>;
  validate(records: NormalizedRecord[]): Promise<ValidationResult>;
  healthCheck(instanceId: string): Promise<ConnectorHealthReport>;
  lastSync(instanceId: string): Promise<string | null>;
  status(instanceId: string): Promise<ConnectorRuntimeState>;
  configuration(instanceId: string): Promise<ConnectorConfiguration | null>;
  /** Static catalog metadata (same as metadata; exposed per contract). */
  getMetadata(): ConnectorMetadata;
}

export type ConnectorFactory = () => Connector;
