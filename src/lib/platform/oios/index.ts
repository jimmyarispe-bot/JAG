export * from "@/lib/platform/oios/types";
export type * from "@/lib/platform/oios/contracts";
export * from "@/lib/platform/oios/models";
export { IntelligenceDomainRegistry } from "@/lib/platform/oios/intelligence-domain-registry";
export { OiosEngine } from "@/lib/platform/oios/oios-engine";
export { OiosService } from "@/lib/platform/oios/service";
export { OrganizationOperatingSystem } from "@/lib/platform/oios/organization-operating-system";
export { OiosRepository } from "@/lib/platform/oios/repository";
export { OrganizationalDigitalTwin } from "@/lib/platform/oios/organizational-digital-twin";
export { OrganizationalLifecycle } from "@/lib/platform/oios/organizational-lifecycle";
export { OrganizationalStateEngine } from "@/lib/platform/oios/organizational-state-engine";
export { OrganizationalContext } from "@/lib/platform/oios/organizational-context";
export { OrganizationalMemory } from "@/lib/platform/oios/organizational-memory";
export { OrganizationalKnowledgeGraph } from "@/lib/platform/oios/organizational-knowledge-graph";
export { OrganizationCapabilitiesRegistry } from "@/lib/platform/oios/organization-capabilities-registry";
export { OrganizationImprovementEngine } from "@/lib/platform/oios/organization-improvement-engine";
export { ContinuousImprovementLoop } from "@/lib/platform/oios/continuous-improvement-loop";
export { OrganizationalHealthIndex } from "@/lib/platform/oios/organizational-health-index";
export { OrganizationMaturityModel } from "@/lib/platform/oios/organization-maturity-model";
export { OrganizationScorecard } from "@/lib/platform/oios/organization-scorecard";
export { OrganizationBenchmarking } from "@/lib/platform/oios/organization-benchmarking";
export { OrganizationObjectives } from "@/lib/platform/oios/organization-objectives";
export { OrganizationStrategy } from "@/lib/platform/oios/organization-strategy";
export { OrganizationExecutionModel } from "@/lib/platform/oios/organization-execution-model";
export { OrganizationOperatingModel } from "@/lib/platform/oios/organization-operating-model";
export { OrganizationConfiguration } from "@/lib/platform/oios/organization-configuration";
export { OrganizationPolicies } from "@/lib/platform/oios/organization-policies";
export { OrganizationStandards } from "@/lib/platform/oios/organization-standards";
export { OrganizationGovernanceModel } from "@/lib/platform/oios/organization-governance-model";
import type { OiosDependencies } from "@/lib/platform/oios/contracts";
import { OiosEngine } from "@/lib/platform/oios/oios-engine";
import { OiosRepository } from "@/lib/platform/oios/repository";
import { OrganizationOperatingSystem } from "@/lib/platform/oios/organization-operating-system";
import { OiosService } from "@/lib/platform/oios/service";
import {
  createOrganizationDnaIntelligence,
  type CreateOrganizationDnaOptions,
  type OrganizationDnaStack,
} from "@/lib/platform/intelligence/organization-dna";
import type { OiosRequest } from "@/lib/platform/oios/types";
import {
  createIntegrationPlatformCore,
  createPlatformInfrastructureRegistry,
  INTEGRATIONS_PLATFORM_DESCRIPTOR,
  type CreateIntegrationPlatformCoreOptions,
  type IntegrationPlatformCore,
  type PlatformInfrastructureRegistry,
} from "@/lib/platform/integrations/services";
import { registerGoogleWorkspacePlatformConnector } from "@/lib/platform/integrations/connectors/google-workspace/registry";
import { registerMicrosoft365PlatformConnector } from "@/lib/platform/integrations/connectors/microsoft-365/registry";
import { registerCollaborationPlatformConnectors } from "@/lib/platform/integrations/connectors/collaboration/registry";
import { registerFinancePlatformConnectors } from "@/lib/platform/integrations/connectors/finance/registry";
import { registerEnterprisePlatformConnectors } from "@/lib/platform/integrations/connectors/enterprise/registry";
import { registerHrPlatformConnectors } from "@/lib/platform/integrations/connectors/hr/registry";
import { registerCrmPlatformConnectors } from "@/lib/platform/integrations/connectors/crm/registry";
import { registerEducationPlatformConnectors } from "@/lib/platform/integrations/connectors/education/registry";

export interface OiosStack {
  service: OiosService;
  engine: OiosEngine;
  registry: OiosEngine["registry"];
  operatingSystem: OrganizationOperatingSystem;
  organizationDna: OrganizationDnaStack | null;
  /**
   * Platform infrastructure pillars (Intelligence, Integrations, Security,
   * Identity, Observability). Integrations is registered here — not on the
   * intelligence DAG.
   */
  platformInfrastructure: PlatformInfrastructureRegistry;
  /** Sprint 073 Integration Platform Core (optional wiring). */
  integrations: IntegrationPlatformCore | null;
  integrationsDescriptor: typeof INTEGRATIONS_PLATFORM_DESCRIPTOR;
}
export interface CreateOiosOptions extends OiosDependencies {
  organizationDnaStack?: OrganizationDnaStack;
  organizationDnaOptions?: CreateOrganizationDnaOptions;
  wireOrganizationDna?: boolean;
  /** When false, skip creating Integration Platform Core. Default true. */
  wireIntegrations?: boolean;
  integrationsOptions?: CreateIntegrationPlatformCoreOptions;
  integrationsCore?: IntegrationPlatformCore;
}
export function createOiosOperatingSystem(options: CreateOiosOptions = {}): OiosStack {
  const organizationDna = options.organizationDnaStack ?? (options.wireOrganizationDna !== false ? createOrganizationDnaIntelligence(options.organizationDnaOptions ?? {}) : null);
  const repository = options.repository ?? new OiosRepository();
  const organizationDnaCallback = options.organizationDna ?? (organizationDna ? (request: OiosRequest) => organizationDna.service.build({ requestId: request.requestId, seed: request.dnaSeed, scope: request.scope ?? { organizationId: null, schoolId: null } }) : null);
  const engine = new OiosEngine({ ...options, repository, organizationDna: organizationDnaCallback });
  const operatingSystem = new OrganizationOperatingSystem(engine);
  const platformInfrastructure = createPlatformInfrastructureRegistry();
  platformInfrastructure.assertIntegrationsIndependent();
  const integrations =
    options.integrationsCore ??
    (options.wireIntegrations !== false
      ? createIntegrationPlatformCore(options.integrationsOptions)
      : null);
  if (integrations && options.wireIntegrations !== false) {
    registerGoogleWorkspacePlatformConnector(integrations);
    registerMicrosoft365PlatformConnector(integrations);
    registerCollaborationPlatformConnectors(integrations);
    registerFinancePlatformConnectors(integrations);
    registerEnterprisePlatformConnectors(integrations);
    registerHrPlatformConnectors(integrations);
    registerCrmPlatformConnectors(integrations);
    registerEducationPlatformConnectors(integrations);
  }
  return {
    service: new OiosService(operatingSystem, repository),
    engine,
    registry: engine.registry,
    operatingSystem,
    organizationDna,
    platformInfrastructure,
    integrations,
    integrationsDescriptor: INTEGRATIONS_PLATFORM_DESCRIPTOR,
  };
}
