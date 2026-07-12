import type { OrganizationStandards as Contract } from "@/lib/platform/oios/contracts";
import type { Standard } from "@/lib/platform/oios/types";
export class OrganizationStandards implements Contract {
  list(): Standard[] { return [{ id: "standard-evidence", name: "Evidence-based decisions", requirement: "Material decisions cite available evidence and accountable owner.", score: 80 }, { id: "standard-measurement", name: "Outcome measurement", requirement: "Objectives define a measurable target and review cadence.", score: 80 }]; }
}
