/**
 * Presentation composition contract — no business logic.
 * Widget/workspace implementation is out of scope for the Kernel.
 */

export interface RuntimeExperience {
  workspaceId: string;
  contextId: string;
  title?: string;
  /** Opaque layout token or descriptor — renderer-owned. */
  layout?: Readonly<Record<string, unknown>>;
  widgetIds: readonly string[];
  briefingId?: string;
  commandEnabled: boolean;
  searchEnabled: boolean;
  navigation?: Readonly<Record<string, unknown>>;
  clarification?: Readonly<Record<string, unknown>>;
  attributes?: Readonly<Record<string, unknown>>;
}

/**
 * @deprecated Removed from execution paths in Ω-7B.
 * Use ExperienceContributor via Experience Runtime + registerExperienceContributor.
 */
export interface RuntimeExperienceProvider {
  id: string;
  priority?: number;
  supports?(input: RuntimeExperienceProviderInput): boolean;
  compose(
    input: RuntimeExperienceProviderInput
  ): Promise<RuntimeExperience> | RuntimeExperience;
}

export interface RuntimeExperienceProviderInput {
  identity?: import("./identity").RuntimeIdentity;
  organizationalContext?: import("./organizational-context").RuntimeOrganizationalContext;
  intent?: import("./intent").RuntimeIntent;
  cognition?: Readonly<Record<string, unknown>>;
  attributes?: Readonly<Record<string, unknown>>;
}
