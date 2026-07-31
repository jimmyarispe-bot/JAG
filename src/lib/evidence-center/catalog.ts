/** Placeholder connected systems — no live integrations this sprint. */

export type ConnectedSystemCard = {
  readonly id: string;
  readonly name: string;
  readonly connected: boolean;
};

export const CONNECTED_SYSTEM_PLACEHOLDERS: readonly ConnectedSystemCard[] =
  Object.freeze([
    { id: "quickbooks", name: "QuickBooks", connected: false },
    { id: "google-workspace", name: "Google Workspace", connected: false },
    { id: "microsoft-365", name: "Microsoft 365", connected: false },
    { id: "salesforce", name: "Salesforce", connected: false },
    { id: "hubspot", name: "HubSpot", connected: false },
    { id: "stripe", name: "Stripe", connected: false },
    { id: "square", name: "Square", connected: false },
    { id: "plaid", name: "Plaid", connected: false },
  ]);

export const KNOWLEDGE_LIBRARY_CATEGORIES = Object.freeze([
  "Policies",
  "Procedures",
  "Strategic Plans",
  "Board Minutes",
  "Contracts",
  "Research",
  "Employee Handbook",
] as const);
