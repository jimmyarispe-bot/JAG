/**
 * Minimal Listening Intelligence repository (Slice 1).
 * Authenticated admin operations — organization scope must be validated by caller
 * via Foundation II (assertSessionCanAccessOrganization) before invoke.
 *
 * Public collection uses RPCs resolve_public_listening_campaign / submit_listening_response.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  hashListeningTokenHex,
  isListeningTokenShapeValid,
  mintListeningCampaignToken,
} from "./tokens";
import type {
  ListeningCampaignStatus,
  ListeningInitiativeStatus,
  ListeningPrivacyMode,
  ListeningPublicCampaignContract,
  ListeningQuestionType,
  ListeningSubmitAnswerInput,
  ListeningSubmitResult,
  ListeningVersionStatus,
} from "./types";

type Db = SupabaseClient;

function requireOrgId(organizationId: string): string {
  const id = organizationId?.trim();
  if (!id) throw new Error("listening_organization_required");
  return id;
}

export async function createListeningInitiative(
  db: Db,
  input: {
    organizationId: string;
    title: string;
    purpose?: string;
    createdBy?: string | null;
    status?: ListeningInitiativeStatus;
  }
) {
  const organizationId = requireOrgId(input.organizationId);
  const { data, error } = await db
    .from("listening_initiatives")
    .insert({
      organization_id: organizationId,
      title: input.title.trim(),
      purpose: input.purpose?.trim() ?? "",
      created_by: input.createdBy ?? null,
      status: input.status ?? "draft",
    })
    .select("id, organization_id, title, purpose, status, created_at")
    .single();
  if (error) throw error;
  return data;
}

export async function listListeningInitiatives(
  db: Db,
  organizationId: string
) {
  const org = requireOrgId(organizationId);
  const { data, error } = await db
    .from("listening_initiatives")
    .select("id, organization_id, title, purpose, status, created_at, updated_at")
    .eq("organization_id", org)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getListeningInitiative(
  db: Db,
  organizationId: string,
  initiativeId: string
) {
  const org = requireOrgId(organizationId);
  const { data, error } = await db
    .from("listening_initiatives")
    .select("*")
    .eq("organization_id", org)
    .eq("id", initiativeId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createListeningInstrument(
  db: Db,
  input: {
    organizationId: string;
    initiativeId?: string | null;
    title: string;
    description?: string;
    createdBy?: string | null;
  }
) {
  const organizationId = requireOrgId(input.organizationId);
  const { data, error } = await db
    .from("listening_instruments")
    .insert({
      organization_id: organizationId,
      initiative_id: input.initiativeId ?? null,
      title: input.title.trim(),
      description: input.description?.trim() ?? "",
      created_by: input.createdBy ?? null,
    })
    .select("id, organization_id, initiative_id, title, created_at")
    .single();
  if (error) throw error;
  return data;
}

export async function createListeningInstrumentVersion(
  db: Db,
  input: {
    organizationId: string;
    instrumentId: string;
    versionNo: number;
    createdBy?: string | null;
    status?: ListeningVersionStatus;
  }
) {
  const organizationId = requireOrgId(input.organizationId);
  const { data, error } = await db
    .from("listening_instrument_versions")
    .insert({
      organization_id: organizationId,
      instrument_id: input.instrumentId,
      version_no: input.versionNo,
      status: input.status ?? "draft",
      created_by: input.createdBy ?? null,
    })
    .select("id, organization_id, instrument_id, version_no, status")
    .single();
  if (error) throw error;
  return data;
}

export async function addListeningQuestion(
  db: Db,
  input: {
    organizationId: string;
    instrumentVersionId: string;
    questionKey: string;
    questionType: ListeningQuestionType;
    prompt: string;
    helpText?: string;
    required?: boolean;
    displayOrder?: number;
    config?: Record<string, unknown>;
  }
) {
  const organizationId = requireOrgId(input.organizationId);
  const { data, error } = await db
    .from("listening_questions")
    .insert({
      organization_id: organizationId,
      instrument_version_id: input.instrumentVersionId,
      question_key: input.questionKey.trim(),
      question_type: input.questionType,
      prompt: input.prompt.trim(),
      help_text: input.helpText?.trim() ?? "",
      required: input.required ?? true,
      display_order: input.displayOrder ?? 0,
      config: input.config ?? {},
    })
    .select("id, organization_id, instrument_version_id, question_key, question_type")
    .single();
  if (error) throw error;
  return data;
}

export async function publishListeningInstrumentVersion(
  db: Db,
  organizationId: string,
  versionId: string
) {
  const org = requireOrgId(organizationId);
  const { data, error } = await db
    .from("listening_instrument_versions")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", org)
    .eq("id", versionId)
    .eq("status", "draft")
    .select("id, status, published_at")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("listening_version_not_draft");
  return data;
}

/**
 * Create campaign and mint public token.
 * Returns plaintext token once for distribution; only hash is persisted.
 */
export async function createListeningCampaignWithToken(
  db: Db,
  input: {
    organizationId: string;
    initiativeId: string;
    instrumentVersionId: string;
    title: string;
    introduction?: string;
    privacyStatement?: string;
    privacyMode?: ListeningPrivacyMode;
    status?: ListeningCampaignStatus;
    createdBy?: string | null;
    opensAt?: string | null;
    closesAt?: string | null;
  }
): Promise<{ campaign: Record<string, unknown>; publicToken: string }> {
  const organizationId = requireOrgId(input.organizationId);
  const publicToken = mintListeningCampaignToken();
  const public_token_hash = hashListeningTokenHex(publicToken);

  const { data, error } = await db
    .from("listening_campaigns")
    .insert({
      organization_id: organizationId,
      initiative_id: input.initiativeId,
      instrument_version_id: input.instrumentVersionId,
      title: input.title.trim(),
      introduction: input.introduction?.trim() ?? "",
      privacy_statement: input.privacyStatement?.trim() ?? "",
      privacy_mode: input.privacyMode ?? "anonymous",
      status: input.status ?? "draft",
      public_token_hash,
      created_by: input.createdBy ?? null,
      opens_at: input.opensAt ?? null,
      closes_at: input.closesAt ?? null,
    })
    .select(
      "id, organization_id, initiative_id, instrument_version_id, title, status, privacy_mode, created_at"
    )
    .single();
  if (error) throw error;
  return { campaign: data, publicToken };
}

/** Public RPC — token-derived org; never pass organizationId as authorization. */
export async function resolvePublicListeningCampaign(
  db: Db,
  token: string
): Promise<ListeningPublicCampaignContract> {
  if (!isListeningTokenShapeValid(token)) {
    throw new Error("listening_token_invalid");
  }
  const { data, error } = await db.rpc("resolve_public_listening_campaign", {
    p_token: token.trim(),
  });
  if (error) throw error;
  return data as ListeningPublicCampaignContract;
}

/** Public RPC — organization derived server-side from campaign token. */
export async function submitPublicListeningResponse(
  db: Db,
  token: string,
  answers: readonly ListeningSubmitAnswerInput[]
): Promise<ListeningSubmitResult> {
  if (!isListeningTokenShapeValid(token)) {
    throw new Error("listening_token_invalid");
  }
  const { data, error } = await db.rpc("submit_listening_response", {
    p_token: token.trim(),
    p_answers: answers,
  });
  if (error) throw error;
  return data as ListeningSubmitResult;
}
