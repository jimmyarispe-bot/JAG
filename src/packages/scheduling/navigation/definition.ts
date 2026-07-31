import type { NavigationModel } from "@/jag/modeling";
import {
  SCHEDULING_APPLICATION_ID,
  SCHEDULING_PACKAGE_VERSION,
} from "@/packages/scheduling/package";

export const SCHEDULING_NAVIGATION: NavigationModel = Object.freeze({
  id: "scheduling.main",
  applicationId: SCHEDULING_APPLICATION_ID,
  version: SCHEDULING_PACKAGE_VERSION,
  items: Object.freeze([
    Object.freeze({
      id: "scheduling.schedule",
      label: "Schedule",
      href: "/scheduling",
      requiredPermission: "scheduling.items.read",
    }),
    Object.freeze({
      id: "scheduling.resources",
      label: "Resources",
      href: "/scheduling/resources",
      requiredPermission: "scheduling.resources.read",
    }),
    Object.freeze({
      id: "scheduling.availability",
      label: "Availability",
      href: "/scheduling/availability",
      requiredPermission: "scheduling.availability.read",
    }),
    Object.freeze({
      id: "scheduling.conflicts",
      label: "Conflicts",
      href: "/scheduling/conflicts",
      requiredPermission: "scheduling.conflicts.read",
    }),
  ]),
});
