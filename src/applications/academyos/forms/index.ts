import { ACADEMYOS_FORMS } from "@/applications/academyos/forms/definitions";
import { FormService } from "@/lib/platform/forms";
import type { FormDefinition } from "@/lib/platform/forms";

export function registerAcademyForms(): FormDefinition[] {
  return ACADEMYOS_FORMS.map((f) => FormService.register(f));
}

export { ACADEMYOS_FORMS } from "@/applications/academyos/forms/definitions";
