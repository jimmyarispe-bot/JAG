/**
 * Platform connector contract — every connector implements this interface.
 * No provider-specific assumptions.
 */

import type {
  AuthSession,
  ConnectorMetadata,
  HealthSnapshot,
  SyncRequest,
  SyncResult,
} from "@/lib/platform/integrations/types";

export interface PlatformConnector {
  readonly id: string;
  readonly version: string;
  readonly displayName: string;
  readonly provider: string;

  authenticate(instanceId: string): Promise<AuthSession>;
  refreshAuthentication(instanceId: string): Promise<AuthSession>;
  disconnect(instanceId: string): Promise<void>;
  validate(instanceId: string): Promise<{ ok: boolean; issues: string[] }>;
  sync(request: SyncRequest): Promise<SyncResult>;
  health(instanceId: string): Promise<HealthSnapshot>;
  metadata(): ConnectorMetadata;
}

export type PlatformConnectorFactory = () => PlatformConnector;
