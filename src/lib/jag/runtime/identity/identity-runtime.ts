import type { RuntimeContext, RuntimeIdentity, RuntimePipelineStage } from "../contracts";
import { RuntimeAuthorizationError } from "../errors";
import type { RuntimeEventBus } from "../events";
import { RUNTIME_PIPELINE_STAGE_ORDER } from "../types/stages";
import {
  assertDelegationActive,
  createMemoryDelegationResolver,
  isImpersonationContract,
} from "./delegation";
import {
  IDENTITY_EVENT_TYPES,
  type DelegationGrantedPayload,
  type DelegationRevokedPayload,
  type IdentityResolvedPayload,
  type IdentityResolutionFailedPayload,
  type OrganizationChangedPayload,
  type PermissionResolvedPayload,
} from "./identity-events";
import type { IdentityProvider } from "./identity-provider";
import { createIdentityRegistry, type IdentityRegistry } from "./identity-registry";
import type {
  DelegationContract,
  DelegationResolver,
  IdentityResolutionOutcome,
  IdentityResolutionRequest,
  IdentityResolver,
  OrganizationResolver,
  PermissionResolver,
  PrincipalRecord,
  ResolvedIdentity,
} from "./identity-types";
import { createOrganizationResolver } from "./organization-scope";
import { createPermissionResolver } from "./permission-resolver";

export interface IdentityRuntimeOptions {
  events?: RuntimeEventBus;
  providers?: IdentityRegistry;
  /** Extra provider source (e.g. RuntimeRegistry.listIdentityProviders). */
  listProviders?: () => readonly IdentityProvider[];
  organizations?: OrganizationResolver;
  permissions?: PermissionResolver;
  delegations?: DelegationResolver;
  /** Cache TTL in ms; 0 disables. Default 5_000. */
  cacheTtlMs?: number;
}

export interface IdentityRuntime extends IdentityResolver {
  readonly providers: IdentityRegistry;
  readonly delegations: DelegationResolver;
  resolve(request: IdentityResolutionRequest): Promise<IdentityResolutionOutcome>;
  /** Resolve or throw — used by the Identity pipeline stage. */
  resolveOrThrow(request: IdentityResolutionRequest): Promise<ResolvedIdentity>;
  authorize(identity: RuntimeIdentity, permission: string): boolean;
  switchOrganization(
    identity: RuntimeIdentity,
    organizationId: string
  ): Promise<ResolvedIdentity>;
  /**
   * Impersonation only via an explicit DelegationContract (kind=impersonation).
   * Creates/stores the contract then re-resolves.
   */
  beginImpersonation(input: {
    actor: RuntimeIdentity;
    targetUserId: string;
    reason: string;
    scope: readonly string[];
    expiresAt: string;
    delegationId?: string;
    sessionRef?: string;
  }): Promise<ResolvedIdentity>;
  endImpersonation(
    identity: RuntimeIdentity,
    request?: Pick<IdentityResolutionRequest, "sessionRef" | "principalId">
  ): Promise<ResolvedIdentity>;
  grantDelegation(
    contract: Omit<DelegationContract, "grantedAt" | "revokedAt"> & {
      grantedAt?: string;
    }
  ): Promise<DelegationContract>;
  revokeDelegation(id: string, reason?: string): Promise<DelegationContract | null>;
  clearCache(): void;
  createPipelineStage(): RuntimePipelineStage;
}

interface CacheEntry {
  value: ResolvedIdentity;
  expiresAtMs: number;
}

export function createIdentityRuntime(
  options: IdentityRuntimeOptions = {}
): IdentityRuntime {
  return new IdentityRuntimeImpl(options);
}

class IdentityRuntimeImpl implements IdentityRuntime {
  readonly providers: IdentityRegistry;
  readonly delegations: DelegationResolver;
  private readonly events?: RuntimeEventBus;
  private readonly listProviders?: () => readonly IdentityProvider[];
  private readonly organizations: OrganizationResolver;
  private readonly permissions: PermissionResolver;
  private readonly cacheTtlMs: number;
  private readonly cache = new Map<string, CacheEntry>();

