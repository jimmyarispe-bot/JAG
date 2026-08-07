"use server";

import { revalidatePath } from "next/cache";
import {
  addListeningQuestion,
  addListeningQuestionOption,
  archiveListeningInitiative,
  createListeningCampaignWithToken,
  createListeningInitiative,
  createListeningInstrument,
  createListeningInstrumentVersion,
  deleteListeningInstrument,
  deleteListeningQuestion,
  deleteListeningQuestionOption,
  duplicateListeningQuestion,
  newListeningSectionId,
  parseListeningSections,
  publishListeningInstrumentVersion,
  regenerateListeningCampaignToken,
  reorderListeningQuestions,
  reorderSections,
  retireListeningInstrumentVersion,
  updateListeningInitiative,
  updateListeningInstrument,
  updateListeningQuestion,
  updateListeningQuestionOption,
  updateListeningVersionSections,
  validateQuestionDraft,
  LISTENING_PRIVACY_MODES,
  LISTENING_V1_QUESTION_TYPES,
  type ListeningPrivacyMode,
  type ListeningQuestionType,
  type ListeningSection,
} from "@/lib/platform/listening";
import { requireListeningManage } from "./access";

export type ListeningActionResult =
  | {
      readonly ok: true;
      readonly id?: string;
      readonly publicToken?: string;
      readonly publicUrl?: string;
      readonly published?: boolean;
    }
  | { readonly ok: false; readonly error: string };

function revalidateListening(paths: string[] = []) {
  revalidatePath("/jag/listening");
  for (const p of paths) revalidatePath(p);
}

