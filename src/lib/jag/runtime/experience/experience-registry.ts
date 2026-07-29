import { RuntimeExtensionError } from "../errors";
import type { ExperienceProvider } from "./experience-provider";
import { sortExperienceProviders } from "./experience-provider";
import type { ExperienceWidgetRegistration } from "./experience-widget";
import {
  EXPERIENCE_EVENT_TYPES,
  type WidgetRegisteredPayload,
} from "./experience-events";
import type { RuntimeEventBus } from "../events";

export class ExperienceRegistry {
  private readonly providers = new Map<string, ExperienceProvider>();
  private readonly widgets = new Map<string, ExperienceWidgetRegistration>();
  private readonly events?: RuntimeEventBus;

  constructor(options: { events?: RuntimeEventBus } = {}) {
    this.events = options.events;
  }

  registerProvider(provider: ExperienceProvider): void {
    if (this.providers.has(provider.id)) {
      throw new RuntimeExtensionError(
        `Experience provider already registered: ${provider.id}`,
        { code: "EXPERIENCE_PROVIDER_EXISTS" }
      );
    }
    this.providers.set(provider.id, provider);
  }

  unregisterProvider(id: string): boolean {
    return this.providers.delete(id);
  }

  listProviders(): ExperienceProvider[] {
    return sortExperienceProviders([...this.providers.values()]);
  }

  registerWidget(widget: ExperienceWidgetRegistration): void {
    if (this.widgets.has(widget.widgetId)) {
      throw new RuntimeExtensionError(
        `Experience widget already registered: ${widget.widgetId}`,
        { code: "EXPERIENCE_WIDGET_EXISTS" }
      );
    }
    this.widgets.set(widget.widgetId, widget);
    const payload: WidgetRegisteredPayload = {
      widgetId: widget.widgetId,
      kind: widget.kind,
      providerId: widget.providerId,
    };
    void this.events?.publish(EXPERIENCE_EVENT_TYPES.WIDGET_REGISTERED, payload);
  }

  unregisterWidget(widgetId: string): boolean {
    return this.widgets.delete(widgetId);
  }

  getWidget(widgetId: string): ExperienceWidgetRegistration | undefined {
    return this.widgets.get(widgetId);
  }

  listWidgets(): ExperienceWidgetRegistration[] {
    return [...this.widgets.values()].sort(
      (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
    );
  }

  clear(): void {
    this.providers.clear();
    this.widgets.clear();
  }
}

export function createExperienceRegistry(options?: {
  events?: RuntimeEventBus;
}): ExperienceRegistry {
  return new ExperienceRegistry(options);
}
