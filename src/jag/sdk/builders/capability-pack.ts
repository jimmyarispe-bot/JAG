/**
 * Capability Pack Builder — scaffold a pack manifest (definitions only).
 */

import type {
  CapabilityPack,
  CapabilityPackDependency,
  CapabilityPackStatus,
} from "@/jag/blueprints/contracts";

export type BuildCapabilityPackInput = {
  readonly id: string;
  readonly label: string;
  readonly version: string;
  readonly description?: string;
  readonly publisher?: string;
  readonly modules: readonly string[];
  readonly status?: CapabilityPackStatus;
  readonly dependencies?: readonly CapabilityPackDependency[];
  readonly tags?: readonly string[];
  readonly jagRuntimeMin?: string;
  /** Optional contribution stubs (entities, etc.) — still declarative. */
  readonly contributions?: Partial<
    Pick<
      CapabilityPack,
      | "entities"
      | "permissions"
      | "reports"
      | "navigation"
      | "terminology"
      | "forms"
      | "workflows"
      | "processes"
      | "decisions"
      | "documents"
      | "communications"
    >
  >;
};

/**
 * Build a Capability Pack object suitable for Organization attachment.
 * Does not register anything with Platform engines.
 */
export function buildCapabilityPack(
  input: BuildCapabilityPackInput
): CapabilityPack {
  const modules = Object.freeze([...input.modules]);
  return Object.freeze({
    id: input.id,
    name: input.label,
    label: input.label,
    description: input.description,
    version: input.version,
    publisher: input.publisher ?? "third-party",
    status: input.status ?? "draft",
    modules,
    providesModules: modules,
    tags: Object.freeze([...(input.tags ?? ["sdk", "capability-pack"])]),
    dependencies: Object.freeze([...(input.dependencies ?? [])]),
    compatibility: Object.freeze({
      jagRuntimeMin: input.jagRuntimeMin ?? "1.0.0",
    }),
    discovery: Object.freeze({
      category: "extension",
      keywords: Object.freeze([...modules]),
    }),
    upgrades: Object.freeze([]),
    ...(input.contributions ?? {}),
  });
}
