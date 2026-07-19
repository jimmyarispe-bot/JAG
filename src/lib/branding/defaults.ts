import type { OrganizationBranding } from "@/lib/branding/types";

/** Generic fallbacks when organization configuration is unset. */
export const GENERIC_BRANDING_DEFAULTS = {
  product_tagline: "Education Operating System",
  edition_label: "Founder's Edition",
  founder_workspace_label: "Founder Morning Brief",
  intelligence_engine_label: "Executive Intelligence",
  mission_control_label: "Mission Control",
  compliance_label: "Compliance",
  financial_intelligence_label: "Financial Intelligence",
  connect_label: "Connect",
  data_hub_label: "Data Hub",
  support_mode_label: "Support Mode",
  email_from_name: "",
} as const;

export const FALLBACK_ROLE_LABELS: Record<string, string> = {
  CEO: "Chief Executive Officer",
  FOUNDER: "Founder",
  EXECUTIVE_DIRECTOR: "Executive Director of Schools",
  REGIONAL_DIRECTOR: "Regional Director",
  SCHOOL_LEADER: "School Leader",
  ADMINISTRATOR: "Administrator",
  ADMISSIONS: "Admissions",
  FINANCE: "Finance",
  ACCOUNTING: "Accounting",
  HR: "Human Resources",
  TEACHER: "Teacher",
  PARENT: "Parent",
  STUDENT: "Student",
  EMPLOYEE: "Employee",
  TEAM_MEMBER: "Team Member",
  BOARD_MEMBER: "Board Member",
};

export function buildFallbackBranding(organizationId: string, organizationName: string): OrganizationBranding {
  const monogram = organizationName.trim().charAt(0).toUpperCase() || "S";
  return {
    organizationId,
    organizationName,
    productName: organizationName,
    productTagline: GENERIC_BRANDING_DEFAULTS.product_tagline,
    editionLabel: GENERIC_BRANDING_DEFAULTS.edition_label,
    monogram,
    logoUrl: "",
    darkLogoUrl: "",
    faviconUrl: "",
    primaryColor: "#4F46E5",
    secondaryColor: "#0F172A",
    accentColor: "#10B981",
    founderWorkspaceLabel: GENERIC_BRANDING_DEFAULTS.founder_workspace_label,
    intelligenceEngineLabel: GENERIC_BRANDING_DEFAULTS.intelligence_engine_label,
    missionControlLabel: GENERIC_BRANDING_DEFAULTS.mission_control_label,
    complianceLabel: GENERIC_BRANDING_DEFAULTS.compliance_label,
    financialIntelligenceLabel: GENERIC_BRANDING_DEFAULTS.financial_intelligence_label,
    connectLabel: GENERIC_BRANDING_DEFAULTS.connect_label,
    dataHubLabel: GENERIC_BRANDING_DEFAULTS.data_hub_label,
    emailFromName: organizationName,
    supportModeLabel: GENERIC_BRANDING_DEFAULTS.support_mode_label,
    roleTitles: {},
  };
}