  constructor(options: IdentityRuntimeOptions) {
    this.providers = options.providers ?? createIdentityRegistry();
    this.delegations = options.delegations ?? createMemoryDelegationResolver();
    this.events = options.events;
    this.listProviders = options.listProviders;
    this.organizations = options.organizations ?? createOrganizationResolver();
    this.permissions = options.permissions ?? createPermissionResolver();
    this.cacheTtlMs = options.cacheTtlMs ?? 5_000;
  }

  async resolve(
    request: IdentityResolutionRequest
  ): Promise<IdentityResolutionOutcome> {
    try {
      const value = await this.resolveInternal(request);
      return { status: "resolved", value };
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : "Identity resolution failed";
      const code =
        error instanceof RuntimeAuthorizationError
          ? error.code
          : "IDENTITY_RESOLUTION_FAILED";
      await this.publishFailed({
        reason,
        code,
        principalId: request.principalId,
      });
      if (
        error instanceof RuntimeAuthorizationError &&
        (error.code === "UNAUTHENTICATED" || error.code === "IDENTITY_PROVIDER_MISS")
      ) {
        return { status: "unauthenticated", reason };
      }
      throw error;
    }
  }

  async resolveOrThrow(
    request: IdentityResolutionRequest
  ): Promise<ResolvedIdentity> {
    const outcome = await this.resolve(request);
    if (outcome.status !== "resolved") {
      throw new RuntimeAuthorizationError(outcome.reason, {
        code: "UNAUTHENTICATED",
        stageId: "identity",
      });
    }
    return outcome.value;
  }

  authorize(identity: RuntimeIdentity, permission: string): boolean {
    return this.permissions.authorize(identity.permissions, permission);
  }

  async switchOrganization(
    identity: RuntimeIdentity,
    organizationId: string
  ): Promise<ResolvedIdentity> {
    if (
      !this.organizations.assertMembership(
        identity.orgAssignments,
        organizationId
      )
    ) {
      throw new RuntimeAuthorizationError(
        `Not a member of organization: ${organizationId}`,
        {
          code: "ORG_MEMBERSHIP_DENIED",
          stageId: "identity",
          details: { organizationId },
        }
      );
    }

    const from = identity.activeOrganizationId;
    const resolved = await this.resolveOrThrow({
      principalId: identity.principalId,
      sessionRef: identity.attributes?.sessionRef as string | undefined,
      activeOrganizationId: organizationId,
      delegationId: identity.attributes?.delegationId as string | undefined,
      attributes: identity.attributes,
    });

    await this.publishOrganizationChanged({
      principalId: identity.principalId,
      fromOrganizationId: from,
      toOrganizationId: organizationId,
    });

    return resolved;
  }

  async beginImpersonation(input: {
    actor: RuntimeIdentity;
    targetUserId: string;
    reason: string;
    scope: readonly string[];
    expiresAt: string;
    delegationId?: string;
    sessionRef?: string;
  }): Promise<ResolvedIdentity> {
    const id =
      input.delegationId ??
      `imp_${input.actor.effectiveUserId}_${input.targetUserId}_${Date.now().toString(36)}`;

    const contract = await this.grantDelegation({
      id,
      fromUserId: input.actor.effectiveUserId,
      toUserId: input.actor.principalId,
      targetUserId: input.targetUserId,
      kind: "impersonation",
      scope: input.scope,
      expiresAt: input.expiresAt,
      reason: input.reason,
      organizationIds: [input.actor.activeOrganizationId],
    });

    return this.resolveOrThrow({
      principalId: input.actor.principalId,
      sessionRef: input.sessionRef,
      activeOrganizationId: input.actor.activeOrganizationId,
      delegationId: contract.id,
      attributes: input.actor.attributes,
    });
  }

