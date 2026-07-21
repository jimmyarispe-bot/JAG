/**
 * AcademyOS Extension / Plugin Contract (RC4 foundation)
 *
 * Future capabilities (Google Workspace, QuickBooks, Square, Twilio, AI providers)
 * should integrate through this contract rather than calling core modules directly.
 */

export type ExtensionCapability =
  | "email"
  | "sms"
  | "calendar"
  | "payments"
  | "accounting"
  | "storage"
  | "ai"
  | "webhook"
  | "custom";

export interface ExtensionManifest {
  id: string;
  name: string;
  version: string;
  capabilities: ExtensionCapability[];
  description?: string;
}

export interface ExtensionInvokeInput {
  capability: ExtensionCapability;
  operation: string;
  organizationId?: string | null;
  schoolId?: string | null;
  payload?: Record<string, unknown>;
}

export interface ExtensionInvokeResult {
  ok: boolean;
  deferred: boolean;
  message: string;
  data?: Record<string, unknown>;
}

export interface AcademyExtensionAdapter {
  manifest: ExtensionManifest;
  isConfigured(): boolean;
  invoke(input: ExtensionInvokeInput): Promise<ExtensionInvokeResult>;
}

const registry = new Map<string, AcademyExtensionAdapter>();

export function registerExtension(adapter: AcademyExtensionAdapter): void {
  registry.set(adapter.manifest.id, adapter);
}

export function getExtension(id: string): AcademyExtensionAdapter | undefined {
  return registry.get(id);
}

export function listExtensions(): AcademyExtensionAdapter[] {
  return [...registry.values()];
}

export async function invokeExtension(
  id: string,
  input: ExtensionInvokeInput
): Promise<ExtensionInvokeResult> {
  const adapter = registry.get(id);
  if (!adapter) {
    return {
      ok: false,
      deferred: true,
      message: `Extension "${id}" is not registered`,
    };
  }
  if (!adapter.isConfigured()) {
    return {
      ok: true,
      deferred: true,
      message: `Extension "${id}" is registered but not configured`,
    };
  }
  return adapter.invoke(input);
}

/** Built-in placeholder adapters — replace in integration sprints. */
registerExtension({
  manifest: {
    id: "twilio",
    name: "Twilio",
    version: "0.0.0",
    capabilities: ["sms"],
    description: "SMS delivery — configure in integration sprint",
  },
  isConfigured: () => false,
  async invoke() {
    return {
      ok: true,
      deferred: true,
      message: "Twilio extension stub — not configured",
    };
  },
});

registerExtension({
  manifest: {
    id: "gmail",
    name: "Gmail",
    version: "0.0.0",
    capabilities: ["email"],
    description: "Gmail send/sync — configure in integration sprint",
  },
  isConfigured: () => false,
  async invoke() {
    return {
      ok: true,
      deferred: true,
      message: "Gmail extension stub — not configured",
    };
  },
});

registerExtension({
  manifest: {
    id: "square",
    name: "Square",
    version: "0.0.0",
    capabilities: ["payments"],
    description: "Payments — configure in integration sprint",
  },
  isConfigured: () => false,
  async invoke() {
    return {
      ok: true,
      deferred: true,
      message: "Square extension stub — not configured",
    };
  },
});

registerExtension({
  manifest: {
    id: "stripe",
    name: "Stripe",
    version: "0.0.0",
    capabilities: ["payments"],
    description: "Card / ACH payments — configure in integration sprint",
  },
  isConfigured: () => false,
  async invoke() {
    return {
      ok: true,
      deferred: true,
      message: "Stripe extension stub — not configured",
    };
  },
});

registerExtension({
  manifest: {
    id: "quickbooks_online",
    name: "QuickBooks Online",
    version: "0.0.0",
    capabilities: ["accounting"],
    description: "Accounting sync — configure in integration sprint",
  },
  isConfigured: () => false,
  async invoke() {
    return {
      ok: true,
      deferred: true,
      message: "QuickBooks Online extension stub — not configured",
    };
  },
});
