import type { PackageLifecycleState } from "@/jag/packages/contracts/definitions";

/** Deterministic allowed transitions. */
const ALLOWED: Record<PackageLifecycleState, readonly PackageLifecycleState[]> =
  {
    discovered: ["validated", "removed"],
    validated: ["installed", "removed"],
    installed: ["initialized", "removed"],
    initialized: ["activated", "deactivated", "removed"],
    activated: ["suspended", "deactivated"],
    suspended: ["activated", "deactivated"],
    deactivated: ["initialized", "activated", "removed"],
    removed: [],
  };

export function canTransitionPackageLifecycle(
  from: PackageLifecycleState,
  to: PackageLifecycleState
): boolean {
  return ALLOWED[from].includes(to);
}

export function assertPackageLifecycleTransition(
  from: PackageLifecycleState,
  to: PackageLifecycleState
): void {
  if (!canTransitionPackageLifecycle(from, to)) {
    throw new Error(
      `Invalid package lifecycle transition: ${from} → ${to}`
    );
  }
}

/** Canonical happy-path order for documentation/tests. */
export const PACKAGE_ACTIVATION_PATH: readonly PackageLifecycleState[] = [
  "discovered",
  "validated",
  "installed",
  "initialized",
  "activated",
] as const;
