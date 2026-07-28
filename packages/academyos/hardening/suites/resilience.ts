/**
 * Operational resilience — connector/email failures, retries, degradation.
 */

import {
  createEducationConnectors,
  createFinanceQuickBooksService,
  createNotificationService,
  routeAcademyOsDomainEvent,
} from "../aos";
import { isOk, type HardeningSuiteDefinition } from "../harness";

export const resilienceSuite: HardeningSuiteDefinition = {
  id: "resilience",
  name: "Operational Resilience",
  async run(ctx) {
    const org = ctx.organizationId;
    const connectors = createEducationConnectors();
    const zoom = connectors.find((c) => c.id === "zoom");
    ctx.assert("resilience.connector_present", Boolean(zoom), undefined, "blocker");
    if (!zoom) return;

    const healthOffline = await zoom.health({ organizationId: org });
    ctx.assert(
      "resilience.connector_offline_default",
      healthOffline === "Offline"
    );

    let validateThrew = false;
    try {
      await zoom.validate({ organizationId: org });
    } catch {
      validateThrew = true;
    }
    ctx.assert(
      "resilience.connector_validate_fails_when_disconnected",
      validateThrew,
      undefined,
      "critical"
    );

    await zoom.connect({ organizationId: org });
    const healthOk = await zoom.health({ organizationId: org });
    ctx.assert("resilience.connector_healthy_after_connect", healthOk === "Healthy");

    await zoom.disconnect({ organizationId: org });
    const healthAfter = await zoom.health({ organizationId: org });
    ctx.assert(
      "resilience.connector_offline_after_disconnect",
      healthAfter === "Offline"
    );

    // Graceful degradation: sync while disconnected should still be callable after reconnect path
    await zoom.connect({ organizationId: org });
    const sync = await zoom.sync({ organizationId: org });
    ctx.assert("resilience.connector_sync_recovery", sync.recordsImported === 0);

    // Notification failure observability
    const routed = routeAcademyOsDomainEvent({
      organizationId: org,
      domain: "finance",
      eventKey: "payment_failed",
      recipientType: "parent",
      recipientId: `fail.${org}@example.com`,
      createdBy: "system",
    });
    ctx.assert(
      "resilience.notification_routed",
      Array.isArray(routed) && routed.length > 0,
      undefined,
      "blocker"
    );
    if (!Array.isArray(routed) || !routed[0]) return;

    const emailish =
      routed.find((n) => n.channel === "email") ?? routed[0]!;
    const failed = createNotificationService().markFailed({
      organizationId: org,
      notificationId: emailish.id,
      reason: "SMTP unavailable (simulated)",
      actor: "ops",
    });
    ctx.assert("resilience.email_failure_marked", isOk(failed) || failed != null);
    ctx.assert(
      "resilience.email_failure_observable",
      failed?.status === "Failed" && Boolean(failed.failedReason)
    );

    // Queue interruption simulation: retry by re-routing
    const retry = routeAcademyOsDomainEvent({
      organizationId: org,
      domain: "finance",
      eventKey: "payment_failed",
      recipientType: "parent",
      recipientId: `fail.${org}@example.com`,
      channel: "in_app",
      createdBy: "ops-retry",
    });
    ctx.assert(
      "resilience.retry_behavior",
      Array.isArray(retry) && retry.some((n) => n.status !== "Failed")
    );

    // QBO via Connector Runtime — demo sync should complete or degrade with message
    const qbo = await createFinanceQuickBooksService().synchronize({
      organizationId: org,
      actorUserId: "ops",
      demo: true,
    });
    ctx.assert(
      "resilience.qbo_sync_observable",
      typeof qbo.ok === "boolean" && typeof qbo.message === "string"
    );
    ctx.assert(
      "resilience.error_recovery_surface",
      qbo.ok === true || qbo.message.length > 0
    );
  },
};
