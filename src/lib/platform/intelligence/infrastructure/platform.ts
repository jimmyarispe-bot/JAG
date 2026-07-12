/**
 * Intelligence Platform Infrastructure — platform façade + DI factory (Sprint 027).
 */

import type {
  IntelligenceCache,
  IntelligenceConfiguration,
  IntelligenceDiagnostics,
  IntelligenceEvents,
  IntelligenceHealth,
  IntelligenceLifecycle,
  IntelligenceMetrics,
  IntelligencePipeline,
  IntelligencePlatformClock,
  IntelligencePlatformDependencies,
  IntelligenceProvider,
  IntelligenceRegistry,
  IntelligenceScheduler,
  IntelligenceTelemetry,
  IntelligenceVersioning,
} from "@/lib/platform/intelligence/infrastructure/contracts";
import type {
  IntelligenceDiagnosticsReport,
  IntelligenceExecutionRequest,
  IntelligencePipelineResult,
  IntelligencePlatformHealth,
} from "@/lib/platform/intelligence/infrastructure/types";
import { INTELLIGENCE_PLATFORM_VERSION } from "@/lib/platform/intelligence/infrastructure/types";
import { createDefaultClock } from "@/lib/platform/intelligence/infrastructure/clock";
import { createIntelligenceCache } from "@/lib/platform/intelligence/infrastructure/cache";
import { createIntelligenceConfiguration } from "@/lib/platform/intelligence/infrastructure/configuration";
import { createIntelligenceDiagnostics } from "@/lib/platform/intelligence/infrastructure/diagnostics";
import { createIntelligenceEvents } from "@/lib/platform/intelligence/infrastructure/events";
import { createExecutionContext } from "@/lib/platform/intelligence/infrastructure/execution-context";
import { createIntelligenceHealth } from "@/lib/platform/intelligence/infrastructure/health";
import { createIntelligenceLifecycle } from "@/lib/platform/intelligence/infrastructure/lifecycle";
import { createIntelligenceMetrics } from "@/lib/platform/intelligence/infrastructure/metrics";
import { createDefaultIntelligenceProvider } from "@/lib/platform/intelligence/infrastructure/modules";
import { createIntelligencePipeline } from "@/lib/platform/intelligence/infrastructure/pipeline";
import {
  createIntelligenceProvider,
  registerProviders,
} from "@/lib/platform/intelligence/infrastructure/provider";
import { createIntelligenceRegistry } from "@/lib/platform/intelligence/infrastructure/registry";
import { createIntelligenceScheduler } from "@/lib/platform/intelligence/infrastructure/scheduler";
import { createIntelligenceTelemetry } from "@/lib/platform/intelligence/infrastructure/telemetry";
import { createIntelligenceVersioning } from "@/lib/platform/intelligence/infrastructure/versioning";
import type {
  CreateExecutiveDecisionOptions,
  ExecutiveDecisionStack,
} from "@/lib/platform/intelligence/executive-decision";
import type {
  CreateExecutiveGraphAnalyzerOptions,
  ExecutiveGraphAnalyzerStack,
} from "@/lib/platform/intelligence/executive-graph";
import type {
  CreatePredictiveIntelligenceOptions,
  PredictiveIntelligenceStack,
} from "@/lib/platform/intelligence/predictive-intelligence";
import type {
  CreateBoardGovernanceOptions,
  BoardGovernanceStack,
} from "@/lib/platform/intelligence/board-governance";
import type {
  CreateOrganizationDnaOptions,
  OrganizationDnaStack,
} from "@/lib/platform/intelligence/organization-dna";
import type {
  CreateOiosOptions,
  OiosStack,
} from "@/lib/platform/oios";
import type {
  CreateHumanCapitalOptions,
  HumanCapitalStack,
} from "@/lib/platform/intelligence/human-capital";
import type {
  CreateRevenueOptions,
  RevenueStack,
} from "@/lib/platform/intelligence/revenue";
import type {
  CreateFundingOptions,
  FundingStack,
} from "@/lib/platform/intelligence/funding";
import type {
  CreateOpportunityOptions,
  OpportunityStack,
} from "@/lib/platform/intelligence/opportunity";
import type {
  CreateImprovementOptions,
  ImprovementStack,
} from "@/lib/platform/intelligence/organizational-improvement";
import type {
  CreateBusinessModelOptions,
  BusinessModelStack,
} from "@/lib/platform/intelligence/business-model";

/** Fully wired Intelligence Platform Infrastructure stack. */
export interface IntelligencePlatformStack {
  version: string;
  clock: IntelligencePlatformClock;
  registry: IntelligenceRegistry;
  pipeline: IntelligencePipeline;
  cache: IntelligenceCache;
  metrics: IntelligenceMetrics;
  telemetry: IntelligenceTelemetry;
  events: IntelligenceEvents;
  lifecycle: IntelligenceLifecycle;
  scheduler: IntelligenceScheduler;
  configuration: IntelligenceConfiguration;
  health: IntelligenceHealth;
  diagnostics: IntelligenceDiagnostics;
  versioning: IntelligenceVersioning;
  providers: IntelligenceProvider[];
  run: (request?: IntelligenceExecutionRequest) => Promise<IntelligencePipelineResult>;
  checkHealth: () => Promise<IntelligencePlatformHealth>;
  collectDiagnostics: () => Promise<IntelligenceDiagnosticsReport>;
  initialize: () => Promise<void>;
  shutdown: () => Promise<void>;
}