  async endImpersonation(
    identity: RuntimeIdentity,
    request: Pick<IdentityResolutionRequest, "sessionRef" | "principalId"> = {}
  ): Promise<ResolvedIdentity> {
    const delegationId = identity.attributes?.delegationId;
    if (typeof delegationId === "string") {
      await this.revokeDelegation(delegationId, "end_impersonation");
    }
    this.clearCache();
    return this.resolveOrThrow({
      principalId: request.principalId ?? identity.principalId,
      sessionRef: request.sessionRef,
      activeOrganizationId: identity.activeOrganizationId,
      attributes: {
        ...(identity.attributes ?? {}),
        delegationId: undefined,
      },
    });
  }

  async grantDelegation(
    contract: Omit<DelegationContract, "grantedAt" | "revokedAt"> & {
      grantedAt?: string;
    }
  ): Promise<DelegationContract> {
    const granted = await this.delegations.grant(contract);
    this.clearCache();
    const payload: DelegationGrantedPayload = {
      delegationId: granted.id,
      kind: granted.kind,
      fromUserId: granted.fromUserId,
      toUserId: granted.toUserId,
      targetUserId: granted.targetUserId,
      expiresAt: granted.expiresAt,
    };
    await this.events?.publish(IDENTITY_EVENT_TYPES.DELEGATION_GRANTED, payload);
    return granted;
  }

  async revokeDelegation(
    id: string,
    reason?: string
  ): Promise<DelegationContract | null> {
    const revoked = await this.delegations.revoke(id, reason);
    this.clearCache();
    if (revoked) {
      const payload: DelegationRevokedPayload = {
        delegationId: id,
        reason,
      };
      await this.events?.publish(
        IDENTITY_EVENT_TYPES.DELEGATION_REVOKED,
        payload
      );
    }
    return revoked;
  }

  clearCache(): void {
    this.cache.clear();
  }

  createPipelineStage(): RuntimePipelineStage {
    return {
      id: "identity",
      order: RUNTIME_PIPELINE_STAGE_ORDER.identity,
      execute: async (ctx: RuntimeContext) => {
        ctx.throwIfCancelled();
        const request = identityRequestFromContext(ctx);
        const resolved = await this.resolveOrThrow(request);
        ctx.setIdentity(resolved.identity);
        ctx.state.data.identityScope = resolved.scope;
        ctx.state.data.identityProviderId = resolved.providerId;
        ctx.state.data.identityCacheKey = resolved.cacheKey;
      },
    };
  }

