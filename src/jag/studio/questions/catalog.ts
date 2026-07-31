/**
 * Universal Organization Studio questions.
 * Industry hints overlay from IndustryBlueprint.studioProfile.
 */

import type { IndustryBlueprint } from "@/jag/blueprints/contracts";
import type { StudioQuestion } from "@/jag/studio/contracts";

const UNIVERSAL_QUESTIONS: readonly StudioQuestion[] = Object.freeze([
  Object.freeze({
    id: "identity.name",
    section: "identity",
    prompt: "What is your organization called?",
    type: "text",
    required: true,
  }),
  Object.freeze({
    id: "identity.mission",
    section: "identity",
    prompt: "What is your mission?",
    type: "textarea",
  }),
  Object.freeze({
    id: "identity.vision",
    section: "identity",
    prompt: "What is your vision?",
    type: "textarea",
  }),
  Object.freeze({
    id: "identity.logoUrl",
    section: "identity",
    prompt: "Where is your logo?",
    type: "url",
  }),
  Object.freeze({
    id: "identity.brand",
    section: "identity",
    prompt: "What brand name should people see?",
    type: "text",
  }),
  Object.freeze({
    id: "identity.timeZone",
    section: "identity",
    prompt: "What is your primary time zone?",
    type: "timezone",
    required: true,
  }),
  Object.freeze({
    id: "identity.languages",
    section: "identity",
    prompt: "Which languages do you operate in?",
    type: "string_list",
    required: true,
  }),
  Object.freeze({
    id: "locations",
    section: "locations",
    prompt: "Where do you operate?",
    type: "location_list",
    required: true,
  }),
  Object.freeze({
    id: "programs",
    section: "programs",
    prompt: "Which programs or service lines do you offer?",
    type: "program_list",
  }),
  Object.freeze({
    id: "roles",
    section: "roles",
    prompt: "Which roles exist in your organization?",
    type: "role_list",
  }),
  Object.freeze({
    id: "calendars",
    section: "calendars",
    prompt: "Which calendars do you run?",
    type: "calendar_list",
  }),
  Object.freeze({
    id: "policies",
    section: "policies",
    prompt: "Which operating policies matter most?",
    type: "policy_list",
  }),
  Object.freeze({
    id: "integrations",
    section: "integrations",
    prompt: "Which integrations should be enabled?",
    type: "integration_list",
  }),
  Object.freeze({
    id: "ai",
    section: "ai",
    prompt: "Which AI modules, automations, and assistants do you want?",
    type: "ai_bundle",
  }),
  Object.freeze({
    id: "modules",
    section: "modules",
    prompt: "Which industry modules should be enabled?",
    type: "module_list",
    required: true,
  }),
]);

/** List Studio questions, applying industry profile hints when present. */
export function listStudioQuestions(
  industry: IndustryBlueprint
): readonly StudioQuestion[] {
  const hints = industry.studioProfile?.questionHints ?? {};
  return Object.freeze(
    UNIVERSAL_QUESTIONS.map((q) => {
      const hint = hints[q.section] ?? hints[q.id] ?? q.hint;
      return hint && hint !== q.hint
        ? Object.freeze({ ...q, hint })
        : q;
    })
  );
}
