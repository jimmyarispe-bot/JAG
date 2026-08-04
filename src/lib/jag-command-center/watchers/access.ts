/**
 * Watcher alert resource ACL — authorize against stored alert organization.
 */

import { sessionCanAccessOrganization } from "@/lib/jag-platform/org-context";
import type { JagPlatformSession } from "@/lib/jag-platform/session";
import {
  WatcherService,
  type WatcherAlert,
} from "@/lib/platform/intelligence/watchers/index";

/**
 * Load alert by id and authorize against its stored organizationId.
 * Browser/query organizationId must not be used as authorization.
 */
export function getAccessibleWatcherAlert(
  session: JagPlatformSession,
  alertId: string
): WatcherAlert | null {
  const id = alertId.trim();
  if (!id) return null;
  const alert = WatcherService.get(id);
  if (!alert) return null;
  if (!sessionCanAccessOrganization(session, alert.organizationId)) {
    return null;
  }
  return alert;
}
