import type { NavigationModel } from "@/jag/modeling";
import {
  COMMUNICATIONS_APPLICATION_ID,
  COMMUNICATIONS_PACKAGE_VERSION,
} from "@/packages/communications/package";

export const COMMUNICATIONS_NAVIGATION: NavigationModel = Object.freeze({
  id: "communications.main",
  applicationId: COMMUNICATIONS_APPLICATION_ID,
  version: COMMUNICATIONS_PACKAGE_VERSION,
  items: Object.freeze([
    Object.freeze({
      id: "communications.inbox",
      label: "Communications",
      href: "/communications",
      requiredPermission: "communications.conversations.read",
    }),
    Object.freeze({
      id: "communications.notifications",
      label: "Notifications",
      href: "/communications/notifications",
      requiredPermission: "communications.notifications.read",
    }),
    Object.freeze({
      id: "communications.campaigns",
      label: "Campaigns",
      href: "/communications/campaigns",
      requiredPermission: "communications.campaigns.read",
    }),
    Object.freeze({
      id: "communications.templates",
      label: "Templates",
      href: "/communications/templates",
      requiredPermission: "communications.templates.read",
    }),
    Object.freeze({
      id: "communications.preferences",
      label: "Preferences",
      href: "/communications/preferences",
      requiredPermission: "communications.preferences.read",
    }),
  ]),
});
