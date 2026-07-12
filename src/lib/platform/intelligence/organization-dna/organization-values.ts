/**
 * OrganizationValues builder (Sprint 030).
 */

import type { OrganizationValuesBuilder as OrganizationValuesBuilderContract } from "@/lib/platform/intelligence/organization-dna/contracts";
import type {
  CompanyBuilderSeed,
  OrganizationValues,
} from "@/lib/platform/intelligence/organization-dna/types";

const DEFAULT_VALUES = [
  {
    name: "Clarity",
    description: "Make decisions and priorities explicit.",
    behaviors: ["Document decisions", "Share context early"],
  },
  {
    name: "Accountability",
    description: "Own outcomes end-to-end.",
    behaviors: ["Assign owners", "Close loops"],
  },
  {
    name: "Learning",
    description: "Improve from evidence, not opinion.",
    behaviors: ["Review metrics weekly", "Retrospect failures"],
  },
  {
    name: "Integrity",
    description: "Do what we say and measure what matters.",
    behaviors: ["Publish truthful status", "Protect trust"],
  },
] as const;

export class OrganizationValuesBuilderImpl
  implements OrganizationValuesBuilderContract
{
  build(input: {
    seed: CompanyBuilderSeed;
    createId: (prefix: string) => string;
    now: Date;
  }): OrganizationValues {
    void input.now;
    const hints = input.seed.valuesHints ?? [];
    const values =
      hints.length > 0
        ? hints.map((name, index) => ({
            id: input.createId("value"),
            name,
            description: `Core value: ${name}`,
            behaviors: [`Demonstrate ${name} daily`],
          }))
        : DEFAULT_VALUES.map((v) => ({
            id: input.createId("value"),
            name: v.name,
            description: v.description,
            behaviors: [...v.behaviors],
          }));

    return {
      values,
      narrative:
        hints.length > 0
          ? "Values derived from founder-provided hints."
          : "Default operating values for early-stage organizations.",
    };
  }
}

export { OrganizationValuesBuilderImpl as OrganizationValues };
export { OrganizationValuesBuilderImpl as OrganizationValuesBuilder };
