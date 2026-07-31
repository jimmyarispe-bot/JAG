import {
  assertAllowedChannel,
  isCommunicationChannelKind,
} from "@/jag/communications/channels";
import type {
  CommunicationDefinition,
  CommunicationPreference,
  CommunicationTemplate,
} from "@/jag/communications/contracts/definitions";

const definitions = new Map<string, CommunicationDefinition>();
const templates = new Map<string, CommunicationTemplate>();
const preferences = new Map<string, CommunicationPreference>();

function preferenceKey(p: CommunicationPreference): string {
  return `${p.organizationId}:${p.userId}:${p.channel}`;
}

function validateDefinition(definition: CommunicationDefinition): void {
  if (!definition.id.trim()) {
    throw new Error("CommunicationDefinition.id is required");
  }
  if (!definition.applicationId.trim()) {
    throw new Error(`Communication "${definition.id}" requires applicationId`);
  }
  if (!definition.version.trim()) {
    throw new Error(`Communication "${definition.id}" requires version`);
  }
  assertAllowedChannel(definition, definition.defaultChannel);
  if (definition.allowedChannels) {
    for (const c of definition.allowedChannels) {
      if (!isCommunicationChannelKind(c)) {
        throw new Error(
          `Communication "${definition.id}" has invalid channel "${c}"`
        );
      }
    }
  }
}

function validateDependencies(definition: CommunicationDefinition): void {
  for (const dep of definition.dependsOn ?? []) {
    if (!definitions.has(dep)) {
      throw new Error(
        `Communication "${definition.id}" depends on unregistered communication "${dep}"`
      );
    }
  }
}

function freezeDefinition(
  definition: CommunicationDefinition
): CommunicationDefinition {
  return Object.freeze({
    ...definition,
    allowedChannels: definition.allowedChannels
      ? Object.freeze([...definition.allowedChannels])
      : undefined,
    templateIds: definition.templateIds
      ? Object.freeze([...definition.templateIds])
      : undefined,
    dependsOn: definition.dependsOn
      ? Object.freeze([...definition.dependsOn])
      : undefined,
    metadata: definition.metadata
      ? Object.freeze({ ...definition.metadata })
      : undefined,
    extensions: definition.extensions
      ? Object.freeze({ ...definition.extensions })
      : undefined,
  });
}

export function registerCommunication(
  definition: CommunicationDefinition
): CommunicationDefinition {
  validateDefinition(definition);
  if (definitions.has(definition.id)) {
    throw new Error(
      `Communication "${definition.id}" is already registered. Communication ids must be unique.`
    );
  }
  validateDependencies(definition);
  const frozen = freezeDefinition(definition);
  definitions.set(frozen.id, frozen);
  return frozen;
}

export function registerCommunicationTemplate(
  template: CommunicationTemplate
): CommunicationTemplate {
  if (!template.id.trim()) {
    throw new Error("CommunicationTemplate.id is required");
  }
  if (!definitions.has(template.definitionId)) {
    throw new Error(
      `Template "${template.id}" references unregistered definition "${template.definitionId}"`
    );
  }
  if (!template.body.trim()) {
    throw new Error(`Template "${template.id}" requires body`);
  }
  if (templates.has(template.id)) {
    throw new Error(`Template "${template.id}" is already registered`);
  }
  const frozen = Object.freeze({
    ...template,
    variables: template.variables
      ? Object.freeze([...template.variables])
      : undefined,
    attachmentRefs: template.attachmentRefs
      ? Object.freeze([...template.attachmentRefs])
      : undefined,
  });
  templates.set(frozen.id, frozen);
  return frozen;
}

export function upsertCommunicationPreference(
  preference: CommunicationPreference
): CommunicationPreference {
  if (!preference.userId.trim() || !preference.organizationId.trim()) {
    throw new Error("CommunicationPreference requires userId and organizationId");
  }
  if (!isCommunicationChannelKind(preference.channel)) {
    throw new Error(`Invalid preference channel "${preference.channel}"`);
  }
  const frozen = Object.freeze({
    ...preference,
    quietHours: preference.quietHours
      ? Object.freeze({ ...preference.quietHours })
      : undefined,
  });
  preferences.set(preferenceKey(frozen), frozen);
  return frozen;
}

export function getCommunicationDefinition(
  id: string
): CommunicationDefinition | null {
  return definitions.get(id) ?? null;
}

export function listCommunicationDefinitions(filter?: {
  applicationId?: string;
}): CommunicationDefinition[] {
  let all = [...definitions.values()].sort((a, b) => a.id.localeCompare(b.id));
  if (filter?.applicationId) {
    all = all.filter((d) => d.applicationId === filter.applicationId);
  }
  return all;
}

export function assertCommunicationRegistered(
  id: string
): CommunicationDefinition {
  const def = getCommunicationDefinition(id);
  if (!def) {
    throw new Error(
      `Communication "${id}" is not registered. Packages must registerCommunication().`
    );
  }
  return def;
}

export function getCommunicationTemplate(
  id: string
): CommunicationTemplate | null {
  return templates.get(id) ?? null;
}

export function listCommunicationTemplates(filter?: {
  definitionId?: string;
}): CommunicationTemplate[] {
  let all = [...templates.values()].sort((a, b) => a.id.localeCompare(b.id));
  if (filter?.definitionId) {
    all = all.filter((t) => t.definitionId === filter.definitionId);
  }
  return all;
}

export function getCommunicationPreference(input: {
  organizationId: string;
  userId: string;
  channel: string;
}): CommunicationPreference | null {
  return (
    preferences.get(
      `${input.organizationId}:${input.userId}:${input.channel}`
    ) ?? null
  );
}

export function validateCommunicationRegistryDependencies(): string[] {
  const errors: string[] = [];
  for (const def of definitions.values()) {
    for (const dep of def.dependsOn ?? []) {
      if (!definitions.has(dep)) {
        errors.push(`Communication "${def.id}" depends on missing "${dep}"`);
      }
    }
  }
  return errors;
}

export function resetCommunicationRegistryForTests(): void {
  definitions.clear();
  templates.clear();
  preferences.clear();
}

export const CommunicationRegistry = {
  register: registerCommunication,
  registerTemplate: registerCommunicationTemplate,
  upsertPreference: upsertCommunicationPreference,
  get: getCommunicationDefinition,
  list: listCommunicationDefinitions,
  assert: assertCommunicationRegistered,
  getTemplate: getCommunicationTemplate,
  listTemplates: listCommunicationTemplates,
  getPreference: getCommunicationPreference,
  validateDependencies: validateCommunicationRegistryDependencies,
  resetForTests: resetCommunicationRegistryForTests,
} as const;
