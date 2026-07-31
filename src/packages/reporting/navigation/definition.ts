import type { NavigationModel } from "@/jag/modeling";
import {
  REPORTING_APPLICATION_ID,
  REPORTING_PACKAGE_VERSION,
} from "@/packages/reporting/package";

export const REPORTING_NAVIGATION: NavigationModel = Object.freeze({
  id: "reporting.main",
  applicationId: REPORTING_APPLICATION_ID,
  version: REPORTING_PACKAGE_VERSION,
  items: Object.freeze([
    Object.freeze({
      id: "reporting.definitions",
      label: "Reports",
      href: "/reporting",
      requiredPermission: "reporting.definitions.read",
    }),
    Object.freeze({
      id: "reporting.metrics",
      label: "Metrics",
      href: "/reporting/metrics",
      requiredPermission: "reporting.metrics.read",
    }),
    Object.freeze({
      id: "reporting.distribution",
      label: "Distribution",
      href: "/reporting/distribution",
      requiredPermission: "reporting.distribution.read",
    }),
  ]),
});
