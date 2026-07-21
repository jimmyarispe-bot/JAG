import {
  getExtension,
  invokeExtension,
  registerExtension,
  type AcademyExtensionAdapter,
} from "@/lib/workflows/extension";

export type HrisProviderId =
  | "adp"
  | "paychex"
  | "bamboohr"
  | "ukg"
  | "rippling";

const PROVIDERS: Array<[HrisProviderId, string]> = [
  ["adp", "ADP"],
  ["paychex", "Paychex"],
  ["bamboohr", "BambooHR"],
  ["ukg", "UKG"],
  ["rippling", "Rippling"],
];

function makeDeferredHrisAdapter(
  id: HrisProviderId,
  name: string
): AcademyExtensionAdapter {
  return {
    manifest: {
      id,
      name,
      version: "0.0.0",
      capabilities: ["custom"],
      description: `${name} HRIS / payroll adapter — deferred until integration sprint`,
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

export function ensureHrisExtensionsRegistered(): void {
  for (const [id, name] of PROVIDERS) {
    if (!getExtension(id)) {
      registerExtension(makeDeferredHrisAdapter(id, name));
    }
  }
}

ensureHrisExtensionsRegistered();

export async function syncHrisProvider(input: {
  provider?: HrisProviderId;
  operation: "sync_employees" | "sync_payroll" | "sync_time_off" | "export_hire";
  organizationId?: string | null;
  schoolId?: string | null;
  payload?: Record<string, unknown>;
}) {
  ensureHrisExtensionsRegistered();
  const provider = input.provider ?? "adp";
  return invokeExtension(provider, {
    capability: "custom",
    operation: input.operation,
    organizationId: input.organizationId,
    schoolId: input.schoolId,
    payload: input.payload,
  });
}
