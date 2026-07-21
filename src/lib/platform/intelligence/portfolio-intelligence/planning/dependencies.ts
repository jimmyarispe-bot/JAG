/**
 * Cross-initiative dependency detection.
 */

import type {
  CrossInitiativeDependency,
  InitiativeLight,
} from "@/lib/platform/intelligence/portfolio-intelligence/types";

export function detectCrossInitiativeDependencies(
  createId: (prefix: string) => string,
  initiatives: InitiativeLight[]
): CrossInitiativeDependency[] {
  const deps: CrossInitiativeDependency[] = [];

  for (let i = 0; i < initiatives.length; i++) {
    for (let j = i + 1; j < initiatives.length; j++) {
      const a = initiatives[i]!;
      const b = initiatives[j]!;
      const aId = a.id ?? `init-${i}`;
      const bId = b.id ?? `init-${j}`;

      const ownersA = new Set((a.owners ?? []).map((o) => o.assignmentKey).filter(Boolean));
      const sharedOwner = (b.owners ?? []).find((o) => o.assignmentKey && ownersA.has(o.assignmentKey));
      if (sharedOwner) {
        deps.push({
          id: createId("dep-owner"),
          kind: "shared_owner",
          fromInitiativeId: aId,
          toInitiativeId: bId,
          label: `Shared owner ${sharedOwner.assignmentKey}`,
          severity: 55,
        });
      }

      const msA = new Set((a.milestones ?? []).map((m) => (m.title ?? "").toLowerCase()).filter(Boolean));
      const sharedMs = (b.milestones ?? []).find((m) => m.title && msA.has(m.title.toLowerCase()));
      if (sharedMs) {
        deps.push({
          id: createId("dep-ms"),
          kind: "shared_milestone",
          fromInitiativeId: aId,
          toInitiativeId: bId,
          label: `Shared milestone "${sharedMs.title}"`,
          severity: 60,
        });
      }

      const budgetA = a.budget?.planned ?? 0;
      const budgetB = b.budget?.planned ?? 0;
      if (budgetA > 0 && budgetB > 0 && Math.abs(budgetA - budgetB) / Math.max(budgetA, budgetB) < 0.05) {
        deps.push({
          id: createId("dep-fund"),
          kind: "shared_funding",
          fromInitiativeId: aId,
          toInitiativeId: bId,
          label: "Similar funding envelope — review shared funding risk",
          severity: 40,
        });
      }

      if (
        a.targetCompletionDate &&
        b.targetCompletionDate &&
        Math.abs(
          new Date(a.targetCompletionDate).getTime() - new Date(b.targetCompletionDate).getTime()
        ) <
          1000 * 60 * 60 * 24 * 14
      ) {
        deps.push({
          id: createId("dep-time"),
          kind: "conflicting_timeline",
          fromInitiativeId: aId,
          toInitiativeId: bId,
          label: "Target dates within 14 days",
          severity: 65,
        });
      }

      const aState = a.state ?? "";
      const bState = b.state ?? "";
      if (
        (aState === "proposed" || aState === "approved") &&
        (bState === "active" || bState === "planned") &&
        (a.title ?? "").toLowerCase().includes((b.title ?? "").toLowerCase().split(/\s+/)[0] ?? "___")
      ) {
        deps.push({
          id: createId("dep-prereq"),
          kind: "prerequisite",
          fromInitiativeId: bId,
          toInitiativeId: aId,
          label: `${b.title} may be prerequisite for ${a.title}`,
          severity: 50,
        });
      }
    }
  }

  return deps;
}
