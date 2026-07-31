/**
 * CommunicationModel — declarative communication definitions + templates.
 */

import type {
  CommunicationDefinition,
  CommunicationTemplate,
} from "@/jag/communications";

export type CommunicationDefinitionModel = CommunicationDefinition;
export type CommunicationTemplateModel = CommunicationTemplate;

export type CommunicationModelBundle = {
  readonly definitions: readonly CommunicationDefinitionModel[];
  readonly templates: readonly CommunicationTemplateModel[];
};
