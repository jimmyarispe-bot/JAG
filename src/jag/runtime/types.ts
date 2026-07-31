/**
 * JAG runtime startup types — package-agnostic.
 * Application packages compose concrete containers via JagPackageHost.
 */

export type JagPackageId = string;

export type JagHealthIssue = {
  readonly code: string;
  readonly message: string;
};

export type JagHealthCheck = {
  readonly code?: string;
  readonly ok?: boolean;
  readonly message?: string;
  readonly [key: string]: unknown;
};

export type JagHealthReport = {
  ok: boolean;
  applicationId: string;
  checks: readonly JagHealthCheck[];
  issues: readonly JagHealthIssue[];
};

/** Opaque package DI container — packages define the shape. */
export type JagPackageContainer = {
  ready: boolean;
  [key: string]: unknown;
};

export type JagLoadedPackage = {
  packageId: JagPackageId;
  applicationId: string;
  registration: unknown;
  container: JagPackageContainer | null;
  health: JagHealthReport | null;
};

export type JagStartupResult = {
  packages: JagLoadedPackage[];
  /** Primary (first) package container. */
  container: JagPackageContainer | null;
  health: JagHealthReport;
  ok: boolean;
};

export type JagStartupOptions = {
  /**
   * Package ids to load. Default: all manifests from the bound JagPackageHost.
   */
  packages?: JagPackageId[];
  /** Fail closed when health checks fail. Default true. */
  assertHealthy?: boolean;
  /** JAG version for package compatibility checks. */
  jagVersion?: string;
  /**
   * Opaque compose options forwarded to the package host.
   * @deprecated Prefer `packageOptions`. Kept for Academy shim callers.
   */
  academy?: Record<string, unknown>;
  /** Opaque compose options forwarded to the package host. */
  packageOptions?: Record<string, unknown>;
};
