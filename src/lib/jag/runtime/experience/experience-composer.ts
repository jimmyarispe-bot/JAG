import { briefingFromCognition } from "./experience-briefing";
import { buildLayoutFromWidgets } from "./experience-layout";
import type { ExperienceProvider } from "./experience-provider";
import type { ExperienceRegistry } from "./experience-registry";
import { sortWidgets, type ExperienceWidget } from "./experience-widget";
import type {
  ExperienceCommandAffordance,
  ExperienceCompositionRequest,
  ExperienceModel,
  ExperienceNavHint,
  ExperienceNextAction,
  ExperienceNotificationHint,
  ExperiencePersonalization,
  ExperienceSlot,
} from "./experience-types";

export interface ExperienceComposer {
  compose(
    request: ExperienceCompositionRequest,
    registry: ExperienceRegistry,
    externalProviders: readonly ExperienceProvider[]
  ): Promise<ExperienceModel>;
}

export class DefaultExperienceComposer implements ExperienceComposer {
  async compose(
    request: ExperienceCompositionRequest,
    registry: ExperienceRegistry,
    externalProviders: readonly ExperienceProvider[]
  ): Promise<ExperienceModel> {
    const now = request.now ?? new Date().toISOString();
    const providers = mergeProviders(registry.listProviders(), externalProviders);
    const personalization = resolvePersonalization(request);

    const widgets = await collectWidgets(
      request,
      registry,
      providers,
      personalization
    );
    const briefing =
      (await collectBriefing(request, providers)) ??
      briefingFromCognition(request.cognition, now);
    const nextActions = uniqueActions([
      ...(await collectNextActions(request, providers)),
      ...briefing.nextActions,
      ...intentActionCandidates(request),
    ]);
    const notifications = await collectNotifications(request, providers);
    const navigation = await collectNavigation(request, providers);
    const commands = await collectCommands(request, providers);

    const bySlot: Partial<Record<ExperienceSlot, string[]>> = {};
    for (const widget of widgets) {
      const list = bySlot[widget.slot] ?? [];
      list.push(widget.widgetId);
      bySlot[widget.slot] = list;
    }

    const contextId =
      request.organizationalContext?.contextId ?? "context.default";
    const workspaceId = `ws_${request.identity.principalId}_${contextId}`;

    const clarification =
      request.intent?.requiresClarification
        ? {
            intentId: request.intent.intentId,
            conflicts: request.intent.conflicts,
            options: request.intent.conflicts,
          }
        : undefined;

    return {
      workspaceId,
      contextId,
      title: undefined,
      layout: buildLayoutFromWidgets(`layout_${contextId}`, bySlot),
      widgets,
      briefing,
      nextActions,
      notifications,
      navigation,
      commands,
      commandEnabled: true,
      searchEnabled: true,
      personalization,
      accessibility: {
        landmark: "main",
        live: "polite",
        label: "JAG experience",
      },
      renderTarget: request.renderTarget ?? "unknown",
      clarification,
      attributes: {
        organizationId: request.identity.activeOrganizationId,
        intentId: request.intent?.intentId,
      },
      composedAt: now,
    };
  }
}

export function createExperienceComposer(): ExperienceComposer {
  return new DefaultExperienceComposer();
}

