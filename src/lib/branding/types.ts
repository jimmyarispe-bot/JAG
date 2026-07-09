/** Resolved organization branding consumed by UI surfaces. */
export interface OrganizationBranding {
  organizationId: string;
  organizationName: string;
  productName: string;
  productTagline: string;
  editionLabel: string;
  monogram: string;
  logoUrl: string;
  darkLogoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  founderWorkspaceLabel: string;
  intelligenceEngineLabel: string;
  missionControlLabel: string;
  complianceLabel: string;
  financialIntelligenceLabel: string;
  connectLabel: string;
  dataHubLabel: string;
  emailFromName: string;
  supportModeLabel: string;
  roleTitles: Record<string, string>;
}

export type BrandingSurfaceLabels = Pick<
  OrganizationBranding,
  | "founderWorkspaceLabel"
  | "intelligenceEngineLabel"
  | "missionControlLabel"
  | "complianceLabel"
  | "financialIntelligenceLabel"
  | "connectLabel"
  | "dataHubLabel"
  | "supportModeLabel"
>;

export const EXECUTIVE_ROLE_KEYS = [
  "CEO",
  "FOUNDER",
  "EXECUTIVE_DIRECTOR",
  "REGIONAL_DIRECTOR",
  "SCHOOL_LEADER",
] as const;

export type ExecutiveRoleKey = (typeof EXECUTIVE_ROLE_KEYS)[number];
