import type { RuntimeExperience } from "../contracts/experience";
import type { RuntimeIdentity } from "../contracts/identity";
import type { RuntimeIntent } from "../contracts/intent";
import type { RuntimeOrganizationalContext } from "../contracts/organizational-context";
import type { ExperienceBriefing } from "./experience-briefing";
import type { ExperienceLayout } from "./experience-layout";
import type { ExperienceWidget } from "./experience-widget";

/** Generic widget kind — no domain semantics. */
export type ExperienceWidgetKind =
  | "summary"
  | "list"
  | "timeline"
  | "alert"
  | "action"
  | "metric"
  | "chart"
  | "document"
  | "conversation"
  | "custom";

export type ExperienceSlot =
  | "briefing"
  | "primary"
  | "secondary"
  | "utility"
  | "nav"
  | "command"
  | "notification";

export type ExperienceRenderTarget =
  | "web"
  | "mobile"
  | "desktop"
  | "headless"
  | "unknown";

export interface ExperienceAccessibility {
  label?: string;
  role?: string;
  landmark?: string;
  live?: "off" | "polite" | "assertive";
  keyboardShortcut?: string;
  focusOrder?: number;
}

export interface ExperiencePersonalization {
  density?: "compact" | "comfortable" | "spacious";
  pinnedWidgetIds?: readonly string[];
  hiddenWidgetIds?: readonly string[];
  themeTokens?: Readonly<Record<string, string>>;
  preferredSlots?: Readonly<Record<string, ExperienceSlot>>;
}

export interface ExperienceNextAction {
  actionId: string;
  label?: string;
  priority?: number;
  intentId?: string;
  attributes?: Readonly<Record<string, unknown>>;
}

export interface ExperienceNotificationHint {
  id: string;
  title?: string;
  severity?: "info" | "warning" | "critical";
  /** Opaque deep-link into Context + Intent — not a product portal. */
  contextId?: string;
  intentId?: string;
  attributes?: Readonly<Record<string, unknown>>;
}

export interface ExperienceNavHint {
  id: string;
  label?: string;
  contextId?: string;
  intentId?: string;
  order?: number;
  attributes?: Readonly<Record<string, unknown>>;
}

export interface ExperienceCommandAffordance {
  id: string;
  label?: string;
  shortcut?: string;
  intentId?: string;
  actionId?: string;
  attributes?: Readonly<Record<string, unknown>>;
}

/**
 * Full composed experience model for any renderer.
 * Maps onto kernel {@link RuntimeExperience} for pipeline state.
 */
export interface ExperienceModel {
  workspaceId: string;
  contextId: string;
  title?: string;
  layout: ExperienceLayout;
  widgets: readonly ExperienceWidget[];
  briefing?: ExperienceBriefing;
  nextActions: readonly ExperienceNextAction[];
  notifications: readonly ExperienceNotificationHint[];
  navigation: readonly ExperienceNavHint[];
  commands: readonly ExperienceCommandAffordance[];
  commandEnabled: boolean;
  searchEnabled: boolean;
  personalization?: ExperiencePersonalization;
  accessibility?: ExperienceAccessibility;
  renderTarget: ExperienceRenderTarget;
  clarification?: Readonly<Record<string, unknown>>;
  attributes?: Readonly<Record<string, unknown>>;
  composedAt: string;
}

export interface ExperienceCompositionRequest {
  identity: RuntimeIdentity;
  organizationalContext?: RuntimeOrganizationalContext;
  intent?: RuntimeIntent;
  /** Opaque cognitive brief — Experience does not invent recommendations. */
  cognition?: Readonly<Record<string, unknown>>;
  personalization?: ExperiencePersonalization;
  renderTarget?: ExperienceRenderTarget;
  correlationId?: string;
  sessionId?: string;
  signal?: AbortSignal;
  now?: string;
}

export type ExperienceCompositionOutcome =
  | { status: "composed"; value: ExperienceModel }
  | { status: "empty"; value: ExperienceModel; reason: string };

export function toRuntimeExperience(model: ExperienceModel): RuntimeExperience {
  return {
    workspaceId: model.workspaceId,
    contextId: model.contextId,
    title: model.title,
    layout: {
      id: model.layout.id,
      slots: model.layout.slots,
      regions: model.layout.regions,
      attributes: model.layout.attributes,
    },
    widgetIds: model.widgets.map((w) => w.widgetId),
    briefingId: model.briefing?.briefingId,
    commandEnabled: model.commandEnabled,
    searchEnabled: model.searchEnabled,
    navigation: {
      items: model.navigation,
    },
    clarification: model.clarification,
    attributes: {
      ...(model.attributes ?? {}),
      nextActions: model.nextActions,
      notifications: model.notifications,
      commands: model.commands,
      personalization: model.personalization,
      accessibility: model.accessibility,
      renderTarget: model.renderTarget,
      widgets: model.widgets,
      briefing: model.briefing,
      composedAt: model.composedAt,
    },
  };
}
