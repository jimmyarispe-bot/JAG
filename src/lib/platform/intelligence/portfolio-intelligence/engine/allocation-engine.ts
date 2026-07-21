/**
 * Resource allocation optimizer — advisory shares across budget/staff/sponsors.
 * Soft-consumes Finance/HR/Ops signals via initiative budgets & owners (no FI/HR duplication).
 */

import type {
  InitiativeLight,
  PriorityScorecard,
  ResourceAllocation,
} from "@/lib/platform/intelligence/portfolio-intelligence/types";

export class AllocationEngine {
  allocate(
    initiatives: InitiativeLight[],
    prioritization: PriorityScorecard[]
  ): ResourceAllocation[] {
    const totalComposite = prioritization.reduce((acc, p) => acc + Math.max(1, p.composite), 0);
    const byId = new Map(initiatives.map((i, idx) => [i.id ?? `init-${idx}`, i]));

    return prioritization.map((p) => {
      const init = byId.get(p.initiativeId);
      const weight = Math.max(1, p.composite) / Math.max(1, totalComposite);
      const budgetShare = Math.round(weight * 100);
      const staffShare = Math.round(weight * 100 * (1 - p.resourceDemand / 200));
      const sponsorShare = Math.round(
        Math.min(100, (p.executivePriority / 100) * budgetShare * 1.1)
      );
      const sharedServicesShare = Math.max(5, Math.round(budgetShare * 0.35));

      const notes: string[] = [
        `Rank #${p.rank} receives ~${budgetShare}% budget share (advisory).`,
      ];
      if (init?.budget?.planned) {
        notes.push(`Planned initiative budget ${init.budget.planned} (soft FI consume).`);
      }
      if ((init?.owners ?? []).some((o) => o.role === "executive_sponsor")) {
        notes.push("Executive sponsor assignment key retained from Initiative Intelligence.");
      }

      return {
        initiativeId: p.initiativeId,
        title: p.title,
        budgetShare,
        staffShare: Math.max(0, Math.min(100, staffShare)),
        sponsorShare: Math.max(0, Math.min(100, sponsorShare)),
        sharedServicesShare: Math.max(0, Math.min(100, sharedServicesShare)),
        notes,
      };
    });
  }
}
