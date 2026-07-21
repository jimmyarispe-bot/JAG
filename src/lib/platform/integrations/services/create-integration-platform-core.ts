/**
 * Integration Platform Core composition root (Sprint 073).
 */

import { createAuthFramework, IntegrationAuthFramework } from "@/lib/platform/integrations/core/auth";
import { IntegrationCache } from "@/lib/platform/integrations/core/cache";
import { LifecycleManager } from "@/lib/platform/integrations/core/lifecycle";
import {
  createPlatformConnectorRegistry,
  PlatformConnectorRegistry,
} from "@/lib/platform/integrations/core/registry";
import { RateLimitRegistry } from "@/lib/platform/integrations/core/rate-limit";
import { createScheduler, IntegrationScheduler } from "@/lib/platform/integrations/core/scheduler";
import { createSyncEngine, IntegrationSyncEngine } from "@/lib/platform/integrations/core/sync";
import { TelemetryCollector } from "@/lib/platform/integrations/core/telemetry";
import { createWebhookProcessor, IntegrationWebhookProcessor } from "@/lib/platform/integrations/core/webhook";
import type { PlatformConnector } from "@/lib/platform/integrations/contracts";
import { createEventBus, IntegrationEventBus } from "@/lib/platform/integrations/events/bus";
import { createEventDispatcher, EventDispatcher } from "@/lib/platform/integrations/events/dispatcher";
import { createEventPublisher, EventPublisher } from "@/lib/platform/integrations/events/publisher";
import { createEventSubscriber, EventSubscriber } from "@/lib/platform/integrations/events/subscriber";
import {
  createGraphEntityBuilder,
  GraphEntityBuilder,
} from "@/lib/platform/integrations/graph/entity-builder";
import {
  createGraphRelationshipBuilder,
  GraphRelationshipBuilder,
} from "@/lib/platform/integrations/graph/relationship-builder";
import {
  createNormalizationPipeline,
  IntegrationNormalizationPipeline,
} from "@/lib/platform/integrations/normalization/pipeline";
import {
  createPlatformInfrastructureRegistry,
  INTEGRATIONS_PLATFORM_DESCRIPTOR,
  PlatformInfrastructureRegistry,
} from "@/lib/platform/integrations/services/platform-infrastructure";
import type {
  ConnectorPolicies,
  SyncMode,
  SyncRequest,
  SyncResult,
} from "@/lib/platform/integrations/types";
import { INTEGRATION_PLATFORM_VERSION } from "@/lib/platform/integrations/types";

export type CreateIntegrationPlatformCoreOptions = {
  registry?: PlatformConnectorRegistry;
  auth?: IntegrationAuthFramework;
  events?: IntegrationEventBus;
  lifecycle?: LifecycleManager;
  telemetry?: TelemetryCollector;
  policies?: Record<string, ConnectorPolicies>;
  now?: () => Date;
};

export type IntegrationPlatformCore = {
  readonly version: string;
  readonly descriptor: typeof INTEGRATIONS_PLATFORM_DESCRIPTOR;
  registry: PlatformConnectorRegistry;
  auth: IntegrationAuthFramework;
  sync: IntegrationSyncEngine;
  scheduler: IntegrationScheduler;
  webhooks: IntegrationWebhookProcessor;
  normalization: IntegrationNormalizationPipeline;
  events: IntegrationEventBus;
  publisher: EventPublisher;
  subscriber: EventSubscriber;
  dispatcher: EventDispatcher;
  lifecycle: LifecycleManager;
  telemetry: TelemetryCollector;
  rateLimits: RateLimitRegistry;
  cache: IntegrationCache;
  graphEntities: GraphEntityBuilder;
  graphRelationships: GraphRelationshipBuilder;
  infrastructure: PlatformInfrastructureRegistry;
  registerConnector: (connector: PlatformConnector) => void;
  syncNow: (
    connectorId: string,
    instanceId: string,
    mode?: SyncMode
  ) => Promise<SyncResult>;
  runDueSchedules: () => Promise<readonly SyncResult[]>;
};

export function createIntegrationPlatformCore(
  options: CreateIntegrationPlatformCoreOptions = {}
): IntegrationPlatformCore {
  const now = options.now ?? (() => new Date());
  const lifecycle = options.lifecycle ?? new LifecycleManager(now);
  const telemetry = options.telemetry ?? new TelemetryCollector(now);
  const rateLimits = new RateLimitRegistry();
  const registry = options.registry ?? createPlatformConnectorRegistry(now);
  const auth = options.auth ?? createAuthFramework();
  const events = options.events ?? createEventBus(now);
  const publisher = createEventPublisher(events);
  const subscriber = createEventSubscriber(events);
  const dispatcher = createEventDispatcher(events);
  const policies = options.policies ?? {};

  const sync = createSyncEngine({
    telemetry,
    lifecycle,
    rateLimits,
    policiesFor: (connectorId) => policies[connectorId] ?? {},
    now,
  });
  const scheduler = createScheduler(now);
  const webhooks = createWebhookProcessor(sync);
  const normalization = createNormalizationPipeline({ now });
  const cache = new IntegrationCache();
  const graphEntities = createGraphEntityBuilder();
  const graphRelationships = createGraphRelationshipBuilder();
  const infrastructure = createPlatformInfrastructureRegistry();
  infrastructure.assertIntegrationsIndependent();

  const platform: IntegrationPlatformCore = {
    version: INTEGRATION_PLATFORM_VERSION,
    descriptor: INTEGRATIONS_PLATFORM_DESCRIPTOR,
    registry,
    auth,
    sync,
    scheduler,
    webhooks,
    normalization,
    events,
    publisher,
    subscriber,
    dispatcher,
    lifecycle,
    telemetry,
    rateLimits,
    cache,
    graphEntities,
    graphRelationships,
    infrastructure,

    registerConnector(connector) {
      registry.register(connector);
    },

    async syncNow(connectorId, instanceId, mode = "manual") {
      const connector = registry.requireEnabled(connectorId);
      const request: SyncRequest = {
        connectorId,
        instanceId,
        mode,
        triggeredBy: "manual",
      };
      const result = await sync.run(connector, request);
      if (result.status === "failed") {
        await publisher.connectorFailed({
          connectorId,
          instanceId,
          error: result.error ?? "sync failed",
        });
      } else {
        await publisher.syncCompleted({
          connectorId,
          instanceId,
          recordsFetched: result.recordsFetched,
          mode: result.mode,
        });
      }
      return result;
    },

    async runDueSchedules() {
      const due = await scheduler.tick(now());
      const results: SyncResult[] = [];
      for (const request of due) {
        const connector = registry.get(request.connectorId);
        if (!connector || !registry.isEnabled(request.connectorId)) continue;
        const result = await sync.run(connector, request);
        results.push(result);
        if (result.status === "failed") {
          await publisher.connectorFailed({
            connectorId: request.connectorId,
            instanceId: request.instanceId,
            error: result.error ?? "scheduled sync failed",
          });
        } else {
          await publisher.syncCompleted({
            connectorId: request.connectorId,
            instanceId: request.instanceId,
            recordsFetched: result.recordsFetched,
            mode: result.mode,
          });
        }
      }
      return results;
    },
  };

  return platform;
}
