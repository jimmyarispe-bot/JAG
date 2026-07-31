import { DecisionRegistry, registerDecision } from "@/jag/decisions";
import { ACADEMY_DECISION_DEFINITIONS } from "@/packages/academy/decisions";

/** Register Academy package decisions into the Universal Decision Engine. */
export function registerAcademyPackageDecisions(): void {
  for (const definition of ACADEMY_DECISION_DEFINITIONS) {
    if (!DecisionRegistry.get(definition.id)) {
      registerDecision(definition);
    }
  }
}
