/**
 * Sprint 062 — personalizer registry (extensible without engine edits).
 */

import type {
  BriefingPersonalizer,
  BriefingPreferences,
  BriefingRole,
  ExecutiveBriefing,
} from "@/lib/platform/intelligence/briefing/types";

export class BriefingPersonalizerRegistry {
  private readonly personalizers = new Map<string, BriefingPersonalizer>();

  register(personalizer: BriefingPersonalizer): void {
    this.personalizers.set(personalizer.id, personalizer);
  }

  unregister(id: string): boolean {
    return this.personalizers.delete(id);
  }

  get(id: string): BriefingPersonalizer | undefined {
    return this.personalizers.get(id);
  }

  list(): BriefingPersonalizer[] {
    return [...this.personalizers.values()];
  }

  apply(
    briefing: ExecutiveBriefing,
    preferences: BriefingPreferences
  ): ExecutiveBriefing {
    const personalizer =
      this.personalizers.get(preferences.role) ??
      this.personalizers.get("executive");
    if (!personalizer) return briefing;
    return personalizer.personalize(briefing, preferences);
  }
}

export function createDefaultPersonalizerRegistry(
  builtins: BriefingPersonalizer[]
): BriefingPersonalizerRegistry {
  const registry = new BriefingPersonalizerRegistry();
  for (const personalizer of builtins) registry.register(personalizer);
  return registry;
}

export function isBriefingRole(value: string): value is BriefingRole {
  return ["founder", "ceo", "executive", "school_leader", "board"].includes(value);
}
