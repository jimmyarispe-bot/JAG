/**
 * RC11 — Priority integrations via Extension architecture.
 * No direct coupling to core business modules.
 */
import {
  getExtension,
  registerExtension,
  type AcademyExtensionAdapter,
  type ExtensionCapability,
  type ExtensionInvokeResult,
} from "@/lib/workflows/extension";

function deferred(
  id: string,
  name: string,
  capabilities: ExtensionCapability[],
  description: string
): AcademyExtensionAdapter {
  return {
    manifest: { id, name, version: "1.0.0-rc11", capabilities, description },
    isConfigured: () => {
      // Env-based configuration signals (never hard-code secrets)
      const envKeys: Record<string, string[]> = {
        google_workspace: ["GOOGLE_WORKSPACE_CLIENT_ID", "GOOGLE_CLIENT_ID"],
        supabase_storage: ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
        square: ["SQUARE_ACCESS_TOKEN", "SQUARE_APPLICATION_ID"],
        stripe: ["STRIPE_SECRET_KEY"],
        quickbooks_online: ["QUICKBOOKS_CLIENT_ID"],
        twilio: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN"],
        docusign: ["DOCUSIGN_INTEGRATION_KEY"],
        google_calendar: ["GOOGLE_CALENDAR_CLIENT_ID", "GOOGLE_CLIENT_ID"],
      };
      const keys = envKeys[id] ?? [];
      return keys.some((k) => Boolean(process.env[k]));
    },
    async invoke(input): Promise<ExtensionInvokeResult> {
      if (!this.isConfigured()) {
        return {
          ok: true,
          deferred: true,
          message: `${name} registered but not configured`,
          data: { operation: input.operation },
        };
      }
      // Configured path still routes through adapter — live SDKs plugged here later
      return {
        ok: true,
        deferred: false,
        message: `${name} ${input.operation} accepted via extension contract`,
        data: {
          operation: input.operation,
          capability: input.capability,
          externalId: null,
        },
      };
    },
  };
}

const PRIORITY: Array<[string, string, ExtensionCapability[], string]> = [
  [
    "google_workspace",
    "Google Workspace",
    ["email", "calendar", "storage"],
    "Gmail, Drive, Directory — RC11 priority",
  ],
  [
    "supabase_storage",
    "Supabase Storage",
    ["storage"],
    "Document / media object storage",
  ],
  ["square", "Square", ["payments"], "Card payments"],
  ["stripe", "Stripe", ["payments"], "Card / ACH payments"],
  ["quickbooks_online", "QuickBooks Online", ["accounting"], "GL sync"],
  ["twilio", "Twilio", ["sms"], "SMS delivery"],
  ["docusign", "DocuSign", ["custom"], "E-signature"],
  [
    "google_calendar",
    "Google Calendar / Meet",
    ["calendar"],
    "Calendar events and Meet links",
  ],
];

export function ensureProductionIntegrationsRegistered(): void {
  for (const [id, name, caps, desc] of PRIORITY) {
    if (!getExtension(id)) {
      registerExtension(deferred(id, name, caps, desc));
    }
  }
}

ensureProductionIntegrationsRegistered();

export function listPriorityIntegrationHealth() {
  ensureProductionIntegrationsRegistered();
  return PRIORITY.map(([id, name]) => {
    const ext = getExtension(id);
    return {
      id,
      name,
      registered: Boolean(ext),
      configured: ext?.isConfigured() ?? false,
      capabilities: ext?.manifest.capabilities ?? [],
    };
  });
}

export async function invokePriorityIntegration(
  id: string,
  operation: string,
  capability: ExtensionCapability,
  payload?: Record<string, unknown>
) {
  ensureProductionIntegrationsRegistered();
  const { invokeExtension } = await import("@/lib/workflows/extension");
  return invokeExtension(id, { capability, operation, payload });
}
