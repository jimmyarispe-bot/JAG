import type {
  ExperienceAccessibility,
  ExperienceSlot,
  ExperienceWidgetKind,
} from "./experience-types";

/**
 * Generic widget descriptor — no domain widgets, no React.
 */
export interface ExperienceWidget {
  widgetId: string;
  kind: ExperienceWidgetKind;
  slot: ExperienceSlot;
  title?: string;
  order?: number;
  /** Opaque read-model / cognition binding keys. */
  dataBindings?: readonly string[];
  /** Action candidate ids for Action Runtime — not executed here. */
  actions?: readonly string[];
  requiredPermissions?: readonly string[];
  /** Context family filter (opaque strings). */
  contextFamilies?: readonly string[];
  /** Intent id filter. */
  intentIds?: readonly string[];
  a11y?: ExperienceAccessibility;
  attributes?: Readonly<Record<string, unknown>>;
}

export interface ExperienceWidgetRegistration extends ExperienceWidget {
  providerId?: string;
  priority?: number;
}

export function sortWidgets(
  widgets: readonly ExperienceWidget[]
): ExperienceWidget[] {
  return [...widgets].sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
}
