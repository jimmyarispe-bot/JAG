import type { ExperienceSlot } from "./experience-types";

export interface ExperienceLayoutRegion {
  slot: ExperienceSlot;
  widgetIds: readonly string[];
  order?: number;
}

/**
 * Layout is a composition descriptor — not CSS, not a dashboard product.
 */
export interface ExperienceLayout {
  id: string;
  /** Ordered slot names present in this layout. */
  slots: readonly ExperienceSlot[];
  regions: readonly ExperienceLayoutRegion[];
  attributes?: Readonly<Record<string, unknown>>;
}

export const DEFAULT_EXPERIENCE_SLOTS: readonly ExperienceSlot[] = [
  "briefing",
  "primary",
  "secondary",
  "utility",
  "notification",
  "nav",
  "command",
];

export function buildLayoutFromWidgets(
  layoutId: string,
  widgetIdsBySlot: Readonly<Partial<Record<ExperienceSlot, readonly string[]>>>
): ExperienceLayout {
  const slots = DEFAULT_EXPERIENCE_SLOTS.filter(
    (slot) => (widgetIdsBySlot[slot]?.length ?? 0) > 0
  );
  const regions: ExperienceLayoutRegion[] = slots.map((slot, index) => ({
    slot,
    widgetIds: widgetIdsBySlot[slot] ?? [],
    order: index,
  }));
  return {
    id: layoutId,
    slots: slots.length > 0 ? slots : ["primary"],
    regions:
      regions.length > 0
        ? regions
        : [{ slot: "primary", widgetIds: [], order: 0 }],
  };
}
