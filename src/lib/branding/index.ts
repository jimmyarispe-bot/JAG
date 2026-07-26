export type { OrganizationBranding, BrandingSurfaceLabels, ExecutiveRoleKey } from "@/lib/branding/types";
export { EXECUTIVE_ROLE_KEYS } from "@/lib/branding/types";
export {
  resolveOrganizationBranding,
  resolveRoleLabel,
  formatProductTitle,
} from "@/lib/branding/resolve";
export {
  formatWorkspaceProductLine,
  resolveWorkspaceEditionLabel,
} from "@/lib/branding/workspace-edition";
export { loadOrganizationBranding } from "@/lib/branding/load";
export { FALLBACK_ROLE_LABELS, GENERIC_BRANDING_DEFAULTS } from "@/lib/branding/defaults";
export {
  buildAdmissionsDecisionEmail,
  buildBoardReportHeader,
  buildFamilyCalendarName,
  buildCalendarProdId,
} from "@/lib/branding/templates";
