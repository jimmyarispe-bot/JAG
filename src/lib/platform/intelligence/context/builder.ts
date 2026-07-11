/**
 * Shared Intelligence Context — builder (Sprint 008).
 *
 * Single entry point that assembles an immutable SharedIntelligenceContext
 * from injected section providers, with request-scoped caching and
 * graceful per-provider failure handling.
 */

import { SharedIntelligenceContextCache } from "@/lib/platform/intelligence/context/cache";
import {
  ExecutiveContextProvider,
  type ExecutiveContextSection,
} from "@/lib/platform/intelligence/context/executive-context";
import {
  FinanceContextProvider,
  type FinanceContextSection,
} from "@/lib/platform/intelligence/context/finance-context";
import {
  OrganizationContextProvider,
  type OrganizationContextSection,
} from "@/lib/platform/intelligence/context/organization-context";
import {
  StudentContextProvider,
  type StudentContextSection,
} from "@/lib/platform/intelligence/context/student-context";
import type { IntelligenceMetadata } from "@/lib/platform/intelligence/types";

/** Input used to assemble shared context for a single intelligence request. */
export interface SharedIntelligenceContextRequest {
  organizationId: string | null;
  schoolId: string | null;
  userId?: string | null;
  studentId?: string | null;
  runId?: string;
  metadata?: IntelligenceMetadata;
}

/** Contract for a shared context section provider. */
export interface SharedIntelligenceContextProvider<T> {
  readonly key: string;
  load(request: SharedIntelligenceContextRequest): T | Promise<T>;
}

/** Captured provider failure — successful sections are still returned. */
export interface SharedContextProviderError {
  readonly providerKey: string;
  readonly message: string;
}

/**
 * Immutable shared context consumed by Intelligence domains.
 * Sections are null when their provider failed.
 */
export interface SharedIntelligenceContext {
  readonly requestId: string;
  readonly scope: {
    readonly organizationId: string | null;
    readonly schoolId: string | null;
  };
  readonly executive: ExecutiveContextSection | null;
  readonly finance: FinanceContextSection | null;
  readonly student: StudentContextSection | null;
  readonly organization: OrganizationContextSection | null;
  readonly errors: readonly SharedContextProviderError[];
  readonly builtAt: string;
  readonly metadata?: IntelligenceMetadata;
}

/** Injected collaborators for {@link SharedIntelligenceContextBuilder}. */
export interface SharedIntelligenceContextBuilderDependencies {
  executive: SharedIntelligenceContextProvider<ExecutiveContextSection>;
  finance: SharedIntelligenceContextProvider<FinanceContextSection>;
  student: SharedIntelligenceContextProvider<StudentContextSection>;
  organization: SharedIntelligenceContextProvider<OrganizationContextSection>;
  /** Optional cache factory — defaults to a fresh cache per build. */
  createCache?: () => SharedIntelligenceContextCache;
}

/**
 * Deep-freeze a value for immutability guarantees.
 */
export function freezeSharedContext<T>(value: T): Readonly<T> {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) {
      freezeSharedContext(child);
    }
  }
  return value;
}

/**
 * Assembles {@link SharedIntelligenceContext} from injected providers.
 */
export class SharedIntelligenceContextBuilder {
  private readonly executive: SharedIntelligenceContextProvider<ExecutiveContextSection>;
  private readonly finance: SharedIntelligenceContextProvider<FinanceContextSection>;
  private readonly student: SharedIntelligenceContextProvider<StudentContextSection>;
  private readonly organization: SharedIntelligenceContextProvider<OrganizationContextSection>;
  private readonly createCache: () => SharedIntelligenceContextCache;

  constructor(dependencies: SharedIntelligenceContextBuilderDependencies) {
    this.executive = dependencies.executive;
    this.finance = dependencies.finance;
    this.student = dependencies.student;
    this.organization = dependencies.organization;
    this.createCache = dependencies.createCache ?? (() => new SharedIntelligenceContextCache());
  }

  /**
   * Execute each provider once (cached), assemble an immutable shared context.
   * Provider failures are recorded in `errors` without aborting the build.
   */
  async build(request: SharedIntelligenceContextRequest): Promise<SharedIntelligenceContext> {
    const cache = this.createCache();
    const errors: SharedContextProviderError[] = [];

    const executive = await this.loadSection(
      cache,
      this.executive.key,
      () => this.executive.load(request),
      errors
    );
    const finance = await this.loadSection(
      cache,
      this.finance.key,
      () => this.finance.load(request),
      errors
    );
    const student = await this.loadSection(
      cache,
      this.student.key,
      () => this.student.load(request),
      errors
    );
    const organization = await this.loadSection(
      cache,
      this.organization.key,
      () => this.organization.load(request),
      errors
    );

    const context: SharedIntelligenceContext = {
      requestId: request.runId ?? `shared-ctx-${Date.now()}`,
      scope: {
        organizationId: request.organizationId,
        schoolId: request.schoolId,
      },
      executive,
      finance,
      student,
      organization,
      errors,
      builtAt: new Date().toISOString(),
      metadata: request.metadata,
    };

    return freezeSharedContext(context);
  }

  private async loadSection<T>(
    cache: SharedIntelligenceContextCache,
    key: string,
    factory: () => T | Promise<T>,
    errors: SharedContextProviderError[]
  ): Promise<T | null> {
    try {
      return await cache.getOrSet(key, factory);
    } catch (cause) {
      errors.push({
        providerKey: key,
        message: cause instanceof Error ? cause.message : String(cause),
      });
      return null;
    }
  }
}

/**
 * Create a builder with default (empty) providers — no external service access.
 */
export function createSharedIntelligenceContextBuilder(
  overrides: Partial<SharedIntelligenceContextBuilderDependencies> = {}
): SharedIntelligenceContextBuilder {
  return new SharedIntelligenceContextBuilder({
    executive: overrides.executive ?? new ExecutiveContextProvider(),
    finance: overrides.finance ?? new FinanceContextProvider(),
    student: overrides.student ?? new StudentContextProvider(),
    organization: overrides.organization ?? new OrganizationContextProvider(),
    createCache: overrides.createCache,
  });
}
