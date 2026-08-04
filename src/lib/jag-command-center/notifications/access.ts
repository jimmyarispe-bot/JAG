/**
 * Notification resource ACL — bind reads/mutations to signed session org scope.
 */

import { sessionCanAccessOrganization } from "@/lib/jag-platform/org-context";
import type { JagPlatformSession } from "@/lib/jag-platform/session";
import type { JagNotification } from "./types";

/**
 * Org operators: only notifications whose stored organizationId matches the
 * signed session organization. Null-org notifications are platform-only.
 * Platform stewards: any organization + unbound (null) notifications.
 */
export function sessionCanAccessNotification(
  session: JagPlatformSession,
  notification: Pick<JagNotification, "organizationId">
): boolean {
  if (!notification.organizationId) {
    return session.authority === "platform";
  }
  return sessionCanAccessOrganization(session, notification.organizationId);
}
