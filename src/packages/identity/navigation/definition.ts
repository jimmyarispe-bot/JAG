import type { NavigationModel } from "@/jag/modeling";
import {
  IDENTITY_APPLICATION_ID,
  IDENTITY_PACKAGE_VERSION,
} from "@/packages/identity/package";

export const IDENTITY_NAVIGATION: NavigationModel = Object.freeze({
  id: "identity.main",
  applicationId: IDENTITY_APPLICATION_ID,
  version: IDENTITY_PACKAGE_VERSION,
  items: Object.freeze([
    Object.freeze({
      id: "identity.people",
      label: "People",
      href: "/identity/people",
      requiredPermission: "identity.people.read",
    }),
    Object.freeze({
      id: "identity.organizations",
      label: "Organizations",
      href: "/identity/organizations",
      requiredPermission: "identity.organizations.read",
    }),
    Object.freeze({
      id: "identity.roles",
      label: "Roles",
      href: "/identity/roles",
      requiredPermission: "identity.roles.read",
    }),
    Object.freeze({
      id: "identity.groups",
      label: "Groups",
      href: "/identity/groups",
      requiredPermission: "identity.groups.read",
    }),
  ]),
});
