import {
  getExtension,
  invokeExtension,
  registerExtension,
  type AcademyExtensionAdapter,
} from "@/lib/workflows/extension";

export type AccountingProviderId =
  | "quickbooks_online"
  | "xero"
  | "netsuite"
  | "sage";

export interface AccountingSyncInput {
  operation: "export_invoice" | "export_payment" | "sync_customers" | "export_ledger";
  organizationId?: string | null;
  schoolId?: string | null;
  provider?: AccountingProviderId;
  payload?: Record<string, unknown>;
}

export interface AccountingSyncResult {
  ok: boolean;
  deferred: boolean;
  provider: string;
  message: string;
  externalId: string | null;
}

const PROVIDERS: Array<[AccountingProviderId, string]> = [
  ["quickbooks_online", "QuickBooks Online"],
  ["xero", "Xero"],
  ["netsuite", "NetSuite"],
  ["sage", "Sage"],
];

function makeDeferredAccountingAdapter(
  id: AccountingProviderId,
  name: string
): AcademyExtensionAdapter {
  return {
    manifest: {
      id,
      name,
      version: "0.0.0",
      capabilities: ["accounting"],
      description: `${name} accounting adapter — deferred until integration sprint`,
    },
    isConfigured: () => false,
    async invoke(input) {
      return {
        ok: true,
        deferred: true,
        message: `${name} ${input.operation} deferred — adapter not configured`,
        data: { externalId: null },
      };
    },
  };
}

export function ensureAccountingExtensionsRegistered(): void {
  for (const [id, name] of PROVIDERS) {
    if (!getExtension(id)) {
      registerExtension(makeDeferredAccountingAdapter(id, name));
    }
  }
}

ensureAccountingExtensionsRegistered();

export async function syncAccounting(
  input: AccountingSyncInput
): Promise<AccountingSyncResult> {
  ensureAccountingExtensionsRegistered();
  const provider = input.provider ?? "quickbooks_online";
  const result = await invokeExtension(provider, {
    capability: "accounting",
    operation: input.operation,
    organizationId: input.organizationId,
    schoolId: input.schoolId,
    payload: input.payload,
  });

  return {
    ok: result.ok,
    deferred: result.deferred,
    provider,
    message: result.message,
    externalId: (result.data?.externalId as string | null) ?? null,
  };
}
