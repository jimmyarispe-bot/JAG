import type { NavigationModel } from "@/jag/modeling";
import {
  ANALYTICS_APPLICATION_ID,
  ANALYTICS_PACKAGE_VERSION,
} from "@/packages/analytics/package";

export const ANALYTICS_NAVIGATION: NavigationModel = Object.freeze({
  id: "analytics.main",
  applicationId: ANALYTICS_APPLICATION_ID,
  version: ANALYTICS_PACKAGE_VERSION,
  items: Object.freeze([
    Object.freeze({
      id: "analytics.metrics",
      label: "Metrics",
      href: "/analytics/metrics",
      requiredPermission: "analytics.metrics.read",
    }),
    Object.freeze({
      id: "analytics.kpis",
      label: "KPIs",
      href: "/analytics/kpis",
      requiredPermission: "analytics.kpis.read",
    }),
    Object.freeze({
      id: "analytics.forecasts",
      label: "Forecasts",
      href: "/analytics/forecasts",
      requiredPermission: "analytics.forecasts.read",
    }),
  ]),
});
