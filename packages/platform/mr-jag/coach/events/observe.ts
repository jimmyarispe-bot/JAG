/**
 * Observation engine — track user events + custom registrations.
 */

import { randomUUID } from "node:crypto";
import { normalizePersona } from "../../personas";
import {
  appendEvent,
  appendTimeline,
  getCustomEvent,
  hasEventKind,
  listCustomEvents,
  markMilestone,
  registerCustomEvent,
} from "../store";
import type {
  CoachEventKind,
  CoachObservationEvent,
  CustomEventRegistration,
} from "../types";
import { findBuiltInEvent, BUILT_IN_COACH_EVENTS } from "./catalog";

export function registerCoachEvent(
  reg: CustomEventRegistration
): CustomEventRegistration {
  return registerCustomEvent(reg);
}

export function listRegisteredCoachEvents(): readonly {
  readonly kind: string;
  readonly title: string;
  readonly custom: boolean;
}[] {
  const builtIn = BUILT_IN_COACH_EVENTS.map((e) =>
    Object.freeze({ kind: e.kind as string, title: e.title, custom: false })
  );
  const custom = listCustomEvents().map((e) =>
    Object.freeze({ kind: e.kind, title: e.title, custom: true })
  );
  return Object.freeze([...builtIn, ...custom]);
}

export function observeCoachEvent(input: {
  kind: CoachEventKind;
  organizationId: string;
  userId: string;
  persona?: string | null;
  metadata?: Readonly<Record<string, string | number | boolean>>;
  /** When false, still records even if kind already seen (default: first-only for first_*). */
  allowRepeat?: boolean;
}): CoachObservationEvent {
  const persona = normalizePersona(input.persona);
  const isFirstKind = String(input.kind).startsWith("first_");
  if (
    isFirstKind &&
    !input.allowRepeat &&
    hasEventKind(input.organizationId, input.userId, input.kind)
  ) {
    const existing = {
      id: `evt:dup:${input.kind}`,
      kind: input.kind,
      organizationId: input.organizationId,
      userId: input.userId,
      persona,
      occurredAt: new Date().toISOString(),
      metadata: input.metadata,
    } satisfies CoachObservationEvent;
    return existing;
  }

  const builtIn = findBuiltInEvent(input.kind);
  const custom = getCustomEvent(input.kind);
  const event: CoachObservationEvent = {
    id: `evt:${randomUUID()}`,
    kind: input.kind,
    organizationId: input.organizationId,
    userId: input.userId,
    persona,
    occurredAt: new Date().toISOString(),
    metadata: input.metadata,
  };
  appendEvent(event);

  if (builtIn?.isMilestone || custom) {
    markMilestone(input.organizationId, input.userId, input.kind);
  }

  appendTimeline({
    id: `tl:${randomUUID()}`,
    organizationId: input.organizationId,
    userId: input.userId,
    kind: "event",
    title: builtIn?.title ?? custom?.title ?? String(input.kind),
    body: `Observed ${input.kind} for ${persona}.`,
    status: "completed",
    relatedId: event.id,
    createdAt: event.occurredAt,
    updatedAt: event.occurredAt,
  });

  return event;
}
