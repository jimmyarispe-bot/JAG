import type { SupabaseClient } from "@supabase/supabase-js";

import {
  GSNS_PROGRAM_CODE,
  GSNS_PROGRAM_NAME,
  easternToday,
  gsnsShareOn,
  isGsnsLetter,
  parseGsnsLetter,
  shareOf,
  type GsnsLetter,
} from "./gsns";

/**
 * READING A FAMILY'S GSNS LETTER OUT OF STORAGE.
 *
 * Works on the PDF the Georgia Department of Education issues - it carries its
 * text. A photo or screenshot carries none, so it is reported as unreadable and
 * the amount is typed in by hand; nothing is guessed.
 */

const BUCKET = "admissions-documents";

// Untyped on purpose: the columns these read (application_documents.lead_id,
// scholarship_awards.total_award_amount, ...) are hand-run migrations absent
// from the generated types.
type AnyClient = SupabaseClient;

export interface FoundLetter {
  letter: GsnsLetter;
  path: string;
}

export type LetterLookup =
  | { found: FoundLetter }
  | { missing: string };

async function textOfPdf(bytes: Uint8Array): Promise<string> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(bytes);
  const { text } = await extractText(pdf, { mergePages: true });
  return text;
}

/** Reads one stored file. Null when it is not a readable GSNS letter. */
export async function readGsnsLetterAt(admin: AnyClient, path: string): Promise<GsnsLetter | null> {
  if (!/\.pdf$/i.test(path)) return null;
  const { data, error } = await admin.storage.from(BUCKET).download(path);
  if (error || !data) return null;
  try {
    const text = await textOfPdf(new Uint8Array(await data.arrayBuffer()));
    if (!isGsnsLetter(text)) return null;
    const letter = parseGsnsLetter(text);
    return letter.totalAward === null ? null : letter;
  } catch {
    return null;
  }
}

/** The newest GSNS letter among everything this family uploaded. */
export async function findGsnsLetterForLead(admin: AnyClient, leadId: string): Promise<LetterLookup> {
  const { data, error } = await admin
    .from("application_documents")
    .select("storage_path, document_type, created_at")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });
  if (error) return { missing: `Could not read the family's documents: ${error.message}` };

  const rows = (data ?? []) as Array<{ storage_path: string | null; document_type: string | null }>;
  if (rows.length === 0) return { missing: "The family has not uploaded an award letter." };

  let sawImage = false;
  for (const row of rows) {
    const path = row.storage_path ?? "";
    if (!path) continue;
    if (!/\.pdf$/i.test(path)) {
      if (/award|scholarship|esa/i.test(row.document_type ?? "")) sawImage = true;
      continue;
    }
    const letter = await readGsnsLetterAt(admin, path);
    if (letter) return { found: { letter, path } };
  }
  return {
    missing: sawImage
      ? "The award letter is a photo, which cannot be read automatically. Enter the letter's total by hand."
      : "No Georgia Special Needs Scholarship letter was found in the family's uploads.",
  };
}

/**
 * On the inquiry: what the letter says goes onto the lead, where Finalizing
 * Contract shows it as what the family told us. Never throws - the inquiry is
 * already saved.
 */
export async function noteGsnsLetterOnLead(admin: AnyClient, leadId: string): Promise<void> {
  try {
    const lookup = await findGsnsLetterForLead(admin, leadId);
    if (!("found" in lookup)) return;
    const { letter } = lookup.found;
    await admin
      .from("admissions_leads")
      .update({
        state_funding_program_code: GSNS_PROGRAM_CODE,
        state_funding_award_amount: letter.totalAward,
        state_funding_award_id: letter.gtid,
      })
      .eq("id", leadId);
  } catch (e) {
    console.error("[gsns] could not read the letter on the inquiry", {
      leadId,
      error: e instanceof Error ? e.message : String(e),
    });
  }
}

export interface GsnsAwardFigures {
  total_award_amount: number;
  award_percent: number;
  award_percent_deadline: string | null;
  awarded_amount: number;
}

/** The share as of today: the deadline the family can still meet. */
export function gsnsFiguresToday(total: number, awardYear: string, today = easternToday()): GsnsAwardFigures | null {
  const share = gsnsShareOn(today, awardYear);
  if (!share) return null;
  return {
    total_award_amount: total,
    award_percent: share.percent,
    award_percent_deadline: share.deadline,
    awarded_amount: shareOf(total, share.percent),
  };
}

/**
 * The letter becomes the student's GSNS award: created, or the existing one
 * updated. The GTID goes on the student too.
 */
export async function applyGsnsLetterToStudent(
  supabase: AnyClient,
  admin: AnyClient,
  input: { leadId: string; studentId: string; schoolId: string }
): Promise<{ error: string } | { applied: GsnsAwardFigures & { gtid: string | null } }> {
  const lookup = await findGsnsLetterForLead(admin, input.leadId);
  if ("missing" in lookup) return { error: lookup.missing };
  const { letter, path } = lookup.found;

  const awardYear = letter.schoolYear ?? "2026-2027";
  const figures = gsnsFiguresToday(letter.totalAward as number, awardYear);
  if (!figures) return { error: "The letter's school year could not be read." };
  if (figures.award_percent === 0) {
    return { error: "It is April 9 or later, so this year's scholarship no longer applies." };
  }

  const row = {
    student_id: input.studentId,
    school_id: input.schoolId,
    program_name: GSNS_PROGRAM_NAME,
    program_code: GSNS_PROGRAM_CODE,
    award_year: awardYear,
    status: "awarded",
    awarded_on: easternToday(),
    state_student_number: letter.gtid,
    source_document_path: path,
    ...figures,
  };

  const { data: existing, error: readError } = await supabase
    .from("scholarship_awards")
    .select("id")
    .eq("student_id", input.studentId)
    .eq("award_year", awardYear)
    .or(`program_code.eq.${GSNS_PROGRAM_CODE},program_name.eq.${GSNS_PROGRAM_NAME}`)
    .in("status", ["applied", "awarded"])
    .limit(1);
  if (readError) return { error: readError.message };

  const write = existing && existing.length > 0
    ? supabase.from("scholarship_awards").update(row).eq("id", (existing[0] as { id: string }).id)
    : supabase.from("scholarship_awards").insert(row);
  const { error } = await write;
  if (error) return { error: error.message };

  if (letter.gtid) {
    const { data: student } = await supabase
      .from("students")
      .select("state_student_ids")
      .eq("id", input.studentId)
      .maybeSingle();
    const ids = ((student as { state_student_ids?: Record<string, unknown> | null } | null)?.state_student_ids ?? {}) as Record<string, unknown>;
    await supabase
      .from("students")
      .update({ state_student_ids: { ...ids, ga_gtid: letter.gtid } })
      .eq("id", input.studentId);
  }

  return { applied: { ...figures, gtid: letter.gtid } };
}
