import type { NavigationModel } from "@/jag/modeling";
import {
  POLICY_APPLICATION_ID,
  POLICY_PACKAGE_VERSION,
} from "@/packages/policy/package";

export const POLICY_NAVIGATION: NavigationModel = Object.freeze({
  id: "policy.main",
  applicationId: POLICY_APPLICATION_ID,
  version: POLICY_PACKAGE_VERSION,
  items: Object.freeze([
    Object.freeze({
      id: "policy.policies",
      label: "Policies",
      href: "/policies",
      requiredPermission: "policy.policies.read",
    }),
    Object.freeze({
      id: "policy.exceptions",
      label: "Exceptions",
      href: "/policies/exceptions",
      requiredPermission: "policy.exceptions.read",
    }),
    Object.freeze({
      id: "policy.acknowledgements",
      label: "Acknowledgements",
      href: "/policies/acknowledgements",
      requiredPermission: "policy.acknowledgements.read",
    }),
  ]),
});
