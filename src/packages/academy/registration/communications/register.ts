import {
  CommunicationRegistry,
  registerCommunication,
  registerCommunicationTemplate,
} from "@/jag/communications";
import {
  ACADEMY_ADMISSIONS_COMMUNICATION_DEFINITIONS,
  ACADEMY_ADMISSIONS_COMMUNICATION_TEMPLATES,
} from "@/packages/academy/communications/admissions";

/** Register Academy admissions communication definitions + templates. */
export function registerAcademyPackageCommunications(): void {
  for (const definition of ACADEMY_ADMISSIONS_COMMUNICATION_DEFINITIONS) {
    if (!CommunicationRegistry.get(definition.id)) {
      registerCommunication(definition);
    }
  }
  for (const template of ACADEMY_ADMISSIONS_COMMUNICATION_TEMPLATES) {
    if (!CommunicationRegistry.getTemplate(template.id)) {
      registerCommunicationTemplate(template);
    }
  }
}
