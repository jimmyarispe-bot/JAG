import {
  getExtension,
  invokeExtension,
  registerExtension,
  type AcademyExtensionAdapter,
} from "@/lib/workflows/extension";
import type { PaymentMethodType } from "./types";

export type PaymentProviderId = "square" | "stripe";

export interface ChargePaymentInput {
  amount: number;
  currency?: string;
  method: PaymentMethodType;
  invoiceId?: string;
  familyId?: string;
  description?: string;
  organizationId?: string | null;
  schoolId?: string | null;
  provider?: PaymentProviderId;
}

export interface ChargePaymentResult {
  ok: boolean;
  deferred: boolean;
  provider: string;
  externalId: string | null;
  message: string;
}

function makeDeferredPaymentAdapter(
  id: PaymentProviderId,
  name: string
): AcademyExtensionAdapter {
  return {
    manifest: {
      id,
      name,
      version: "0.0.0",
      capabilities: ["payments"],
      description: `${name} payment adapter — deferred until integration sprint`,
    },
    isConfigured: () => false,
    async invoke(input) {
      return {
        ok: true,
        deferred: true,
        message: `${name} ${input.operation} deferred — adapter not configured`,
        data: { externalId: null, status: "deferred" },
      };
    },
  };
}

export function ensurePaymentExtensionsRegistered(): void {
  if (!getExtension("square")) {
    registerExtension(makeDeferredPaymentAdapter("square", "Square"));
  }
  if (!getExtension("stripe")) {
    registerExtension(makeDeferredPaymentAdapter("stripe", "Stripe"));
  }
}

ensurePaymentExtensionsRegistered();

/** Card/ACH charge via provider abstraction — never live in RC7. */
export async function chargeViaProvider(
  input: ChargePaymentInput
): Promise<ChargePaymentResult> {
  ensurePaymentExtensionsRegistered();
  const provider = input.provider ?? "square";
  const result = await invokeExtension(provider, {
    capability: "payments",
    operation: "charge",
    organizationId: input.organizationId,
    schoolId: input.schoolId,
    payload: {
      amount: input.amount,
      currency: input.currency ?? "USD",
      method: input.method,
      invoiceId: input.invoiceId,
      familyId: input.familyId,
      description: input.description,
    },
  });

  return {
    ok: result.ok,
    deferred: result.deferred,
    provider,
    externalId: (result.data?.externalId as string | null) ?? null,
    message: result.message,
  };
}

export function isCardOrAchMethod(method: PaymentMethodType): boolean {
  return method === "credit_card" || method === "ach";
}

export function normalizePaymentMethod(raw: string | null | undefined): PaymentMethodType {
  const value = (raw ?? "other").toLowerCase().replace(/\s+/g, "_");
  const allowed: PaymentMethodType[] = [
    "cash",
    "check",
    "ach",
    "credit_card",
    "scholarship",
    "grant",
    "credit_balance",
    "manual_adjustment",
    "other",
  ];
  if (value === "card" || value === "cc") return "credit_card";
  if (allowed.includes(value as PaymentMethodType)) return value as PaymentMethodType;
  return "other";
}