export interface CreateIntelligencePlatformOptions
  extends IntelligencePlatformDependencies {
  graphAnalyzerOptions?: CreateExecutiveGraphAnalyzerOptions;
  graphAnalyzer?: ExecutiveGraphAnalyzerStack;
  decisionOptions?: CreateExecutiveDecisionOptions;
  decision?: ExecutiveDecisionStack;
  predictiveOptions?: CreatePredictiveIntelligenceOptions;
  predictive?: PredictiveIntelligenceStack;
  boardGovernanceOptions?: CreateBoardGovernanceOptions;
  boardGovernance?: BoardGovernanceStack;
  organizationDnaOptions?: CreateOrganizationDnaOptions;
  organizationDna?: OrganizationDnaStack;
  oiosOptions?: CreateOiosOptions;
  oios?: OiosStack;
  humanCapitalOptions?: CreateHumanCapitalOptions;
  humanCapital?: HumanCapitalStack;
  revenueOptions?: CreateRevenueOptions;
  revenue?: RevenueStack;
  fundingOptions?: CreateFundingOptions;
  funding?: FundingStack;
  opportunityOptions?: CreateOpportunityOptions;
  opportunity?: OpportunityStack;
  organizationalImprovementOptions?: CreateImprovementOptions;
  organizationalImprovement?: ImprovementStack;
  businessModelOptions?: CreateBusinessModelOptions;
  businessModel?: BusinessModelStack;
}

/**
 * Create a fully wired Intelligence Platform Infrastructure stack (DI entry point).
 */
export function createIntelligencePlatform(
  options: CreateIntelligencePlatformOptions = {}
): IntelligencePlatformStack {
  const clock = options.clock ?? createDefaultClock();
  const registry = options.registry ?? createIntelligenceRegistry();
  const cache = options.cache ?? createIntelligenceCache();
  const metrics = options.metrics ?? createIntelligenceMetrics(clock);
  const telemetry = options.telemetry ?? createIntelligenceTelemetry(clock);
  const events = options.events ?? createIntelligenceEvents(telemetry);
  const configuration =
    options.configuration ??
    createIntelligenceConfiguration({ clock, telemetry });
  const versioning = options.versioning ?? createIntelligenceVersioning(clock);
  const lifecycle =
    options.lifecycle ??
    createIntelligenceLifecycle({ registry, telemetry });
  const scheduler =
    options.scheduler ??
    createIntelligenceScheduler({ clock, telemetry });
  const health =
    options.health ??
    createIntelligenceHealth({ registry, lifecycle, telemetry });
  const diagnostics =
    options.diagnostics ??
    createIntelligenceDiagnostics({
      health,
      versioning,
      metrics,
      telemetry,
      cache,
      configuration,
    });
  const pipeline =
    options.pipeline ??
    createIntelligencePipeline({
      registry,
      clock,
      cache,
      metrics,
      telemetry,
      lifecycle,
      configuration,
    });

  const providers =
    options.providers ??
    (options.registerDefaults === false
      ? []
      : [
          createDefaultIntelligenceProvider({
            graphAnalyzer: options.graphAnalyzer,
            graphAnalyzerOptions: options.graphAnalyzerOptions,
            decision: options.decision,
            decisionOptions: options.decisionOptions,
            predictive: options.predictive,
            predictiveOptions: options.predictiveOptions,
            boardGovernance: options.boardGovernance,
            boardGovernanceOptions: options.boardGovernanceOptions,
            organizationDna: options.organizationDna,
            organizationDnaOptions: options.organizationDnaOptions,
            oios: options.oios,
            oiosOptions: options.oiosOptions,
            humanCapital: options.humanCapital,
            humanCapitalOptions: options.humanCapitalOptions,
            revenue: options.revenue,
            revenueOptions: options.revenueOptions,
            funding: options.funding,
            fundingOptions: options.fundingOptions,
            opportunity: options.opportunity,
            opportunityOptions: options.opportunityOptions,
            organizationalImprovement: options.organizationalImprovement,
            organizationalImprovementOptions: options.organizationalImprovementOptions,
            businessModel: options.businessModel,
            businessModelOptions: options.businessModelOptions,
          }),
        ]);

  registerProviders(registry, providers, {
    versioning,
    telemetry,
    skipDuplicates: true,
  });

  const stack: IntelligencePlatformStack = {
    version: INTELLIGENCE_PLATFORM_VERSION,
    clock,
    registry,
    pipeline,
    cache,
    metrics,
    telemetry,
    events,
    lifecycle,
    scheduler,
    configuration,
    health,
    diagnostics,
    versioning,
    providers,
    run: (request) => pipeline.run(request),
    checkHealth: () => health.checkAll(),
    collectDiagnostics: () => diagnostics.collect(),
    async initialize() {
      const context = createExecutionContext({}, clock);
      await lifecycle.initializeAll(context);
    },
    async shutdown() {
      await lifecycle.shutdownAll();
    },
  };

  return stack;
}

export { createIntelligenceProvider, registerProviders };
