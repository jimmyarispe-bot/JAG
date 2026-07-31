import type { ConnectorDefinition } from "@/lib/connectors/types";

/**
 * Connector catalog — QuickBooks Online is the first production connector.
 * Remaining entries stay Available Soon / Coming Soon.
 */
export const CONNECTOR_CATALOG: readonly ConnectorDefinition[] = Object.freeze([
  // Finance
  Object.freeze({
    id: "quickbooks-online",
    displayName: "QuickBooks Online",
    category: "Finance" as const,
    description:
      "QuickBooks Online Connector™ — OAuth sync of financial reports into the Evidence Pipeline™.",
    version: "1.0.0",
    vendor: "Intuit",
    authenticationType: "OAuth 2.0" as const,
    availability: "available" as const,
    capabilities: Object.freeze(["read", "sync", "import"] as const),
    supportedSyncTypes: Object.freeze([
      "Manual",
      "Scheduled",
    ] as const),
    supportedEvidenceDomains: Object.freeze(["Financial Intelligence"]),
  }),
  def("xero", "Xero", "Finance", "Xero", "OAuth 2.0", ["Financial Intelligence"]),
  def("netsuite", "NetSuite", "Finance", "Oracle", "OAuth 2.0", [
    "Financial Intelligence",
  ]),
  def("sage", "Sage", "Finance", "Sage", "OAuth 2.0", ["Financial Intelligence"]),
  def("freshbooks", "FreshBooks", "Finance", "FreshBooks", "OAuth 2.0", [
    "Financial Intelligence",
  ]),
  // Productivity
  Object.freeze({
    id: "google-workspace",
    displayName: "Google Workspace",
    category: "Productivity" as const,
    description:
      "Google Workspace Connector™ — Drive evidence + Calendar/Gmail/Contacts metadata sync.",
    version: "1.0.0",
    vendor: "Google",
    authenticationType: "OAuth 2.0" as const,
    availability: "available" as const,
    capabilities: Object.freeze(["read", "sync", "import"] as const),
    supportedSyncTypes: Object.freeze([
      "Manual",
      "Scheduled",
    ] as const),
    supportedEvidenceDomains: Object.freeze([
      "Operations Intelligence",
      "General",
    ]),
  }),
  def("microsoft-365", "Microsoft 365", "Productivity", "Microsoft", "OAuth 2.0", [
    "Operations Intelligence",
    "General",
  ]),
  def("dropbox", "Dropbox", "Productivity", "Dropbox", "OAuth 2.0", ["General"]),
  def("box", "Box", "Productivity", "Box", "OAuth 2.0", ["General"]),
  // CRM
  def("hubspot", "HubSpot", "CRM", "HubSpot", "OAuth 2.0", [
    "Operations Intelligence",
  ]),
  def("salesforce", "Salesforce", "CRM", "Salesforce", "OAuth 2.0", [
    "Operations Intelligence",
  ]),
  def("zoho-crm", "Zoho CRM", "CRM", "Zoho", "OAuth 2.0", [
    "Operations Intelligence",
  ]),
  // HR
  def("bamboohr", "BambooHR", "HR", "BambooHR", "API Key", [
    "People Intelligence",
  ]),
  def("rippling", "Rippling", "HR", "Rippling", "OAuth 2.0", [
    "People Intelligence",
  ]),
  def("adp", "ADP", "HR", "ADP", "OAuth 2.0", ["People Intelligence"]),
  def("gusto", "Gusto", "HR", "Gusto", "OAuth 2.0", ["People Intelligence"]),
  // Payments
  def("stripe", "Stripe", "Payments", "Stripe", "API Key", [
    "Financial Intelligence",
  ]),
  def("square", "Square", "Payments", "Square", "OAuth 2.0", [
    "Financial Intelligence",
  ]),
  // Banking
  def("plaid", "Plaid", "Banking", "Plaid", "API Key", [
    "Financial Intelligence",
  ]),
  // Project Management
  def("jira", "Jira", "Project Management", "Atlassian", "OAuth 2.0", [
    "Operations Intelligence",
  ]),
  def("asana", "Asana", "Project Management", "Asana", "OAuth 2.0", [
    "Operations Intelligence",
  ]),
  def("monday", "Monday.com", "Project Management", "Monday.com", "API Key", [
    "Operations Intelligence",
  ]),
  // Education
  def("canvas-lms", "Canvas LMS", "Education", "Instructure", "OAuth 2.0", [
    "People Intelligence",
    "Operations Intelligence",
  ]),
  def("powerschool", "PowerSchool", "Education", "PowerSchool", "API Key", [
    "People Intelligence",
  ]),
  def("blackboard", "Blackboard", "Education", "Anthology", "OAuth 2.0", [
    "People Intelligence",
  ]),
  // Healthcare
  def("epic", "Epic", "Healthcare", "Epic", "OAuth 2.0", [
    "Operations Intelligence",
  ]),
  def("cerner", "Oracle Health (Cerner)", "Healthcare", "Oracle", "OAuth 2.0", [
    "Operations Intelligence",
  ]),
  // Real Estate
  def("mls-reso", "MLS / RESO", "Real Estate", "RESO", "API Key", [
    "Operations Intelligence",
  ]),
  def("appfolio", "AppFolio", "Real Estate", "AppFolio", "API Key", [
    "Financial Intelligence",
    "Operations Intelligence",
  ]),
  // Manufacturing
  def("sap-s4", "SAP S/4HANA", "Manufacturing", "SAP", "OAuth 2.0", [
    "Operations Intelligence",
    "Financial Intelligence",
  ]),
  def("oracle-netsuite-mfg", "NetSuite Manufacturing", "Manufacturing", "Oracle", "OAuth 2.0", [
    "Operations Intelligence",
  ]),
  // Nonprofit
  def("bloomerang", "Bloomerang", "Nonprofit", "Bloomerang", "API Key", [
    "Operations Intelligence",
    "Financial Intelligence",
  ]),
  def("salesforce-np", "Salesforce Nonprofit Cloud", "Nonprofit", "Salesforce", "OAuth 2.0", [
    "Operations Intelligence",
  ]),
]);

function def(
  id: string,
  displayName: string,
  category: ConnectorDefinition["category"],
  vendor: string,
  authenticationType: ConnectorDefinition["authenticationType"],
  domains: readonly string[]
): ConnectorDefinition {
  return Object.freeze({
    id,
    displayName,
    category,
    description: `${displayName} connector for The JAG™ — Available Soon.`,
    version: "0.0.0-framework",
    vendor,
    authenticationType,
    availability: "coming_soon",
    capabilities: Object.freeze(["read", "sync"] as const),
    supportedSyncTypes: Object.freeze([
      "Manual",
      "Scheduled",
    ] as const),
    supportedEvidenceDomains: Object.freeze([...domains]),
  });
}

export function listCatalogByCategory(): Readonly<
  Record<string, readonly ConnectorDefinition[]>
> {
  const grouped: Record<string, ConnectorDefinition[]> = {};
  for (const connector of CONNECTOR_CATALOG) {
    const list = grouped[connector.category] ?? [];
    list.push(connector);
    grouped[connector.category] = list;
  }
  return Object.freeze(
    Object.fromEntries(
      Object.entries(grouped).map(([k, v]) => [k, Object.freeze(v)])
    )
  );
}
