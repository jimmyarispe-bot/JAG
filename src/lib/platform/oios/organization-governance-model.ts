import type { OrganizationGovernanceModel as Contract } from "@/lib/platform/oios/contracts";
import { OrganizationPolicies } from "@/lib/platform/oios/organization-policies";
import { OrganizationStandards } from "@/lib/platform/oios/organization-standards";
import type { GovernanceModelSnapshot } from "@/lib/platform/oios/types";
export class OrganizationGovernanceModel implements Contract {
  constructor(private readonly policies = new OrganizationPolicies(), private readonly standards = new OrganizationStandards()) {}
  build(): GovernanceModelSnapshot { return { decisionBodies: ["Executive leadership", "Board or governing body"], policies: this.policies.list(), standards: this.standards.list() }; }
}
