/**
 * Registry of supported scenario kinds — Sprint 202.
 */

import {
  SCENARIO_KIND_LABELS,
  SCENARIO_KINDS,
  type ScenarioKind,
} from "./ScenarioTypes";
import { SCENARIO_TEMPLATES, getScenarioTemplate, type ScenarioTemplate } from "./ScenarioTemplates";

export type ScenarioDefinition = {
  readonly kind: ScenarioKind;
  readonly title: string;
  readonly description: string;
  readonly template: ScenarioTemplate;
};

export const ScenarioRegistry = {
  listKinds(): readonly ScenarioKind[] {
    return SCENARIO_KINDS;
  },

  listTemplates(): readonly ScenarioTemplate[] {
    return SCENARIO_TEMPLATES;
  },

  get(kind: ScenarioKind): ScenarioDefinition {
    const template = getScenarioTemplate(kind);
    return {
      kind,
      title: SCENARIO_KIND_LABELS[kind],
      description: template.description,
      template,
    };
  },

  list(): readonly ScenarioDefinition[] {
    return SCENARIO_KINDS.map((kind) => this.get(kind));
  },
} as const;
