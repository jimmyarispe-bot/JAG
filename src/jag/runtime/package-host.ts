/**
 * Package host bridge — composition root binds packages; JAG never imports them.
 *
 * Hosts (e.g. Academy) register manifests + contribution/compose adapters here.
 * The runtime package loader uses PackageLoader + this host only.
 */

import type {
  PackageManifest,
  PackageRecord,
} from "@/jag/packages/contracts/definitions";
import type {
  JagLoadedPackage,
  JagStartupOptions,
  JagStartupResult,
} from "@/jag/runtime/types";

export type JagPackageHost = {
  /** Manifests available for discovery. */
  readonly listManifests: () => readonly PackageManifest[];
  /**
   * Register declarative contributions into JAG engines after initialize.
   * Package-owned; must not live under src/jag.
   */
  readonly registerContributions: (record: PackageRecord) => void;
  /** Compose DI / health / compat surfaces for a loaded package. */
  readonly compose: (
    record: PackageRecord,
    options?: JagStartupOptions
  ) => JagLoadedPackage;
  /** Optional post-start hook (compat boot caches, etc.). */
  readonly onStartupComplete?: (result: JagStartupResult) => void;
};

export type JagServiceBridge = {
  readonly resolve: (name: string) => unknown;
  readonly listNames: () => readonly string[];
};

let packageHost: JagPackageHost | null = null;
let serviceBridge: JagServiceBridge | null = null;

export function bindJagPackageHost(host: JagPackageHost | null): void {
  packageHost = host;
}

export function getJagPackageHost(): JagPackageHost | null {
  return packageHost;
}

export function requireJagPackageHost(): JagPackageHost {
  if (!packageHost) {
    throw new Error(
      "No JagPackageHost bound. Import the application package host (e.g. @/packages/academy/host) before startJAG()."
    );
  }
  return packageHost;
}

export function bindJagServiceBridge(bridge: JagServiceBridge | null): void {
  serviceBridge = bridge;
}

export function getJagServiceBridge(): JagServiceBridge | null {
  return serviceBridge;
}

export function requireJagServiceBridge(): JagServiceBridge {
  if (!serviceBridge) {
    throw new Error(
      "No JagServiceBridge bound. Bind it from the application package host before resolveJAGService()."
    );
  }
  return serviceBridge;
}

export function resetJagPackageHostForTests(): void {
  packageHost = null;
  serviceBridge = null;
}
