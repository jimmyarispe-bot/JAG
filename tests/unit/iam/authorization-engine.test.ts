import { describe, expect, it } from "vitest";
import {
  AuthorizationEngine,
  PermissionDeniedError,
  buildIamAuthzSnapshot,
  createIamPlatform,
} from "@/lib/platform/iam";

describe("IAM authorization engine", () => {
  it("authorize / hasPermission / requirePermission are permission-based", () => {
    const snapshot = buildIamAuthzSnapshot({
      userId: "u1",
      permissions: ["org.read", "users.read"],
      organizationId: "org-1",
    });
    const engine = new AuthorizationEngine();

    expect(engine.authorize(snapshot, "org.read")).toBe(true);
    expect(engine.hasPermission(snapshot, "users.manage")).toBe(false);
    expect(() => engine.requirePermission(snapshot, "org.read")).not.toThrow();
    expect(() => engine.requirePermission(snapshot, "iam.admin")).toThrow(
      PermissionDeniedError
    );
  });

  it("emits audit events when auditAllDecisions is enabled", () => {
    const audited = createIamPlatform({
      auditAllDecisions: true,
      createId: ((n) => (prefix: string) => `${prefix}-${++n}`)(0),
    });

    const adminRole = audited.roles.getByKey("SYSTEM_ADMIN")!;
    audited.identity.upsertUser({ id: "admin", email: "admin@example.com" });
    audited.roles.assignRole("admin", adminRole.id);
    const subject = audited.buildSubjectSnapshot({
      userId: "admin",
      organizationId: "org-x",
    });

    expect(audited.authorization.hasPermission(subject, "iam.admin")).toBe(true);
    expect(
      audited.auditSink.list().some((e) => e.kind === "authorization.allow")
    ).toBe(true);

    const member = buildIamAuthzSnapshot({
      userId: "m1",
      permissions: ["org.read"],
    });
    audited.authorization.hasPermission(member, "iam.admin");
    expect(
      audited.auditSink.list().some((e) => e.kind === "authorization.deny")
    ).toBe(true);
  });

  it("merges overlay permissions into snapshots", () => {
    const engine = new AuthorizationEngine();
    const base = buildIamAuthzSnapshot({
      userId: "u1",
      permissions: ["org.read"],
    });
    const merged = engine.mergeOverlayPermissions(
      base,
      ["org.settings"],
      ["delegation-1"]
    );
    expect(engine.authorize(merged, "org.settings")).toBe(true);
    expect(merged.overlayIds).toContain("delegation-1");
  });
});
