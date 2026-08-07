/**
 * Listening Intelligence repository.
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
import {
  mergeQuestionConfig,
  parseListeningSections,
  serializeListeningSections,
  type ListeningQuestionConfig,
  type ListeningSection,
} from "./authoring";
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

function slugKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
}

// ---------------------------------------------------------------------------
// Initiatives
// ---------------------------------------------------------------------------

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
    .select(
      "id, organization_id, title, purpose, status, created_by, created_at, updated_at, archived_at"
    )
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
    .select(
      "id, organization_id, title, purpose, status, created_by, created_at, updated_at, archived_at"
    )
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

export async function updateListeningInitiative(
  db: Db,
  input: {
    organizationId: string;
    initiativeId: string;
    title?: string;
    purpose?: string;
    status?: ListeningInitiativeStatus;
  }
) {
  const org = requireOrgId(input.organizationId);
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.purpose !== undefined) patch.purpose = input.purpose.trim();
  if (input.status !== undefined) {
    patch.status = input.status;
    if (input.status === "archived") {
      patch.archived_at = new Date().toISOString();
    }
  }
  const { data, error } = await db
    .from("listening_initiatives")
    .update(patch)
    .eq("organization_id", org)
    .eq("id", input.initiativeId)
    .select(
      "id, organization_id, title, purpose, status, created_at, updated_at, archived_at"
    )
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("listening_initiative_not_found");
  return data;
}

export async function archiveListeningInitiative(
  db: Db,
  organizationId: string,
  initiativeId: string
) {
  return updateListeningInitiative(db, {
    organizationId,
    initiativeId,
    status: "archived",
  });
}

// ---------------------------------------------------------------------------
// Instruments
// ---------------------------------------------------------------------------

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
    .select(
      "id, organization_id, initiative_id, title, description, created_by, created_at, updated_at"
    )
    .single();
  if (error) throw error;
  return data;
}

export async function listListeningInstruments(
  db: Db,
  organizationId: string,
  initiativeId?: string | null
) {
  const org = requireOrgId(organizationId);
  let q = db
    .from("listening_instruments")
    .select(
      "id, organization_id, initiative_id, title, description, created_by, created_at, updated_at"
    )
    .eq("organization_id", org)
    .order("created_at", { ascending: false });
  if (initiativeId) q = q.eq("initiative_id", initiativeId);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function getListeningInstrument(
  db: Db,
  organizationId: string,
  instrumentId: string
) {
  const org = requireOrgId(organizationId);
  const { data, error } = await db
    .from("listening_instruments")
    .select("*")
    .eq("organization_id", org)
    .eq("id", instrumentId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateListeningInstrument(
  db: Db,
  input: {
    organizationId: string;
    instrumentId: string;
    title?: string;
    description?: string;
  }
) {
  const org = requireOrgId(input.organizationId);
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.description !== undefined) {
    patch.description = input.description.trim();
  }
  const { data, error } = await db
    .from("listening_instruments")
    .update(patch)
    .eq("organization_id", org)
    .eq("id", input.instrumentId)
    .select(
      "id, organization_id, initiative_id, title, description, created_at, updated_at"
    )
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("listening_instrument_not_found");
  return data;
}

export async function deleteListeningInstrument(
  db: Db,
  organizationId: string,
  instrumentId: string
) {
  const org = requireOrgId(organizationId);
  const versions = await listListeningInstrumentVersions(db, org, instrumentId);
  const hasPublished = versions.some((v) => v.status !== "draft");
  if (hasPublished) {
    throw new Error("listening_instrument_has_published_versions");
  }
  const { error } = await db
    .from("listening_instruments")
    .delete()
    .eq("organization_id", org)
    .eq("id", instrumentId);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Versions
// ---------------------------------------------------------------------------

export async function createListeningInstrumentVersion(
  db: Db,
  input: {
    organizationId: string;
    instrumentId: string;
    versionNo?: number;
    createdBy?: string | null;
    status?: ListeningVersionStatus;
  }
) {
  const organizationId = requireOrgId(input.organizationId);
  let versionNo = input.versionNo;
  if (versionNo == null) {
    const existing = await listListeningInstrumentVersions(
      db,
      organizationId,
      input.instrumentId
    );
    versionNo =
      existing.reduce((max, v) => Math.max(max, Number(v.version_no) || 0), 0) +
      1;
  }
  const { data, error } = await db
    .from("listening_instrument_versions")
    .insert({
      organization_id: organizationId,
      instrument_id: input.instrumentId,
      version_no: versionNo,
      status: input.status ?? "draft",
      created_by: input.createdBy ?? null,
    })
    .select(
      "id, organization_id, instrument_id, version_no, status, published_at, created_by, created_at"
    )
    .single();
  if (error) throw error;
  return data;
}

export async function listListeningInstrumentVersions(
  db: Db,
  organizationId: string,
  instrumentId: string
) {
  const org = requireOrgId(organizationId);
  const { data, error } = await db
    .from("listening_instrument_versions")
    .select(
      "id, organization_id, instrument_id, version_no, status, published_at, created_by, created_at"
    )
    .eq("organization_id", org)
    .eq("instrument_id", instrumentId)
    .order("version_no", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getListeningInstrumentVersion(
  db: Db,
  organizationId: string,
  versionId: string
) {
  const org = requireOrgId(organizationId);
  const { data, error } = await db
    .from("listening_instrument_versions")
    .select("*")
    .eq("organization_id", org)
    .eq("id", versionId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function publishListeningInstrumentVersion(
  db: Db,
  organizationId: string,
  versionId: string
) {
  const org = requireOrgId(organizationId);
  const questions = await listListeningQuestions(db, org, versionId);
  if (questions.length === 0) {
    throw new Error("listening_version_empty");
  }
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
    .select("id, status, published_at, version_no, instrument_id")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("listening_version_not_draft");
  return data;
}

export async function retireListeningInstrumentVersion(
  db: Db,
  organizationId: string,
  versionId: string
) {
  const org = requireOrgId(organizationId);
  const { data, error } = await db
    .from("listening_instrument_versions")
    .update({
      status: "retired",
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", org)
    .eq("id", versionId)
    .eq("status", "published")
    .select("id, status, version_no, instrument_id")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("listening_version_not_published");
  return data;
}

/** Persist section definitions on version.metadata (no schema change). */
export async function updateListeningVersionSections(
  db: Db,
  organizationId: string,
  versionId: string,
  sections: readonly ListeningSection[]
) {
  const org = requireOrgId(organizationId);
  await assertVersionIsDraft(db, org, versionId);
  const version = await getListeningInstrumentVersion(db, org, versionId);
  if (!version) throw new Error("listening_version_not_found");
  const metadata =
    version.metadata && typeof version.metadata === "object"
      ? { ...(version.metadata as Record<string, unknown>) }
      : {};
  Object.assign(metadata, serializeListeningSections(sections));
  const { data, error } = await db
    .from("listening_instrument_versions")
    .update({
      metadata,
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", org)
    .eq("id", versionId)
    .eq("status", "draft")
    .select("id, metadata, status")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("listening_version_not_draft");
  return parseListeningSections(data.metadata);
}

export async function listListeningCampaignsForVersion(
  db: Db,
  organizationId: string,
  instrumentVersionId: string
) {
  const org = requireOrgId(organizationId);
  const { data, error } = await db
    .from("listening_campaigns")
    .select(
      "id, organization_id, initiative_id, instrument_version_id, title, status, privacy_mode, opens_at, closes_at, created_at"
    )
    .eq("organization_id", org)
    .eq("instrument_version_id", instrumentVersionId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

async function assertVersionIsDraft(
  db: Db,
  organizationId: string,
  versionId: string
) {
  const version = await getListeningInstrumentVersion(
    db,
    organizationId,
    versionId
  );
  if (!version) throw new Error("listening_version_not_found");
  if (version.status !== "draft") {
    throw new Error("listening_instrument_version_locked");
  }
  return version;
}

// ---------------------------------------------------------------------------
// Questions + options
// ---------------------------------------------------------------------------

export async function listListeningQuestions(
  db: Db,
  organizationId: string,
  instrumentVersionId: string
) {
  const org = requireOrgId(organizationId);
  const { data: questions, error } = await db
    .from("listening_questions")
    .select(
      "id, organization_id, instrument_version_id, question_key, question_type, prompt, help_text, required, display_order, config, created_at"
    )
    .eq("organization_id", org)
    .eq("instrument_version_id", instrumentVersionId)
    .order("display_order", { ascending: true });
  if (error) throw error;
  const rows = questions ?? [];
  if (rows.length === 0) return [];

  const ids = rows.map((q) => q.id);
  const { data: options, error: optErr } = await db
    .from("listening_question_options")
    .select(
      "id, organization_id, question_id, option_key, label, display_order, value_numeric"
    )
    .eq("organization_id", org)
    .in("question_id", ids)
    .order("display_order", { ascending: true });
  if (optErr) throw optErr;

  const byQuestion = new Map<string, typeof options>();
  for (const opt of options ?? []) {
    const list = byQuestion.get(opt.question_id) ?? [];
    list.push(opt);
    byQuestion.set(opt.question_id, list);
  }
  return rows.map((q) => ({
    ...q,
    options: byQuestion.get(q.id) ?? [],
  }));
}

export async function addListeningQuestion(
  db: Db,
  input: {
    organizationId: string;
    instrumentVersionId: string;
    questionKey?: string;
    questionType: ListeningQuestionType;
    prompt: string;
    helpText?: string;
    required?: boolean;
    displayOrder?: number;
    config?: Record<string, unknown>;
    options?: readonly { optionKey?: string; label: string; valueNumeric?: number | null }[];
  }
) {
  const organizationId = requireOrgId(input.organizationId);
  await assertVersionIsDraft(db, organizationId, input.instrumentVersionId);

  const existing = await listListeningQuestions(
    db,
    organizationId,
    input.instrumentVersionId
  );
  const displayOrder =
    input.displayOrder ??
    existing.reduce((max, q) => Math.max(max, Number(q.display_order) || 0), 0) +
      1;
  const questionKey =
    input.questionKey?.trim() ||
    slugKey(input.prompt) ||
    `q_${displayOrder}`;

  const { data, error } = await db
    .from("listening_questions")
    .insert({
      organization_id: organizationId,
      instrument_version_id: input.instrumentVersionId,
      question_key: questionKey,
      question_type: input.questionType,
      prompt: input.prompt.trim(),
      help_text: input.helpText?.trim() ?? "",
      required: input.required ?? true,
      display_order: displayOrder,
      config: input.config ?? {},
    })
    .select(
      "id, organization_id, instrument_version_id, question_key, question_type, prompt, required, display_order"
    )
    .single();
  if (error) throw error;

  if (input.options?.length) {
    for (let i = 0; i < input.options.length; i++) {
      const opt = input.options[i]!;
      await addListeningQuestionOption(db, {
        organizationId,
        questionId: data.id,
        optionKey: opt.optionKey || `opt_${i + 1}`,
        label: opt.label,
        displayOrder: i + 1,
        valueNumeric: opt.valueNumeric ?? null,
      });
    }
  }
  return data;
}

export async function updateListeningQuestion(
  db: Db,
  input: {
    organizationId: string;
    questionId: string;
    prompt?: string;
    helpText?: string;
    required?: boolean;
    displayOrder?: number;
    questionType?: ListeningQuestionType;
    configPatch?: ListeningQuestionConfig;
  }
) {
  const org = requireOrgId(input.organizationId);
  const { data: existing, error: findErr } = await db
    .from("listening_questions")
    .select("id, instrument_version_id, config")
    .eq("organization_id", org)
    .eq("id", input.questionId)
    .maybeSingle();
  if (findErr) throw findErr;
  if (!existing) throw new Error("listening_question_not_found");
  await assertVersionIsDraft(db, org, existing.instrument_version_id);

  const patch: Record<string, unknown> = {};
  if (input.prompt !== undefined) patch.prompt = input.prompt.trim();
  if (input.helpText !== undefined) patch.help_text = input.helpText.trim();
  if (input.required !== undefined) patch.required = input.required;
  if (input.displayOrder !== undefined) patch.display_order = input.displayOrder;
  if (input.questionType !== undefined) patch.question_type = input.questionType;
  if (input.configPatch !== undefined) {
    patch.config = mergeQuestionConfig(existing.config, input.configPatch);
  }

  const { data, error } = await db
    .from("listening_questions")
    .update(patch)
    .eq("organization_id", org)
    .eq("id", input.questionId)
    .select(
      "id, organization_id, instrument_version_id, question_key, question_type, prompt, help_text, required, display_order, config"
    )
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("listening_question_not_found");
  return data;
}

export async function duplicateListeningQuestion(
  db: Db,
  organizationId: string,
  questionId: string
) {
  const org = requireOrgId(organizationId);
  const { data: existing, error: findErr } = await db
    .from("listening_questions")
    .select(
      "id, organization_id, instrument_version_id, question_key, question_type, prompt, help_text, required, display_order, config"
    )
    .eq("organization_id", org)
    .eq("id", questionId)
    .maybeSingle();
  if (findErr) throw findErr;
  if (!existing) throw new Error("listening_question_not_found");
  await assertVersionIsDraft(db, org, existing.instrument_version_id);

  const { data: options, error: optErr } = await db
    .from("listening_question_options")
    .select("option_key, label, display_order, value_numeric")
    .eq("organization_id", org)
    .eq("question_id", questionId)
    .order("display_order", { ascending: true });
  if (optErr) throw optErr;

  return addListeningQuestion(db, {
    organizationId: org,
    instrumentVersionId: existing.instrument_version_id,
    questionKey: `${existing.question_key}_copy_${Date.now().toString(36)}`,
    questionType: existing.question_type as ListeningQuestionType,
    prompt: `${existing.prompt} (copy)`,
    helpText: existing.help_text,
    required: existing.required,
    config:
      existing.config && typeof existing.config === "object"
        ? (existing.config as Record<string, unknown>)
        : {},
    options: (options ?? []).map((o) => ({
      optionKey: o.option_key,
      label: o.label,
      valueNumeric: o.value_numeric,
    })),
  });
}

export async function updateListeningQuestionOption(
  db: Db,
  input: {
    organizationId: string;
    optionId: string;
    label?: string;
    valueNumeric?: number | null;
  }
) {
  const org = requireOrgId(input.organizationId);
  const { data: option, error: findErr } = await db
    .from("listening_question_options")
    .select("id, question_id")
    .eq("organization_id", org)
    .eq("id", input.optionId)
    .maybeSingle();
  if (findErr) throw findErr;
  if (!option) throw new Error("listening_option_not_found");

  const { data: question, error: qErr } = await db
    .from("listening_questions")
    .select("instrument_version_id")
    .eq("organization_id", org)
    .eq("id", option.question_id)
    .maybeSingle();
  if (qErr) throw qErr;
  if (!question) throw new Error("listening_question_not_found");
  await assertVersionIsDraft(db, org, question.instrument_version_id);

  const patch: Record<string, unknown> = {};
  if (input.label !== undefined) patch.label = input.label.trim();
  if (input.valueNumeric !== undefined) patch.value_numeric = input.valueNumeric;

  const { data, error } = await db
    .from("listening_question_options")
    .update(patch)
    .eq("organization_id", org)
    .eq("id", input.optionId)
    .select(
      "id, organization_id, question_id, option_key, label, display_order, value_numeric"
    )
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("listening_option_not_found");
  return data;
}

export async function deleteListeningQuestion(
  db: Db,
  organizationId: string,
  questionId: string
) {
  const org = requireOrgId(organizationId);
  const { data: existing, error: findErr } = await db
    .from("listening_questions")
    .select("id, instrument_version_id")
    .eq("organization_id", org)
    .eq("id", questionId)
    .maybeSingle();
  if (findErr) throw findErr;
  if (!existing) throw new Error("listening_question_not_found");
  await assertVersionIsDraft(db, org, existing.instrument_version_id);

  const { error } = await db
    .from("listening_questions")
    .delete()
    .eq("organization_id", org)
    .eq("id", questionId);
  if (error) throw error;
}

export async function reorderListeningQuestions(
  db: Db,
  organizationId: string,
  instrumentVersionId: string,
  orderedQuestionIds: readonly string[]
) {
  const org = requireOrgId(organizationId);
  await assertVersionIsDraft(db, org, instrumentVersionId);
  for (let i = 0; i < orderedQuestionIds.length; i++) {
    const id = orderedQuestionIds[i]!;
    const { error } = await db
      .from("listening_questions")
      .update({ display_order: i + 1 })
      .eq("organization_id", org)
      .eq("instrument_version_id", instrumentVersionId)
      .eq("id", id);
    if (error) throw error;
  }
}

export async function addListeningQuestionOption(
  db: Db,
  input: {
    organizationId: string;
    questionId: string;
    optionKey: string;
    label: string;
    displayOrder?: number;
    valueNumeric?: number | null;
  }
) {
  const org = requireOrgId(input.organizationId);
  const { data: question, error: qErr } = await db
    .from("listening_questions")
    .select("id, instrument_version_id")
    .eq("organization_id", org)
    .eq("id", input.questionId)
    .maybeSingle();
  if (qErr) throw qErr;
  if (!question) throw new Error("listening_question_not_found");
  await assertVersionIsDraft(db, org, question.instrument_version_id);

  const { data, error } = await db
    .from("listening_question_options")
    .insert({
      organization_id: org,
      question_id: input.questionId,
      option_key: slugKey(input.optionKey) || `opt_${Date.now()}`,
      label: input.label.trim(),
      display_order: input.displayOrder ?? 0,
      value_numeric: input.valueNumeric ?? null,
    })
    .select(
      "id, organization_id, question_id, option_key, label, display_order, value_numeric"
    )
    .single();
  if (error) throw error;
  return data;
}

export async function deleteListeningQuestionOption(
  db: Db,
  organizationId: string,
  optionId: string
) {
  const org = requireOrgId(organizationId);
  const { data: option, error: findErr } = await db
    .from("listening_question_options")
    .select("id, question_id")
    .eq("organization_id", org)
    .eq("id", optionId)
    .maybeSingle();
  if (findErr) throw findErr;
  if (!option) throw new Error("listening_option_not_found");

  const { data: question, error: qErr } = await db
    .from("listening_questions")
    .select("instrument_version_id")
    .eq("organization_id", org)
    .eq("id", option.question_id)
    .maybeSingle();
  if (qErr) throw qErr;
  if (!question) throw new Error("listening_question_not_found");
  await assertVersionIsDraft(db, org, question.instrument_version_id);

  const { error } = await db
    .from("listening_question_options")
    .delete()
    .eq("organization_id", org)
    .eq("id", optionId);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Campaigns
// ---------------------------------------------------------------------------

export async function listListeningCampaigns(
  db: Db,
  organizationId: string,
  initiativeId?: string | null
) {
  const org = requireOrgId(organizationId);
  let q = db
    .from("listening_campaigns")
    .select(
      "id, organization_id, initiative_id, instrument_version_id, title, status, privacy_mode, opens_at, closes_at, created_at, updated_at, public_token_hash"
    )
    .eq("organization_id", org)
    .order("created_at", { ascending: false });
  if (initiativeId) q = q.eq("initiative_id", initiativeId);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function getListeningCampaign(
  db: Db,
  organizationId: string,
  campaignId: string
) {
  const org = requireOrgId(organizationId);
  const { data, error } = await db
    .from("listening_campaigns")
    .select(
      "id, organization_id, initiative_id, instrument_version_id, title, introduction, privacy_statement, status, privacy_mode, opens_at, closes_at, created_at, updated_at, public_token_hash"
    )
    .eq("organization_id", org)
    .eq("id", campaignId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Rotate public token. Returns plaintext once; previous link stops resolving.
 */
export async function regenerateListeningCampaignToken(
  db: Db,
  organizationId: string,
  campaignId: string
): Promise<{ campaignId: string; publicToken: string; publicUrl: string }> {
  const org = requireOrgId(organizationId);
  const existing = await getListeningCampaign(db, org, campaignId);
  if (!existing) throw new Error("listening_campaign_not_found");

  const publicToken = mintListeningCampaignToken();
  const public_token_hash = hashListeningTokenHex(publicToken);
  const { data, error } = await db
    .from("listening_campaigns")
    .update({
      public_token_hash,
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", org)
    .eq("id", campaignId)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("listening_campaign_not_found");
  return {
    campaignId: String(data.id),
    publicToken,
    publicUrl: `/listen/${publicToken}`,
  };
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
  const version = await getListeningInstrumentVersion(
    db,
    organizationId,
    input.instrumentVersionId
  );
  if (!version || version.status !== "published") {
    throw new Error("listening_campaign_requires_published_version");
  }

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
      status: input.status ?? "open",
      public_token_hash,
      created_by: input.createdBy ?? null,
      opens_at: input.opensAt || new Date().toISOString(),
      closes_at: input.closesAt || null,
    })
    .select(
      "id, organization_id, initiative_id, instrument_version_id, title, status, privacy_mode, opens_at, closes_at, created_at"
    )
    .single();
  if (error) throw error;
  return { campaign: data, publicToken };
}

function rpcErrorMessage(error: { message?: string; details?: string; hint?: string }): string {
  return [error.message, error.details, error.hint].filter(Boolean).join(" ");
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
  if (error) {
    const msg = rpcErrorMessage(error);
    if (msg.includes("listening_token_invalid")) {
      throw new Error("listening_token_invalid");
    }
    if (msg.includes("listening_campaign_not_open")) {
      throw new Error("listening_campaign_not_open");
    }
    throw new Error(msg || "listening_resolve_failed");
  }
  if (!data) throw new Error("listening_campaign_not_open");
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
  if (error) {
    const msg = rpcErrorMessage(error);
    if (msg.includes("listening_token_invalid")) {
      throw new Error("listening_token_invalid");
    }
    if (msg.includes("listening_campaign_not_open")) {
      throw new Error("listening_campaign_not_open");
    }
    if (msg.includes("listening_required_missing")) {
      throw new Error("listening_required_missing");
    }
    if (msg.includes("listening_answers_invalid")) {
      throw new Error("listening_answers_invalid");
    }
    throw new Error(msg || "listening_submit_failed");
  }
  return data as ListeningSubmitResult;
}
