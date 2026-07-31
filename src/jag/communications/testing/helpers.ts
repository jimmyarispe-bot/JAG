import { resetCommunicationExtensionsForTests } from "@/jag/communications/contracts/extensions";
import { resetCommunicationPersistenceForTests } from "@/jag/communications/delivery";
import { resetCommunicationEventsForTests } from "@/jag/communications/events";
import {
  registerCommunication,
  registerCommunicationTemplate,
  resetCommunicationRegistryForTests,
} from "@/jag/communications/registry";
import {
  resetCommunicationClockForTests,
  resetCommunicationIdsForTests,
  resetCommunicationMessageStoreForTests,
  setCommunicationClockForTests,
  setCommunicationIdPrefixForTests,
} from "@/jag/communications/runtime";
import { resetCommunicationTelemetryForTests } from "@/jag/communications/telemetry";
import type {
  CommunicationDefinition,
  CommunicationTemplate,
} from "@/jag/communications/contracts/definitions";

export function resetCommunicationEngineForTests(): void {
  resetCommunicationRegistryForTests();
  resetCommunicationMessageStoreForTests();
  resetCommunicationIdsForTests();
  resetCommunicationClockForTests();
  resetCommunicationEventsForTests();
  resetCommunicationTelemetryForTests();
  resetCommunicationExtensionsForTests();
  resetCommunicationPersistenceForTests();
}

export function freezeCommunicationEngineForTests(input?: {
  now?: Date;
  idPrefix?: string;
}): void {
  const now = input?.now ?? new Date("2026-01-15T12:00:00.000Z");
  resetCommunicationIdsForTests();
  setCommunicationClockForTests(() => now);
  setCommunicationIdPrefixForTests(input?.idPrefix ?? "test");
}

export function createTestCommunicationDefinition(
  overrides?: Partial<CommunicationDefinition> & { id?: string }
): CommunicationDefinition {
  const id = overrides?.id ?? "test.communication.generic";
  return {
    id,
    applicationId: overrides?.applicationId ?? "test-app",
    version: overrides?.version ?? "1.0.0",
    label: overrides?.label ?? "Generic Test Communication",
    description: overrides?.description,
    defaultChannel: overrides?.defaultChannel ?? "email",
    allowedChannels: overrides?.allowedChannels ?? [
      "email",
      "sms",
      "push",
      "in-app",
      "webhook",
      "external",
    ],
    templateIds: overrides?.templateIds ?? [`${id}.template`],
    dependsOn: overrides?.dependsOn,
    metadata: overrides?.metadata,
    extensions: overrides?.extensions,
  };
}

export function registerTestCommunication(
  overrides?: Partial<CommunicationDefinition> & { id?: string }
): {
  definition: CommunicationDefinition;
  template: CommunicationTemplate;
} {
  const definition = registerCommunication(
    createTestCommunicationDefinition(overrides)
  );
  const templateId = definition.templateIds?.[0] ?? `${definition.id}.template`;
  const template = registerCommunicationTemplate({
    id: templateId,
    definitionId: definition.id,
    label: "Generic template",
    subject: "Notice for {{recipient.name}}",
    body: "Hello {{recipient.name}}, status is {{status}}.",
    variables: ["recipient.name", "status"],
  });
  return { definition, template };
}
