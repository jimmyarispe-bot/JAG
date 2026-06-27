import type {
  ProfileContributionDefinition,
  ProfileContributionSlot,
} from "@/lib/platform/profile/workspace/types";
import type { ProfileKind } from "@/lib/platform/profile/types";

const CONTRIBUTION_REGISTRY: ProfileContributionDefinition[] = [];

/** Register a module contribution slot (metadata only — render in domain workspace composer). */
export function registerProfileContribution(definition: ProfileContributionDefinition): void {
  if (CONTRIBUTION_REGISTRY.some((c) => c.id === definition.id)) return;
  CONTRIBUTION_REGISTRY.push(definition);
  CONTRIBUTION_REGISTRY.sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getProfileContributions(
  profileKind: ProfileKind,
  slot?: ProfileContributionSlot
): ProfileContributionDefinition[] {
  let items = CONTRIBUTION_REGISTRY.filter(
    (c) => c.profileKind === profileKind || c.profileKind === "*"
  );
  if (slot) items = items.filter((c) => c.slot === slot);
  return items;
}

export function listContributionSlotsForKind(profileKind: ProfileKind): ProfileContributionSlot[] {
  return [...new Set(getProfileContributions(profileKind).map((c) => c.slot))];
}
