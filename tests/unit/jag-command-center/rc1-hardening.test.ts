import { describe, expect, it, beforeEach } from "vitest";
import {
  countUnreadJagNotifications,
  filterJagSearchCatalog,
  listJagAuditEvents,
  listJagNotifications,
  loadJagSearchCatalog,
  markAllJagNotificationsRead,
  pushJagNotification,
  recordJagAuditEvent,
  resetJagAuditStoreForTests,
  resetJagNotificationStoreForTests,
  resetJagIntelligenceStoreForTests,
  resetDecisionStatusStoreForTests,
  resetDecisionExecutionStoreForTests,
  resetBriefingStoreForTests,
} from "@/lib/jag-command-center";
import type { JagPlatformSession } from "@/lib/jag-platform/session";

const session: JagPlatformSession = {
  userId: "jag-user-founder",
  email: "founder@jag.platform",
  displayName: "JAG Founder",
  role: "FOUNDER",
  issuedAt: "2026-01-01T00:00:00.000Z",
  // Required since Foundation II tenant isolation. Notifications with a null
  // organizationId are platform-scoped and only readable by a platform steward,
  // so a founder fixture must declare that authority explicitly.
  authority: "platform",
  organizationId: null,
};

describe("RC-001 hardening (audit, notifications, search)", () => {
  beforeEach(() => {
    resetJagIntelligenceStoreForTests();
    resetDecisionStatusStoreForTests();
    resetDecisionExecutionStoreForTests();
    resetBriefingStoreForTests();
    resetJagAuditStoreForTests();
    resetJagNotificationStoreForTests();
  });

  it("records executive audit events with required fields", () => {
    recordJagAuditEvent({
      action: "decision_approved",
      actorUserId: session.userId,
      actorLabel: session.displayName,
      organizationId: "org-1",
      decisionId: "dec-1",
      detail: "Approved",
    });
    const events = listJagAuditEvents();
    expect(events).toHaveLength(1);
    expect(events[0]!.at).toBeTruthy();
    expect(events[0]!.organizationId).toBe("org-1");
    expect(events[0]!.actorLabel).toBe("JAG Founder");
    expect(events[0]!.decisionId).toBe("dec-1");
    expect(events[0]!.action).toBe("decision_approved");
  });

  it("tracks in-app notifications without email", () => {
    pushJagNotification({
      kind: "brief_ready",
      title: "Brief ready",
      body: "Morning Brief",
      href: "/jag/briefings/abc",
      briefingId: "abc",
    });
    expect(countUnreadJagNotifications(session)).toBe(1);
    expect(listJagNotifications(session)[0]!.kind).toBe("brief_ready");
    markAllJagNotificationsRead(session);
    expect(countUnreadJagNotifications(session)).toBe(0);
  });

  it("builds a searchable catalog covering executive surfaces", () => {
    const catalog = loadJagSearchCatalog(session);
    const kinds = new Set(catalog.map((i) => i.kind));
    expect(kinds.has("navigation")).toBe(true);
    expect(kinds.has("organization") || kinds.has("domain")).toBe(true);
    expect(kinds.has("capability_pack")).toBe(true);
    expect(kinds.has("knowledge")).toBe(true);
    expect(kinds.has("policy")).toBe(true);

    const filtered = filterJagSearchCatalog(catalog, "decision");
    expect(filtered.every((i) =>
      `${i.title} ${i.subtitle} ${i.kind}`.toLowerCase().includes("decision")
    )).toBe(true);
  });
});
