import type { NavigationModel } from "@/jag/modeling";
import {
  DOCUMENTS_APPLICATION_ID,
  DOCUMENTS_PACKAGE_VERSION,
} from "@/packages/documents/package";

export const DOCUMENTS_NAVIGATION: NavigationModel = Object.freeze({
  id: "documents.main",
  applicationId: DOCUMENTS_APPLICATION_ID,
  version: DOCUMENTS_PACKAGE_VERSION,
  items: Object.freeze([
    Object.freeze({
      id: "documents.library",
      label: "Documents",
      href: "/documents",
      requiredPermission: "documents.documents.read",
    }),
    Object.freeze({
      id: "documents.templates",
      label: "Templates",
      href: "/documents/templates",
      requiredPermission: "documents.templates.read",
    }),
    Object.freeze({
      id: "documents.types",
      label: "Document Types",
      href: "/documents/types",
      requiredPermission: "documents.types.read",
    }),
    Object.freeze({
      id: "documents.retention",
      label: "Retention",
      href: "/documents/retention",
      requiredPermission: "documents.retention.read",
    }),
  ]),
});
