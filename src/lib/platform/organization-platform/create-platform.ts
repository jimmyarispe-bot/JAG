import { createIntegrationPlatform, registerAllConnectors } from "@/lib/platform/integrations";
import type { IntegrationPlatform } from "@/lib/platform/integrations";
import { resolveExecutiveTenantContext } from "./context/executive-context";
import { OrgIntegrationBridge } from "./integrations/org-connector-bridge";
import { resolveActor } from "./rbac";
import { seedDemoOrganizations } from "./seed";
import { OrganizationService, LocationService, UnitService } from "./services/hierarchy";
import {
  ApiCredentialService,
  SecretsService,
  SettingsService,
} from "./services/settings-secrets";
import { AuthService, SessionService, UserService } from "./services/users-auth";
import { OrganizationPlatformStore } from "./store";

export type OrganizationPlatform = {
  store: OrganizationPlatformStore;
  organizations: OrganizationService;
  locations: LocationService;
  units: UnitService;
  users: UserService;
  auth: AuthService;
  sessions: SessionService;
  settings: SettingsService;
  secrets: SecretsService;
  apiCredentials: ApiCredentialService;
  integrations: IntegrationPlatform;
  integrationBridge: OrgIntegrationBridge;
  resolveActor: (userId: string, organizationId: string) => ReturnType<typeof resolveActor>;
  resolveExecutiveTenantContext: (
    sessionId: string
  ) => ReturnType<typeof resolveExecutiveTenantContext>;
};

export type CreateOrganizationPlatformOptions = {
  /** When true, seed two isolated demo orgs. Default true for local foundation. */
  seedDemo?: boolean;
  /** Inject an existing Integration Platform (tests). */
  integrations?: IntegrationPlatform;
};

export function createOrganizationPlatform(
  options: CreateOrganizationPlatformOptions = {}
): OrganizationPlatform {
  const store = new OrganizationPlatformStore();
  const integrations =
    options.integrations ?? registerAllConnectors(createIntegrationPlatform());
  const integrationBridge = new OrgIntegrationBridge(integrations);

  const platform: OrganizationPlatform = {
    store,
    organizations: new OrganizationService(store),
    locations: new LocationService(store),
    units: new UnitService(store),
    users: new UserService(store),
    auth: new AuthService(store),
    sessions: new SessionService(store),
    settings: new SettingsService(store),
    secrets: new SecretsService(store),
    apiCredentials: new ApiCredentialService(store),
    integrations,
    integrationBridge,
    resolveActor: (userId, organizationId) => resolveActor(store, userId, organizationId),
    resolveExecutiveTenantContext(sessionId) {
      const session = platform.sessions.get(sessionId);
      if (!session) throw new Error("Session not found");
      const orgId = session.activeOrganizationId;
      const instanceIds = orgId
        ? integrationBridge.instanceIdsForOrganization(orgId)
        : [];
      return resolveExecutiveTenantContext(store, session, {
        integrationInstanceIds: instanceIds,
      });
    },
  };

  if (options.seedDemo !== false) {
    seedDemoOrganizations(store);
  }

  return platform;
}

/** Process-wide singleton for admin UI / ECC wiring in this process. */
let singleton: OrganizationPlatform | null = null;

export function getOrganizationPlatform(): OrganizationPlatform {
  if (!singleton) {
    singleton = createOrganizationPlatform({ seedDemo: true });
  }
  return singleton;
}

export function resetOrganizationPlatformForTests(): void {
  singleton = null;
}
