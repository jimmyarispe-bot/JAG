export {
  CommunicationRegistry,
  assertCommunicationRegistered,
  getCommunicationDefinition,
  getCommunicationPreference,
  getCommunicationTemplate,
  listCommunicationDefinitions,
  listCommunicationTemplates,
  registerCommunication,
  registerCommunicationTemplate,
  resetCommunicationRegistryForTests,
  upsertCommunicationPreference,
  validateCommunicationRegistryDependencies,
} from "@/jag/communications/registry/communication-registry";
