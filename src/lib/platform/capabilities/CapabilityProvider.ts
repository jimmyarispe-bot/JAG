/**
 * CapabilityProvider contracts — Sprint 207.
 * Providers are optional hooks; absence is valid.
 */

import type { CapabilityHealthProvider } from "./CapabilityHealth";

export type CapabilityNavItem = {
  readonly id: string;
  readonly label: string;
  readonly href: string;
  readonly order?: number;
  readonly group?: "primary" | "intelligence" | "platform" | "system";
};

export type CapabilityRoute = {
  readonly id: string;
  readonly path: string;
  readonly label: string;
  readonly description?: string;
};

export type CapabilitySearchItem = {
  readonly id: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly href: string;
  readonly kind?: string;
};

export type CapabilitySearchProvider = {
  readonly listItems: () => readonly CapabilitySearchItem[];
};

export type CapabilityConversationProvider = {
  readonly intents: readonly string[];
  readonly description: string;
};

export type CapabilityBriefingProvider = {
  readonly sectionIds: readonly string[];
  readonly description: string;
};

export type CapabilityWatcherProvider = {
  readonly watcherTypes: readonly string[];
  readonly description: string;
};

export type CapabilityObservabilityProvider = {
  readonly surfaceLabel: string;
  readonly description: string;
};

export type CapabilityProviders = {
  readonly search?: CapabilitySearchProvider;
  readonly conversation?: CapabilityConversationProvider;
  readonly briefing?: CapabilityBriefingProvider;
  readonly watcher?: CapabilityWatcherProvider;
  readonly observability?: CapabilityObservabilityProvider;
  readonly health?: CapabilityHealthProvider;
};
