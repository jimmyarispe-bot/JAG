import { describe, expect, it } from "vitest";
import {
  assertBreakGlassAuditImmutable,
  createIamPlatform,
} from "@/lib/platform/iam";

describe("IAM break glass", () => {
  it("supports approval workflow, activation, and auto-expiry", () => {
    let nowMs = Date.parse("2026-06-01T00:00:00.000Z");
    const iam = createIamPlatform({
      now: () => new Date(nowMs),
      createId: ((n) => (prefix: string) => `${prefix}-${++n}`)(0),
    });

    const operator = iam.roles.getByKey("SYSTEM_ADMIN")!;
    iam.identity.upsertUser({ id: "req", email: "req@example.com" });
    iam.identity.upsertUser({ id: "apr", email: "apr@example.com" });
    iam.roles.assignRole("req", operator.id);
    iam.roles.assignRole("apr", operator.id);

    const requester = iam.buildSubjectSnapshot({ userId: "req" });
    const approver = iam.buildSubjectSnapshot({ userId: "apr" });

    const pending = iam.breakGlass.request({
      requester,
      organizationId: "org-1",
      permissionKeys: ["org.lifecycle"],
      reason: "Production incident",
      ticketRef: "INC-100",
    });
    expect(pending.status).toBe("pending_approval");

    expect(() => iam.breakGlass.approve(pending.id, requester)).toThrow(
      /cannot approve their own/
    );

    const approved = iam.breakGlass.approve(pending.id, approver);
    expect(approved.status).toBe("approved");

    const active = iam.breakGlass.activate(pending.id, requester, 60_000);
    expect(active.status).toBe("active");
    expect(
      iam.breakGlass.overlayPermissionsForUser("req").permissions
    ).toContain("org.lifecycle");

    iam.breakGlass.recordAction(pending.id, "req", { action: "viewed_users" });

    nowMs += 120_000;
    expect(iam.breakGlass.expireDue()).toBe(1);
    expect(iam.breakGlass.get(pending.id)?.status).toBe("expired");

    const immutableEvents = iam.auditSink
      .list()
      .filter((e) => e.kind.startsWith("break_glass.") && e.immutable);
    expect(immutableEvents.length).toBeGreaterThan(0);
    const first = immutableEvents[0]!;
    expect(() => assertBreakGlassAuditImmutable(iam.auditSink, first.id)).toThrow(
      /cannot be rewritten/
    );
  });
});
