import type { OrganizationStrategy as Contract } from "@/lib/platform/oios/contracts";
import type { Objective, Strategy } from "@/lib/platform/oios/types";
export class OrganizationStrategy implements Contract {
  constructor(private readonly createId: (prefix: string) => string = (prefix) => `${prefix}-${Date.now()}`) {}
  build(objectives: Objective[]): Strategy { return { id: this.createId("strategy"), title: "Organizational operating strategy", objectives: objectives.map((item) => ({ ...item })), themes: [...new Set(objectives.map((item) => item.title.split(" ")[0] ?? "Execution"))] }; }
}
