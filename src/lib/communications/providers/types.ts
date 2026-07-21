export type ProviderChannel = "email" | "sms" | "portal" | "push";

export interface ProviderSendInput {
  channel: ProviderChannel;
  to: Array<{ email?: string | null; phone?: string | null; userId?: string | null; name?: string | null }>;
  subject?: string | null;
  bodyText?: string | null;
  bodyHtml?: string | null;
  metadata?: Record<string, unknown>;
}

export interface ProviderSendResult {
  ok: boolean;
  provider: string;
  deferred: boolean;
  message: string;
  externalId?: string | null;
}

export interface CommunicationProviderAdapter {
  id: string;
  channel: ProviderChannel;
  isConfigured(): boolean;
  send(input: ProviderSendInput): Promise<ProviderSendResult>;
}
