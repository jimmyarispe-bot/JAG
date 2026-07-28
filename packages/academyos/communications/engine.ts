/**
 * Notification Engine — routes cross-domain AcademyOS events into notifications.
 * Domains call `routeAcademyOsDomainEvent` after their own emit; no Foundation changes.
 */

import { createNotificationService } from "./notifications";
import type {
  CommunicationChannel,
  CommunicationDomain,
  Notification,
} from "./types";

export type DomainEventRouteInput = {
  organizationId: string;
  domain: CommunicationDomain;
  eventKey: string;
  recipientType: Notification["recipientType"];
  recipientId: string;
  title?: string;
  body?: string;
  variables?: Readonly<Record<string, string>>;
  studentId?: string | null;
  familyId?: string | null;
  employeeId?: string | null;
  campusId?: string | null;
  programId?: string | null;
  channel?: CommunicationChannel;
  createdBy?: string;
  metadata?: Record<string, string>;
};

export function createNotificationEngine() {
  const notifications = createNotificationService();
  return {
    route(input: DomainEventRouteInput): Notification[] | { error: string } {
      return notifications.fromDomainEvent({
        ...input,
        createdBy: input.createdBy ?? "system",
      });
    },
  };
}

/** Convenience for other AcademyOS modules without importing the factory. */
export function routeAcademyOsDomainEvent(
  input: DomainEventRouteInput
): Notification[] | { error: string } {
  return createNotificationEngine().route(input);
}
