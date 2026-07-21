import {
  getExtension,
  invokeExtension,
  registerExtension,
  type AcademyExtensionAdapter,
} from "@/lib/workflows/extension";

export type EsignProviderId = "docusign" | "dropbox_sign" | "adobe_sign";

export interface EsignRequestInput {
  documentId: string;
  title: string;
  fileUrl?: string | null;
  signers?: Array<{ name: string; email: string }>;
  organizationId?: string | null;
  schoolId?: string | null;
  provider?: EsignProviderId;
}

export interface EsignResult {
  ok: boolean;
  deferred: boolean;
  provider: string;
  externalId: string | null;
  message: string;
}

function makeDeferredAdapter(id: EsignProviderId, name: string): AcademyExtensionAdapter {
  return {
    manifest: {
      id,
      name,
      version: "0.0.0",
      capabilities: ["storage", "custom"],
      description: `${name} e-signature adapter — deferred until integration sprint`,
    },
    isConfigured: () => false,
    async invoke(input) {
      return {
        ok: true,
        deferred: true,
        message: `${name} ${input.operation} deferred — adapter not configured`,
        data: { externalId: null, status: "requested" },
      };
    },
  };
}

const PROVIDERS: Array<[EsignProviderId, string]> = [
  ["docusign", "DocuSign"],
  ["dropbox_sign", "Dropbox Sign"],
  ["adobe_sign", "Adobe Acrobat Sign"],
];

export function ensureEsignExtensionsRegistered(): void {
  for (const [id, name] of PROVIDERS) {
    if (!getExtension(id)) {
      registerExtension(makeDeferredAdapter(id, name));
    }
  }
}

ensureEsignExtensionsRegistered();

export async function requestSignature(input: EsignRequestInput): Promise<EsignResult> {
  ensureEsignExtensionsRegistered();
  const provider = input.provider ?? "docusign";
  const result = await invokeExtension(provider, {
    capability: "custom",
    operation: "request_signature",
    organizationId: input.organizationId,
    schoolId: input.schoolId,
    payload: {
      documentId: input.documentId,
      title: input.title,
      fileUrl: input.fileUrl,
      signers: input.signers ?? [],
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
