import { ProcessRegistry, registerProcess } from "@/jag/processes";
import { AcademyAdmissionsProcessDefinition } from "@/packages/academy/processes/admissions/manifest";

/** Register Academy process definitions into the Universal Process Engine. */
export function registerAcademyPackageProcesses(): void {
  if (!ProcessRegistry.get(AcademyAdmissionsProcessDefinition.id)) {
    registerProcess(AcademyAdmissionsProcessDefinition);
  }
}
