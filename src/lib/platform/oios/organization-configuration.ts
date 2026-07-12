import type { OrganizationConfiguration as Contract } from "@/lib/platform/oios/contracts";
import { OIOS_VERSION, type ConfigurationSnapshot } from "@/lib/platform/oios/types";
export class OrganizationConfiguration implements Contract {
  constructor(private readonly now: () => Date = () => new Date()) {}
  snapshot(): ConfigurationSnapshot { return { version: OIOS_VERSION, values: { improvementCadence: "quarterly", scoringScale: "0-100" }, updatedAt: this.now().toISOString() }; }
}
