import type { NavigationModel } from "@/jag/modeling";
import {
  DECISION_APPLICATION_ID,
  DECISION_PACKAGE_VERSION,
} from "@/packages/decision/package";

export const DECISION_NAVIGATION: NavigationModel = Object.freeze({
  id: "decision.main",
  applicationId: DECISION_APPLICATION_ID,
  version: DECISION_PACKAGE_VERSION,
  items: Object.freeze([
    Object.freeze({
      id: "decision.decisions",
      label: "Decisions",
      href: "/decisions",
      requiredPermission: "decision.decisions.read",
    }),
    Object.freeze({
      id: "decision.options",
      label: "Options",
      href: "/decisions/options",
      requiredPermission: "decision.options.read",
    }),
    Object.freeze({
      id: "decision.evidence",
      label: "Evidence",
      href: "/decisions/evidence",
      requiredPermission: "decision.evidence.read",
    }),
  ]),
});