function mergeProviders(
  local: readonly ExperienceProvider[],
  external: readonly ExperienceProvider[]
): ExperienceProvider[] {
  const byId = new Map<string, ExperienceProvider>();
  for (const p of [...external, ...local]) {
    byId.set(p.id, p);
  }
  return [...byId.values()].sort(
    (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
  );
}

function resolvePersonalization(
  request: ExperienceCompositionRequest
): ExperiencePersonalization | undefined {
  const fromIdentity = request.identity.preferences?.experience;
  const base =
    fromIdentity && typeof fromIdentity === "object"
      ? (fromIdentity as ExperiencePersonalization)
      : {};
  return {
    ...base,
    ...(request.personalization ?? {}),
  };
}

async function collectWidgets(
  request: ExperienceCompositionRequest,
  registry: ExperienceRegistry,
  providers: readonly ExperienceProvider[],
  personalization?: ExperiencePersonalization
): Promise<ExperienceWidget[]> {
  const collected: ExperienceWidget[] = [];

  for (const widget of registry.listWidgets()) {
    if (isWidgetVisible(widget, request)) {
      collected.push(widget);
    }
  }

  for (const provider of providers) {
    if (provider.supports && !provider.supports(request)) continue;
    if (!provider.widgets) continue;
    try {
      const items = await provider.widgets(request);
      for (const widget of items) {
        if (isWidgetVisible(widget, request)) {
          collected.push({
            widgetId: widget.widgetId,
            kind: widget.kind,
            slot: widget.slot,
            title: widget.title,
            order: widget.order,
            dataBindings: widget.dataBindings,
            actions: widget.actions,
            requiredPermissions: widget.requiredPermissions,
            contextFamilies: widget.contextFamilies,
            intentIds: widget.intentIds,
            a11y: widget.a11y,
            attributes: {
              ...(widget.attributes ?? {}),
              providerId: provider.id,
            },
          });
        }
      }
    } catch {
      // Skip failing provider contributions — do not crash composition.
    }
  }

  const hidden = new Set(personalization?.hiddenWidgetIds ?? []);
  const pinned = new Set(personalization?.pinnedWidgetIds ?? []);
  const filtered = collected.filter((w) => !hidden.has(w.widgetId));

  // Dedupe by widgetId — highest order wins then pin boost.
  const byId = new Map<string, ExperienceWidget>();
  for (const widget of filtered) {
    const existing = byId.get(widget.widgetId);
    if (!existing || (widget.order ?? 100) < (existing.order ?? 100)) {
      byId.set(widget.widgetId, widget);
    }
  }

  const list = [...byId.values()].map((w) =>
    pinned.has(w.widgetId) ? { ...w, order: (w.order ?? 100) - 1000 } : w
  );
  return sortWidgets(list);
}

function isWidgetVisible(
  widget: ExperienceWidget,
  request: ExperienceCompositionRequest
): boolean {
  if (widget.requiredPermissions?.length) {
    const ok = widget.requiredPermissions.every((p) =>
      request.identity.permissions.includes(p)
    );
    if (!ok) return false;
  }
  if (widget.contextFamilies?.length && request.organizationalContext) {
    if (
      !widget.contextFamilies.includes(
        request.organizationalContext.contextFamily
      )
    ) {
      return false;
    }
  }
  if (widget.intentIds?.length && request.intent) {
    if (!widget.intentIds.includes(request.intent.intentId)) {
      return false;
    }
  }
  return true;
}

async function collectBriefing(
  request: ExperienceCompositionRequest,
  providers: readonly ExperienceProvider[]
) {
  for (const provider of providers) {
    if (!provider.briefing) continue;
    if (provider.supports && !provider.supports(request)) continue;
    try {
      const briefing = await provider.briefing(request);
      if (briefing) return briefing;
    } catch {
      // continue
    }
  }
  return null;
}

async function collectNextActions(
  request: ExperienceCompositionRequest,
  providers: readonly ExperienceProvider[]
): Promise<ExperienceNextAction[]> {
  const out: ExperienceNextAction[] = [];
  for (const provider of providers) {
    if (!provider.nextActions) continue;
    if (provider.supports && !provider.supports(request)) continue;
    try {
      out.push(...(await provider.nextActions(request)));
    } catch {
      // continue
    }
  }
  return out;
}

async function collectNotifications(
  request: ExperienceCompositionRequest,
  providers: readonly ExperienceProvider[]
): Promise<ExperienceNotificationHint[]> {
  const out: ExperienceNotificationHint[] = [];
  for (const provider of providers) {
    if (!provider.notifications) continue;
    if (provider.supports && !provider.supports(request)) continue;
    try {
      out.push(...(await provider.notifications(request)));
    } catch {
      // continue
    }
  }
  return out;
}

async function collectNavigation(
  request: ExperienceCompositionRequest,
  providers: readonly ExperienceProvider[]
): Promise<ExperienceNavHint[]> {
  const out: ExperienceNavHint[] = [];
  if (request.organizationalContext) {
    out.push({
      id: `nav.context.${request.organizationalContext.contextId}`,
      label: request.organizationalContext.contextFamily,
      contextId: request.organizationalContext.contextId,
      order: 0,
    });
  }
  for (const provider of providers) {
    if (!provider.navigation) continue;
    if (provider.supports && !provider.supports(request)) continue;
    try {
      out.push(...(await provider.navigation(request)));
    } catch {
      // continue
    }
  }
  return out.sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
}

async function collectCommands(
  request: ExperienceCompositionRequest,
  providers: readonly ExperienceProvider[]
): Promise<ExperienceCommandAffordance[]> {
  const out: ExperienceCommandAffordance[] = [];
  if (request.intent && !request.intent.requiresClarification) {
    for (const actionId of request.intent.actionCandidates) {
      out.push({
        id: `cmd.${actionId}`,
        actionId,
        intentId: request.intent.intentId,
        label: actionId,
      });
    }
  }
  for (const provider of providers) {
    if (!provider.commands) continue;
    if (provider.supports && !provider.supports(request)) continue;
    try {
      out.push(...(await provider.commands(request)));
    } catch {
      // continue
    }
  }
  const byId = new Map<string, ExperienceCommandAffordance>();
  for (const cmd of out) byId.set(cmd.id, cmd);
  return [...byId.values()];
}

function intentActionCandidates(
  request: ExperienceCompositionRequest
): ExperienceNextAction[] {
  if (!request.intent) return [];
  return request.intent.actionCandidates.map((actionId, index) => ({
    actionId,
    intentId: request.intent!.intentId,
    priority: index,
  }));
}

function uniqueActions(
  actions: readonly ExperienceNextAction[]
): ExperienceNextAction[] {
  const byId = new Map<string, ExperienceNextAction>();
  for (const action of actions) {
    if (!byId.has(action.actionId)) byId.set(action.actionId, action);
  }
  return [...byId.values()].sort(
    (a, b) => (a.priority ?? 100) - (b.priority ?? 100)
  );
}
