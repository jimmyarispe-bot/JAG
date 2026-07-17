/**
 * Documented reference contract shapes (Stabilization A4).
 *
 * Domains keep their own named public interfaces (`CompetitiveRepository`,
 * `CustomerRepository`, …). These generics exist for documentation and
 * structural reference only — they are not breaking renames of public APIs.
 *
 * Canonical repository method order:
 * save → get → list → remove → saveHistory → listHistory → clear
 *
 * Canonical façade order in contracts.ts:
 * Engine → analyzers/sub-engines → Repository → Registry → Queries → Service → Dependencies
 */

import type { GraphScopeLike } from "@/lib/platform/intelligence/common/scope";

/** Reference shape for the 29 canonical result+history repositories. */
export interface ResultHistoryRepositoryContract<
  TResult extends { requestId: string; scope: TScope },
  THistory extends { scope: TScope },
  TScope extends GraphScopeLike = GraphScopeLike,
> {
  save(result: TResult): TResult;
  get(requestId: string): TResult | null;
  list(scope?: Partial<TScope>): TResult[];
  remove(requestId: string): boolean;
  saveHistory(record: THistory): THistory;
  listHistory(scope?: Partial<TScope>): THistory[];
  clear(): void;
}

/** Reference shape for publisher registries (array or map implementations). */
export interface PublisherRegistryContract<
  TPublisher extends { domain: string; capability: string } = {
    domain: string;
    capability: string;
  },
> {
  register(domain: string, capability: string): void;
  list(): TPublisher[];
  isRegistered(domain: string): boolean;
  clear(): void;
}

/**
 * Reference shape for domain intelligence service façades.
 * Legacy exceptions (HumanCapitalService, GovernanceService, …) are intentional.
 */
export interface IntelligenceServiceFacadeContract<
  TRequest,
  TResult,
  TQueryRequest,
  TQueryResult,
  TRepository,
> {
  build(request: TRequest): TResult;
  query(result: TResult, request: TQueryRequest): TQueryResult;
  repository(): TRepository;
}