function formStr(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function isQuestionType(v: string): v is ListeningQuestionType {
  return (LISTENING_V1_QUESTION_TYPES as readonly string[]).includes(v);
}

function isPrivacy(v: string): v is ListeningPrivacyMode {
  return (LISTENING_PRIVACY_MODES as readonly string[]).includes(v);
}

function formBool(formData: FormData, key: string): boolean {
  return formStr(formData, key) === "true";
}

/** datetime-local → ISO, or null when empty/invalid. */
function formDateTimeIso(formData: FormData, key: string): string | null {
  const raw = formStr(formData, key);
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export async function createInitiativeAction(
  formData: FormData
): Promise<ListeningActionResult> {
  const organizationId = formStr(formData, "organizationId");
  const access = await requireListeningManage(organizationId);
  if (!access.ok) return access;

  const title = formStr(formData, "title");
  if (!title) return { ok: false, error: "Name is required." };

  try {
    const row = await createListeningInitiative(access.supabase, {
      organizationId,
      title,
      purpose: formStr(formData, "purpose"),
      createdBy: access.session.userId,
      status: "active",
    });
    revalidateListening([`/jag/listening/initiatives/${row.id}`]);
    return { ok: true, id: row.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Create failed." };
  }
}

export async function updateInitiativeAction(
  formData: FormData
): Promise<ListeningActionResult> {
  const organizationId = formStr(formData, "organizationId");
  const access = await requireListeningManage(organizationId);
  if (!access.ok) return access;

  const initiativeId = formStr(formData, "initiativeId");
  const title = formStr(formData, "title");
  if (!initiativeId || !title) {
    return { ok: false, error: "Initiative and name are required." };
  }

  try {
    await updateListeningInitiative(access.supabase, {
      organizationId,
      initiativeId,
      title,
      purpose: formStr(formData, "purpose"),
      status: (formStr(formData, "status") || undefined) as
        | "draft"
        | "active"
        | "closed"
        | "archived"
        | undefined,
    });
    revalidateListening([`/jag/listening/initiatives/${initiativeId}`]);
    return { ok: true, id: initiativeId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Update failed." };
  }
}

export async function archiveInitiativeAction(
  formData: FormData
): Promise<ListeningActionResult> {
  const organizationId = formStr(formData, "organizationId");
  const access = await requireListeningManage(organizationId);
  if (!access.ok) return access;
  const initiativeId = formStr(formData, "initiativeId");
  if (!initiativeId) return { ok: false, error: "Initiative required." };
  try {
    await archiveListeningInitiative(
      access.supabase,
      organizationId,
      initiativeId
    );
    revalidateListening([`/jag/listening/initiatives/${initiativeId}`]);
    return { ok: true, id: initiativeId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Archive failed." };
  }
}

export async function createInstrumentAction(
  formData: FormData
): Promise<ListeningActionResult> {
  const organizationId = formStr(formData, "organizationId");
  const access = await requireListeningManage(organizationId);
  if (!access.ok) return access;

  const initiativeId = formStr(formData, "initiativeId");
  const title = formStr(formData, "title");
  if (!initiativeId || !title) {
    return { ok: false, error: "Initiative and instrument name are required." };
  }

  try {
    const instrument = await createListeningInstrument(access.supabase, {
      organizationId,
      initiativeId,
      title,
      description: formStr(formData, "description"),
      createdBy: access.session.userId,
    });
    const version = await createListeningInstrumentVersion(access.supabase, {
      organizationId,
      instrumentId: instrument.id,
      createdBy: access.session.userId,
      status: "draft",
    });
    revalidateListening([
      `/jag/listening/initiatives/${initiativeId}`,
      `/jag/listening/instruments/${instrument.id}`,
      `/jag/listening/versions/${version.id}`,
    ]);
    return { ok: true, id: instrument.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Create failed." };
  }
}

export async function updateInstrumentAction(
  formData: FormData
): Promise<ListeningActionResult> {
  const organizationId = formStr(formData, "organizationId");
  const access = await requireListeningManage(organizationId);
  if (!access.ok) return access;
  const instrumentId = formStr(formData, "instrumentId");
  const title = formStr(formData, "title");
  if (!instrumentId || !title) {
    return { ok: false, error: "Instrument and name are required." };
  }
  try {
    await updateListeningInstrument(access.supabase, {
      organizationId,
      instrumentId,
      title,
      description: formStr(formData, "description"),
    });
    revalidateListening([`/jag/listening/instruments/${instrumentId}`]);
    return { ok: true, id: instrumentId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Update failed." };
  }
}

export async function deleteInstrumentAction(
  formData: FormData
): Promise<ListeningActionResult> {
  const organizationId = formStr(formData, "organizationId");
  const access = await requireListeningManage(organizationId);
  if (!access.ok) return access;
  const instrumentId = formStr(formData, "instrumentId");
  if (!instrumentId) return { ok: false, error: "Instrument required." };
  try {
    await deleteListeningInstrument(
      access.supabase,
      organizationId,
      instrumentId
    );
    revalidateListening();
    return { ok: true, id: instrumentId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Delete failed." };
  }
}

export async function createDraftVersionAction(
  formData: FormData
): Promise<ListeningActionResult> {
  const organizationId = formStr(formData, "organizationId");
  const access = await requireListeningManage(organizationId);
  if (!access.ok) return access;
  const instrumentId = formStr(formData, "instrumentId");
  if (!instrumentId) return { ok: false, error: "Instrument required." };
  try {
    const version = await createListeningInstrumentVersion(access.supabase, {
      organizationId,
      instrumentId,
      createdBy: access.session.userId,
      status: "draft",
    });
    revalidateListening([
      `/jag/listening/instruments/${instrumentId}`,
      `/jag/listening/versions/${version.id}`,
    ]);
    return { ok: true, id: version.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Draft failed." };
  }
}

export async function publishVersionAction(
  formData: FormData
): Promise<ListeningActionResult> {
  const organizationId = formStr(formData, "organizationId");
  const access = await requireListeningManage(organizationId);
  if (!access.ok) return access;
  const versionId = formStr(formData, "versionId");
  if (!versionId) return { ok: false, error: "Version required." };
  try {
    const published = await publishListeningInstrumentVersion(
      access.supabase,
      organizationId,
      versionId
    );
    revalidateListening([
      `/jag/listening/versions/${versionId}`,
      `/jag/listening/instruments/${published.instrument_id}`,
    ]);
    return { ok: true, id: versionId, published: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Publish failed." };
  }
}

export async function retireVersionAction(
  formData: FormData
): Promise<ListeningActionResult> {
  const organizationId = formStr(formData, "organizationId");
  const access = await requireListeningManage(organizationId);
  if (!access.ok) return access;
  const versionId = formStr(formData, "versionId");
  if (!versionId) return { ok: false, error: "Version required." };
  try {
    const retired = await retireListeningInstrumentVersion(
      access.supabase,
      organizationId,
      versionId
    );
    revalidateListening([
      `/jag/listening/versions/${versionId}`,
      `/jag/listening/instruments/${retired.instrument_id}`,
    ]);
    return { ok: true, id: versionId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Retire failed." };
  }
}

export async function addQuestionAction(
  formData: FormData
): Promise<ListeningActionResult> {
  const organizationId = formStr(formData, "organizationId");
  const access = await requireListeningManage(organizationId);
  if (!access.ok) return access;
  const versionId = formStr(formData, "versionId");
  const prompt = formStr(formData, "prompt");
  const questionType = formStr(formData, "questionType");
  if (!versionId || !prompt || !isQuestionType(questionType)) {
    return { ok: false, error: "Version, prompt, and type are required." };
  }

  const optionLabels = formData
    .getAll("optionLabel")
    .map((v) => String(v).trim())
    .filter(Boolean);

  const sectionId = formStr(formData, "sectionId") || null;
  let sectionTitle: string | undefined;
  let sectionDescription: string | undefined;
  if (sectionId) {
    const version = await access.supabase
      .from("listening_instrument_versions")
      .select("metadata")
      .eq("organization_id", organizationId)
      .eq("id", versionId)
      .maybeSingle();
    const sections = parseListeningSections(version.data?.metadata);
    const match = sections.find((s) => s.id === sectionId);
    sectionTitle = match?.title;
    sectionDescription = match?.description;
  }

  const config = {
    sectionId,
    sectionTitle,
    sectionDescription,
    placeholder: formStr(formData, "placeholder") || undefined,
    defaultValue: formStr(formData, "defaultValue") || null,
    min: formStr(formData, "min") ? Number(formStr(formData, "min")) : null,
    max: formStr(formData, "max") ? Number(formStr(formData, "max")) : null,
    step: formStr(formData, "step") ? Number(formStr(formData, "step")) : null,
    likertLowLabel: formStr(formData, "likertLowLabel") || undefined,
    likertHighLabel: formStr(formData, "likertHighLabel") || undefined,
  };

  const validated = validateQuestionDraft({
    prompt,
    questionType,
    options: optionLabels.map((label) => ({ label })),
    config,
  });
  if (!validated.ok) return validated;

  try {
    const row = await addListeningQuestion(access.supabase, {
      organizationId,
      instrumentVersionId: versionId,
      questionType,
      prompt,
      helpText: formStr(formData, "helpText"),
      required: formBool(formData, "required"),
      config,
      options: optionLabels.map((label, i) => ({
        label,
        optionKey: `opt_${i + 1}`,
      })),
    });
    revalidateListening([`/jag/listening/versions/${versionId}`]);
    return { ok: true, id: row.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Add failed." };
  }
}

export async function updateQuestionAction(
  formData: FormData
): Promise<ListeningActionResult> {
  const organizationId = formStr(formData, "organizationId");
  const access = await requireListeningManage(organizationId);
  if (!access.ok) return access;
  const questionId = formStr(formData, "questionId");
  const versionId = formStr(formData, "versionId");
  const prompt = formStr(formData, "prompt");
  if (!questionId || !prompt) {
    return { ok: false, error: "Question and prompt are required." };
  }
  const sectionId = formStr(formData, "sectionId") || null;
  let sectionTitle: string | null = null;
  let sectionDescription: string | null = null;
  if (sectionId) {
    const version = await access.supabase
      .from("listening_instrument_versions")
      .select("metadata")
      .eq("organization_id", organizationId)
      .eq("id", versionId)
      .maybeSingle();
    const sections = parseListeningSections(version.data?.metadata);
    const match = sections.find((s) => s.id === sectionId);
    sectionTitle = match?.title ?? null;
    sectionDescription = match?.description ?? null;
  }

  const configPatch = {
    sectionId,
    sectionTitle,
    sectionDescription,
    placeholder: formStr(formData, "placeholder"),
    defaultValue: formStr(formData, "defaultValue") || null,
    min: formStr(formData, "min") ? Number(formStr(formData, "min")) : null,
    max: formStr(formData, "max") ? Number(formStr(formData, "max")) : null,
    step: formStr(formData, "step") ? Number(formStr(formData, "step")) : null,
    likertLowLabel: formStr(formData, "likertLowLabel"),
    likertHighLabel: formStr(formData, "likertHighLabel"),
  };

  try {
    await updateListeningQuestion(access.supabase, {
      organizationId,
      questionId,
      prompt,
      helpText: formStr(formData, "helpText"),
      required: formBool(formData, "required"),
      configPatch,
    });
    revalidateListening([`/jag/listening/versions/${versionId}`]);
    return { ok: true, id: questionId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Update failed." };
  }
}

export async function deleteQuestionAction(
  formData: FormData
): Promise<ListeningActionResult> {
  const organizationId = formStr(formData, "organizationId");
  const access = await requireListeningManage(organizationId);
  if (!access.ok) return access;
  const questionId = formStr(formData, "questionId");
  const versionId = formStr(formData, "versionId");
  if (!questionId) return { ok: false, error: "Question required." };
  try {
    await deleteListeningQuestion(access.supabase, organizationId, questionId);
    revalidateListening([`/jag/listening/versions/${versionId}`]);
    return { ok: true, id: questionId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Delete failed." };
  }
}

export async function reorderQuestionsAction(
  formData: FormData
): Promise<ListeningActionResult> {
  const organizationId = formStr(formData, "organizationId");
  const access = await requireListeningManage(organizationId);
  if (!access.ok) return access;
  const versionId = formStr(formData, "versionId");
  const ordered = formStr(formData, "orderedIds")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!versionId || ordered.length === 0) {
    return { ok: false, error: "Version and order required." };
  }
  try {
    await reorderListeningQuestions(
      access.supabase,
      organizationId,
      versionId,
      ordered
    );
    revalidateListening([`/jag/listening/versions/${versionId}`]);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Reorder failed." };
  }
}

export async function addOptionAction(
  formData: FormData
): Promise<ListeningActionResult> {
  const organizationId = formStr(formData, "organizationId");
  const access = await requireListeningManage(organizationId);
  if (!access.ok) return access;
  const questionId = formStr(formData, "questionId");
  const versionId = formStr(formData, "versionId");
  const label = formStr(formData, "label");
  if (!questionId || !label) {
    return { ok: false, error: "Question and label required." };
  }
  try {
    const row = await addListeningQuestionOption(access.supabase, {
      organizationId,
      questionId,
      optionKey: formStr(formData, "optionKey") || label,
      label,
    });
    revalidateListening([`/jag/listening/versions/${versionId}`]);
    return { ok: true, id: row.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Option failed." };
  }
}

export async function deleteOptionAction(
  formData: FormData
): Promise<ListeningActionResult> {
  const organizationId = formStr(formData, "organizationId");
  const access = await requireListeningManage(organizationId);
  if (!access.ok) return access;
  const optionId = formStr(formData, "optionId");
  const versionId = formStr(formData, "versionId");
  if (!optionId) return { ok: false, error: "Option required." };
  try {
    await deleteListeningQuestionOption(
      access.supabase,
      organizationId,
      optionId
    );
    revalidateListening([`/jag/listening/versions/${versionId}`]);
    return { ok: true, id: optionId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Delete failed." };
  }
}

export async function createCampaignAction(
  formData: FormData
): Promise<ListeningActionResult> {
  const organizationId = formStr(formData, "organizationId");
  const access = await requireListeningManage(organizationId);
  if (!access.ok) return access;

  const initiativeId = formStr(formData, "initiativeId");
  const instrumentVersionId = formStr(formData, "instrumentVersionId");
  const title = formStr(formData, "title");
  const privacyMode = formStr(formData, "privacyMode") || "anonymous";
  if (!initiativeId || !instrumentVersionId || !title) {
    return {
      ok: false,
      error: "Initiative, published version, and name are required.",
    };
  }
  if (!isPrivacy(privacyMode)) {
    return { ok: false, error: "Invalid privacy mode." };
  }

  try {
    const { campaign, publicToken } = await createListeningCampaignWithToken(
      access.supabase,
      {
        organizationId,
        initiativeId,
        instrumentVersionId,
        title,
        privacyMode,
        introduction: formStr(formData, "introduction"),
        privacyStatement: formStr(formData, "privacyStatement"),
        opensAt: formDateTimeIso(formData, "opensAt"),
        closesAt: formDateTimeIso(formData, "closesAt"),
        createdBy: access.session.userId,
        status: "open",
      }
    );
    const id = String(campaign.id);
    const publicUrl = `/listen/${publicToken}`;
    revalidateListening([
      `/jag/listening/campaigns/${id}`,
      `/jag/listening/initiatives/${initiativeId}`,
    ]);
    return { ok: true, id, publicToken, publicUrl };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Campaign create failed.",
    };
  }
}

export async function duplicateQuestionAction(
  formData: FormData
): Promise<ListeningActionResult> {
  const organizationId = formStr(formData, "organizationId");
  const access = await requireListeningManage(organizationId);
  if (!access.ok) return access;
  const questionId = formStr(formData, "questionId");
  const versionId = formStr(formData, "versionId");
  if (!questionId) return { ok: false, error: "Question required." };
  try {
    const row = await duplicateListeningQuestion(
      access.supabase,
      organizationId,
      questionId
    );
    revalidateListening([`/jag/listening/versions/${versionId}`]);
    return { ok: true, id: row.id };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Duplicate failed.",
    };
  }
}

export async function updateOptionAction(
  formData: FormData
): Promise<ListeningActionResult> {
  const organizationId = formStr(formData, "organizationId");
  const access = await requireListeningManage(organizationId);
  if (!access.ok) return access;
  const optionId = formStr(formData, "optionId");
  const versionId = formStr(formData, "versionId");
  const label = formStr(formData, "label");
  if (!optionId || !label) {
    return { ok: false, error: "Option and label required." };
  }
  try {
    await updateListeningQuestionOption(access.supabase, {
      organizationId,
      optionId,
      label,
      valueNumeric: formStr(formData, "valueNumeric")
        ? Number(formStr(formData, "valueNumeric"))
        : undefined,
    });
    revalidateListening([`/jag/listening/versions/${versionId}`]);
    return { ok: true, id: optionId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Update failed." };
  }
}

export async function createSectionAction(
  formData: FormData
): Promise<ListeningActionResult> {
  const organizationId = formStr(formData, "organizationId");
  const access = await requireListeningManage(organizationId);
  if (!access.ok) return access;
  const versionId = formStr(formData, "versionId");
  const title = formStr(formData, "title") || "New section";
  if (!versionId) return { ok: false, error: "Version required." };
  try {
    const version = await access.supabase
      .from("listening_instrument_versions")
      .select("metadata")
      .eq("organization_id", organizationId)
      .eq("id", versionId)
      .maybeSingle();
    if (version.error) throw version.error;
    const sections = parseListeningSections(version.data?.metadata);
    const next: ListeningSection[] = [
      ...sections,
      {
        id: newListeningSectionId(),
        title,
        description: formStr(formData, "description"),
        displayOrder: sections.length + 1,
      },
    ];
    await updateListeningVersionSections(
      access.supabase,
      organizationId,
      versionId,
      next
    );
    revalidateListening([`/jag/listening/versions/${versionId}`]);
    return { ok: true, id: versionId };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Section create failed.",
    };
  }
}

export async function renameSectionAction(
  formData: FormData
): Promise<ListeningActionResult> {
  const organizationId = formStr(formData, "organizationId");
  const access = await requireListeningManage(organizationId);
  if (!access.ok) return access;
  const versionId = formStr(formData, "versionId");
  const sectionId = formStr(formData, "sectionId");
  const title = formStr(formData, "title");
  if (!versionId || !sectionId || !title) {
    return { ok: false, error: "Section and title required." };
  }
  try {
    const version = await access.supabase
      .from("listening_instrument_versions")
      .select("metadata")
      .eq("organization_id", organizationId)
      .eq("id", versionId)
      .maybeSingle();
    if (version.error) throw version.error;
    const description =
      formStr(formData, "description") ||
      parseListeningSections(version.data?.metadata).find((s) => s.id === sectionId)
        ?.description ||
      "";
    const sections = parseListeningSections(version.data?.metadata).map((s) =>
      s.id === sectionId ? { ...s, title, description } : s
    );
    await updateListeningVersionSections(
      access.supabase,
      organizationId,
      versionId,
      sections
    );
    // Stamp titles onto question config for public respondent (no schema change).
    const { data: questions } = await access.supabase
      .from("listening_questions")
      .select("id, config")
      .eq("organization_id", organizationId)
      .eq("instrument_version_id", versionId);
    for (const q of questions ?? []) {
      const cfg = (q.config ?? {}) as Record<string, unknown>;
      if (cfg.sectionId !== sectionId) continue;
      await updateListeningQuestion(access.supabase, {
        organizationId,
        questionId: String(q.id),
        configPatch: {
          sectionId,
          sectionTitle: title,
          sectionDescription: description,
        },
      });
    }
    revalidateListening([`/jag/listening/versions/${versionId}`]);
    return { ok: true, id: sectionId };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Rename failed.",
    };
  }
}

export async function deleteSectionAction(
  formData: FormData
): Promise<ListeningActionResult> {
  const organizationId = formStr(formData, "organizationId");
  const access = await requireListeningManage(organizationId);
  if (!access.ok) return access;
  const versionId = formStr(formData, "versionId");
  const sectionId = formStr(formData, "sectionId");
  if (!versionId || !sectionId) {
    return { ok: false, error: "Section required." };
  }
  try {
    const { data: questions, error } = await access.supabase
      .from("listening_questions")
      .select("id, config")
      .eq("organization_id", organizationId)
      .eq("instrument_version_id", versionId);
    if (error) throw error;
    const inUse = (questions ?? []).some((q) => {
      const cfg = q.config as { sectionId?: string } | null;
      return cfg?.sectionId === sectionId;
    });
    if (inUse) {
      return {
        ok: false,
        error: "Move or remove questions before deleting this section.",
      };
    }
    const version = await access.supabase
      .from("listening_instrument_versions")
      .select("metadata")
      .eq("organization_id", organizationId)
      .eq("id", versionId)
      .maybeSingle();
    if (version.error) throw version.error;
    const sections = parseListeningSections(version.data?.metadata).filter(
      (s) => s.id !== sectionId
    );
    await updateListeningVersionSections(
      access.supabase,
      organizationId,
      versionId,
      sections
    );
    revalidateListening([`/jag/listening/versions/${versionId}`]);
    return { ok: true, id: sectionId };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Delete failed.",
    };
  }
}

export async function moveSectionAction(
  formData: FormData
): Promise<ListeningActionResult> {
  const organizationId = formStr(formData, "organizationId");
  const access = await requireListeningManage(organizationId);
  if (!access.ok) return access;
  const versionId = formStr(formData, "versionId");
  const sectionId = formStr(formData, "sectionId");
  const direction = formStr(formData, "direction") === "down" ? "down" : "up";
  if (!versionId || !sectionId) {
    return { ok: false, error: "Section required." };
  }
  try {
    const version = await access.supabase
      .from("listening_instrument_versions")
      .select("metadata")
      .eq("organization_id", organizationId)
      .eq("id", versionId)
      .maybeSingle();
    if (version.error) throw version.error;
    const sections = reorderSections(
      parseListeningSections(version.data?.metadata),
      sectionId,
      direction
    );
    await updateListeningVersionSections(
      access.supabase,
      organizationId,
      versionId,
      sections
    );
    revalidateListening([`/jag/listening/versions/${versionId}`]);
    return { ok: true, id: sectionId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Move failed." };
  }
}

export async function regenerateCampaignTokenAction(
  formData: FormData
): Promise<ListeningActionResult> {
  const organizationId = formStr(formData, "organizationId");
  const access = await requireListeningManage(organizationId);
  if (!access.ok) return access;
  const campaignId = formStr(formData, "campaignId");
  if (!campaignId) return { ok: false, error: "Campaign required." };
  try {
    const result = await regenerateListeningCampaignToken(
      access.supabase,
      organizationId,
      campaignId
    );
    revalidateListening([`/jag/listening/campaigns/${campaignId}`]);
    return {
      ok: true,
      id: result.campaignId,
      publicToken: result.publicToken,
      publicUrl: result.publicUrl,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Regenerate failed.",
    };
  }
}
