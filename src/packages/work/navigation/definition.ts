import type { NavigationModel } from "@/jag/modeling";
import {
  WORK_APPLICATION_ID,
  WORK_PACKAGE_VERSION,
} from "@/packages/work/package";

export const WORK_NAVIGATION: NavigationModel = Object.freeze({
  id: "work.main",
  applicationId: WORK_APPLICATION_ID,
  version: WORK_PACKAGE_VERSION,
  items: Object.freeze([
    Object.freeze({
      id: "work.items",
      label: "Work",
      href: "/work",
      requiredPermission: "work.items.read",
    }),
    Object.freeze({
      id: "work.assignments",
      label: "Assignments",
      href: "/work/assignments",
      requiredPermission: "work.assignments.read",
    }),
    Object.freeze({
      id: "work.dependencies",
      label: "Dependencies",
      href: "/work/dependencies",
      requiredPermission: "work.dependencies.read",
    }),
  ]),
});