  private allProviders(): IdentityProvider[] {
    const fromLocal = this.providers.list();
    const fromExternal = this.listProviders?.() ?? [];
    const byId = new Map<string, IdentityProvider>();
    for (const p of [...fromExternal, ...fromLocal]) {
      byId.set(p.id, p);
    }
    return [...byId.values()].sort(
      (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
    );
  }

  private async resolveInternal(
    request: IdentityResolutionRequest
  ): Promise<ResolvedIdentity> {
    const now = request.now ?? new Date().toISOString();
    const cacheKey = buildCacheKey(request);
    if (this.cacheTtlMs > 0) {
      const hit = this.cache.get(cacheKey);
      if (hit && hit.expiresAtMs > Date.now()) {
        return hit.value;
      }
    }

    const providers = this.allProviders();
    if (providers.length === 0) {
      throw new RuntimeAuthorizationError("No identity providers registered", {
        code: "IDENTITY_PROVIDER_MISS",
        stageId: "identity",
      });
    }

    let provider: IdentityProvider | null = null;
    let principal: PrincipalRecord | null = null;
    for (const candidate of providers) {
      const loaded = await candidate.loadPrincipal(request);
      if (loaded) {
        provider = candidate;
        principal = loaded;
        break;
      }
    }

    if (!provider || !principal) {
      throw new RuntimeAuthorizationError("Unauthenticated", {
        code: "UNAUTHENTICATED",
        stageId: "identity",
      });
    }

    let effective = principal;
    let impersonation: RuntimeIdentity["impersonation"];
    let delegationField: RuntimeIdentity["delegation"];
    let breakGlassPermissions: readonly string[] | undefined;
    let delegationMask: { scope: readonly string[] } | null = null;
    let appliedDelegationId: string | undefined;

    if (request.delegationId) {
      const contract = await this.delegations.get(request.delegationId);
      if (!contract) {
        throw new RuntimeAuthorizationError("Unknown delegation contract", {
          code: "DELEGATION_NOT_FOUND",
          stageId: "identity",
          details: { delegationId: request.delegationId },
        });
      }
      assertDelegationActive(contract, now);
      appliedDelegationId = contract.id;

      if (isImpersonationContract(contract)) {
        if (!contract.targetUserId) {
          throw new RuntimeAuthorizationError(
            "Impersonation contract missing targetUserId",
            { code: "IMPERSONATION_INVALID", stageId: "identity" }
          );
        }
        if (
          contract.toUserId !== principal.principalId &&
          contract.fromUserId !== principal.principalId
        ) {
          throw new RuntimeAuthorizationError(
            "Impersonation contract not granted to principal",
            { code: "IMPERSONATION_DENIED", stageId: "identity" }
          );
        }
        if (!provider.loadPrincipalById) {
          throw new RuntimeAuthorizationError(
            "Identity provider does not support impersonation targets",
            { code: "IMPERSONATION_UNSUPPORTED", stageId: "identity" }
          );
        }
        const target = await provider.loadPrincipalById(
          contract.targetUserId,
          request
        );
        if (!target) {
          throw new RuntimeAuthorizationError(
            "Impersonation target not found",
            { code: "IMPERSONATION_TARGET_MISS", stageId: "identity" }
          );
        }
        effective = target;
        impersonation = {
          actorUserId: principal.principalId,
          targetUserId: contract.targetUserId,
          sessionId: contract.id,
        };
        delegationMask = { scope: contract.scope };
      } else if (contract.kind === "break_glass") {
        if (contract.toUserId !== principal.principalId) {
          throw new RuntimeAuthorizationError(
            "Break-glass contract not granted to principal",
            { code: "BREAK_GLASS_DENIED", stageId: "identity" }
          );
        }
        breakGlassPermissions = contract.scope;
        delegationField = {
          fromUserId: contract.fromUserId,
          scope: contract.scope,
          expiresAt: contract.expiresAt,
        };
      } else {
        if (contract.toUserId !== principal.principalId) {
          throw new RuntimeAuthorizationError(
            "Delegation contract not granted to principal",
            { code: "DELEGATION_DENIED", stageId: "identity" }
          );
        }
        delegationMask = { scope: contract.scope };
        delegationField = {
          fromUserId: contract.fromUserId,
          scope: contract.scope,
          expiresAt: contract.expiresAt,
        };
      }

      if (
        contract.organizationIds &&
        contract.organizationIds.length > 0 &&
        request.activeOrganizationId &&
        !contract.organizationIds.includes(request.activeOrganizationId)
      ) {
        throw new RuntimeAuthorizationError(
          "Active organization outside delegation scope",
          { code: "DELEGATION_ORG_DENIED", stageId: "identity" }
        );
      }
    }

    const assignments = effective.orgAssignments;
    const activeOrganizationId = this.organizations.resolveActiveOrganization(
      assignments,
      request.activeOrganizationId
    );
    if (!activeOrganizationId) {
      throw new RuntimeAuthorizationError("No organization membership", {
        code: "ORG_REQUIRED",
        stageId: "identity",
      });
    }

    const resolvedPermissions = this.permissions.resolve({
      roles: effective.roles,
      basePermissions: effective.permissions,
      rolePermissionCatalog: effective.rolePermissionCatalog,
      delegation: delegationMask,
      breakGlassPermissions,
      organizationId: activeOrganizationId,
    });

    await this.publishPermissionResolved({
      effectiveUserId: effective.principalId,
      organizationId: activeOrganizationId,
      permissions: resolvedPermissions,
    });

    const identity: RuntimeIdentity = {
      principalId: principal.principalId,
      effectiveUserId: effective.principalId,
      displayName: effective.displayName,
      email: effective.email,
      roles: [...effective.roles],
      permissions: [...resolvedPermissions],
      orgAssignments: [...assignments],
      activeOrganizationId,
      impersonation,
      delegation: delegationField,
      preferences: effective.preferences,
      attributes: {
        ...(effective.attributes ?? {}),
        ...(request.attributes ?? {}),
        sessionRef: request.sessionRef,
        delegationId: appliedDelegationId,
        providerId: provider.id,
      },
      issuedAt: now,
      expiresAt: effective.expiresAt,
    };

    const resolved: ResolvedIdentity = {
      identity,
      scope: {
        organizationIds: this.organizations.membershipIds(assignments),
        activeOrganizationId,
      },
      providerId: provider.id,
      cacheKey,
      resolvedAt: now,
    };

    if (this.cacheTtlMs > 0) {
      this.cache.set(cacheKey, {
        value: resolved,
        expiresAtMs: Date.now() + this.cacheTtlMs,
      });
    }

    const payload: IdentityResolvedPayload = {
      principalId: identity.principalId,
      effectiveUserId: identity.effectiveUserId,
      activeOrganizationId: identity.activeOrganizationId,
      providerId: provider.id,
      permissionCount: identity.permissions.length,
      delegationId: appliedDelegationId,
    };
    await this.events?.publish(IDENTITY_EVENT_TYPES.IDENTITY_RESOLVED, payload, {
      correlationId: request.correlationId,
      sessionId: request.sessionId,
      organizationId: identity.activeOrganizationId,
      actorUserId: identity.principalId,
      effectiveUserId: identity.effectiveUserId,
    });

    return resolved;
  }

  private async publishFailed(
    payload: IdentityResolutionFailedPayload
  ): Promise<void> {
    await this.events?.publish(
      IDENTITY_EVENT_TYPES.IDENTITY_RESOLUTION_FAILED,
      payload
    );
  }

  private async publishOrganizationChanged(
    payload: OrganizationChangedPayload
  ): Promise<void> {
    await this.events?.publish(
      IDENTITY_EVENT_TYPES.ORGANIZATION_CHANGED,
      payload
    );
  }

  private async publishPermissionResolved(
    payload: PermissionResolvedPayload
  ): Promise<void> {
    await this.events?.publish(
      IDENTITY_EVENT_TYPES.PERMISSION_RESOLVED,
      payload
    );
  }
}

function buildCacheKey(request: IdentityResolutionRequest): string {
  return [
    request.sessionRef ?? "",
    request.principalId ?? "",
    request.activeOrganizationId ?? "",
    request.delegationId ?? "",
  ].join("|");
}

export function identityRequestFromContext(
  ctx: RuntimeContext
): IdentityResolutionRequest {
  const data = ctx.state.data;
  const fromData =
    data.identityRequest &&
    typeof data.identityRequest === "object" &&
    data.identityRequest !== null
      ? (data.identityRequest as IdentityResolutionRequest)
      : {};

  return {
    ...fromData,
    sessionRef:
      fromData.sessionRef ??
      (typeof data.sessionRef === "string" ? data.sessionRef : undefined),
    principalId:
      fromData.principalId ??
      (typeof data.principalId === "string" ? data.principalId : undefined),
    activeOrganizationId:
      fromData.activeOrganizationId ??
      (typeof data.activeOrganizationId === "string"
        ? data.activeOrganizationId
        : undefined),
    delegationId:
      fromData.delegationId ??
      (typeof data.delegationId === "string" ? data.delegationId : undefined),
    correlationId: ctx.correlationId,
    sessionId: ctx.sessionId,
  };
}
