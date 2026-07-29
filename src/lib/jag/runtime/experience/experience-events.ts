export const EXPERIENCE_EVENT_TYPES = {
  EXPERIENCE_COMPOSED: "jag.runtime.experience.composed",
  WIDGET_REGISTERED: "jag.runtime.experience.widget_registered",
  BRIEFING_GENERATED: "jag.runtime.experience.briefing_generated",
  NEXT_ACTIONS_GENERATED: "jag.runtime.experience.next_actions_generated",
  EXPERIENCE_COMPOSITION_FAILED: "jag.runtime.experience.composition_failed",
} as const;

export type ExperienceEventType =
  (typeof EXPERIENCE_EVENT_TYPES)[keyof typeof EXPERIENCE_EVENT_TYPES];

export interface ExperienceComposedPayload {
  workspaceId: string;
  contextId: string;
  widgetCount: number;
  renderTarget: string;
}

export interface WidgetRegisteredPayload {
  widgetId: string;
  kind: string;
  providerId?: string;
}

export interface BriefingGeneratedPayload {
  briefingId: string;
  priorityCount: number;
  unknownGapCount: number;
}

export interface NextActionsGeneratedPayload {
  actionIds: readonly string[];
}

export interface ExperienceCompositionFailedPayload {
  reason: string;
  code: string;
}
