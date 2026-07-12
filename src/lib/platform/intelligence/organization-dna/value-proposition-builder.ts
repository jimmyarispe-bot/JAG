/**
 * ValuePropositionBuilder (Sprint 030).
 */

import type { ValuePropositionBuilder as ValuePropositionBuilderContract } from "@/lib/platform/intelligence/organization-dna/contracts";
import type {
  CompanyBuilderSeed,
  CustomerPersona,
  ValueProposition,
} from "@/lib/platform/intelligence/organization-dna/types";

export class ValuePropositionBuilderImpl
  implements ValuePropositionBuilderContract
{
  build(input: {
    seed: CompanyBuilderSeed;
    personas: CustomerPersona[];
    now: Date;
  }): ValueProposition {
    void input.now;
    const seed = input.seed;
    const primary = input.personas[0];
    const statement = `${seed.solutionSummary ?? "Our operating system"} helps ${
      primary?.name ?? seed.targetCustomer ?? "customers"
    } overcome ${seed.problemStatement ?? "fragmented operations"} with clarity, readiness, and stage-aware execution.`;

    return {
      statement,
      customerJobs: primary?.jobs ?? ["Align and execute"],
      painsRelieved: primary?.pains ?? [seed.problemStatement ?? "Ambiguity"],
      gainsCreated: primary?.gains ?? ["Faster decisions", "Shared DNA"],
      differentiators: [
        "Organizational DNA as a shared substrate",
        "Lifecycle-aware company building",
        "Integration with executive, predictive, and board intelligence",
      ],
      narrative: "Value proposition synthesized from seed and personas.",
    };
  }
}

export { ValuePropositionBuilderImpl as ValuePropositionBuilder };
