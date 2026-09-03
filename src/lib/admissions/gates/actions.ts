"use server";

/**
 * Opening, listing and answering decision gates.
 *
 * The whole point of a gate is that a named person answered it. So answering
 * requires `admissions.accept`, the answer is stamped with the signed-in user,
 * and nothing here accepts an identity from the caller.
 */

import { revalidatePath } from "next/cache";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { assertAnyPermission } from "@/lib/platform/identity/action-guards";
import { transitionCaseStage } from "@/lib/admissions/case/orchestration";
import { notifyAdmissionsEvent } from "@/lib/admissions/communications/triggers";
import { submitAdmissionsDecision } from "@/lib/admissions/decisions";
import { getInquiryHighlights } from "@/lib/admissions/interest-form/carry-forward";
import {
  branchFor,
  gateFor,
  type GateKey,
  type PendingGate,
} from "@/lib/admissions/gates/definitions";

const GATE_TABLE = "admissions_decision_gates";

/**
 * Open a gate and tell the school leader.
 *
 * Safe to call twice: the partial unique index in migration 246 permits only one
 * pending gate per (lead, gate_key), so a duplicate insert is a conflict rather
 * than a second question that could be answered differently from the first.
 */
export async function openDecisionGate(leadId: string, gateKey: GateKey) {
  const auth = await assertAnyPermission("admissions.manage", "admissions.accept");
  if ("error" in auth) return { error: auth.error };
  return openDecisionGateWith(auth.supabase, leadId, gateKey);
}

/**
 * The same thing, for a caller that has already established authority.
 *
 * `transitionCaseStage` reaches this after a stage move it was permitted to
 * make, and automation reaches it with no session at all. Re-asserting a
 * user permission there would mean a scheduled job could never open a gate —
 * and the process would stall silently, which is the failure mode this whole
 * feature exists to remove.
 */
export async function openDecisionGateWith(
  supabase: Awaited<ReturnType<typeof createAuthClient>>,
  leadId: string,
  gateKey: GateKey
) {
  const gate = gateFor(gateKey);
  if (!gate) return { error: `Unknown gate: ${gateKey}` };

  const { data, error } = await supabase
    .from(GATE_TABLE)
    .insert({ lead_id: leadId, gate_key: gateKey, status: "pending" })
    .select("id")
    .single();

  if (error) {
    // 23505 is the one-open-gate index doing its job. Not a failure.
    if (error.code === "23505") return { alreadyOpen: true as const };
    return { error: error.message };
  }

  try {
    await notifyAdmissionsEvent(supabase, {
      leadId,
      events: ["decision_gate_opened"],
    });
    await supabase
      .from(GATE_TABLE)
      .update({ notified_at: new Date().toISOString(), notify_count: 1 })
      .eq("id", data.id);
  } catch (notifyError) {
    // The gate exists and is answerable in JAG. A failed notification must not
    // roll that back — it would leave the process silently stalled with nothing
    // recorded anywhere.
    console.error("[openDecisionGate] gate opened but notification failed", {
      leadId,
      gateKey,
      error: notifyError instanceof Error ? notifyError.message : String(notifyError),
    });
  }

  revalidatePath("/dashboard/admissions/decisions");
  return { gateId: data.id as string };
}

type GateRow = {
  id: string;
  gate_key: GateKey;
  lead_id: string;
  created_at: string;
  notify_count: number;
  admissions_leads: {
    first_name: string | null;
    last_name: string | null;
    guardian_first_name: string | null;
    guardian_last_name: string | null;
    guardian_email: string | null;
    current_grade: string | null;
    lead_stage: string;
    notes: string | null;
    schools: { name: string | null } | { name: string | null }[] | null;
  } | null;
};

function schoolName(row: GateRow): string | null {
  const s = row.admissions_leads?.schools;
  if (!s) return null;
  return Array.isArray(s) ? (s[0]?.name ?? null) : s.name;
}

/**
 * The two answers that matter, from wherever this lead actually has them.
 *
 * A lead that came through the inquiry form keeps them in
 * `admissions_interest_answers`. A lead loaded by hand or by import has them in
 * free-text notes instead. Both are real and both belong on the decision screen,
 * so try the structured source first and fall back to parsing notes.
 *
 * An earlier version read notes only, which meant every lead from the actual
 * inquiry form — the ones this gate exists to serve — showed a school leader a
 * blank card.
 */
function extractFromNotes(notes: string | null, label: string): string | null {
  if (!notes) return null;
  const line = notes.split("\n").find((l) => l.toLowerCase().startsWith(label.toLowerCase()));
  if (!line) return null;
  const value = line.slice(line.indexOf(":") + 1).trim();
  return value || null;
}

export async function listPendingGates(): Promise<
  { gates: PendingGate[] } | { error: string }
> {
  const auth = await assertAnyPermission("admissions.view", "admissions.manage");
  if ("error" in auth) return { error: auth.error };

  const { data, error } = await auth.supabase
    .from(GATE_TABLE)
    .select(
      "id, gate_key, lead_id, created_at, notify_count, admissions_leads(first_name, last_name, guardian_first_name, guardian_last_name, guardian_email, current_grade, lead_stage, notes, schools(name))"
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) return { error: error.message };

  const rows = data as unknown as GateRow[];

  // One lookup per waiting decision. The list is short by nature — it is the
  // set of families a human has not yet answered for.
  const highlights = await Promise.all(
    rows.map((row) => getInquiryHighlights(row.lead_id).catch(() => ({ greatness: null, challenges: null })))
  );

  const gates = rows.map((row, index): PendingGate => {
    const lead = row.admissions_leads;
    const fromInquiry = highlights[index];
    const guardian = [lead?.guardian_first_name, lead?.guardian_last_name]
      .filter(Boolean)
      .join(" ")
      .trim();
    return {
      id: row.id,
      gateKey: row.gate_key,
      leadId: row.lead_id,
      studentName: [lead?.first_name, lead?.last_name].filter(Boolean).join(" ").trim() || "(no name)",
      guardianName: guardian || null,
      guardianEmail: lead?.guardian_email ?? null,
      schoolName: schoolName(row),
      grade: lead?.current_grade ?? null,
      leadStage: lead?.lead_stage ?? "",
      greatness: fromInquiry.greatness ?? extractFromNotes(lead?.notes ?? null, "GREATNESS"),
      challenges: fromInquiry.challenges ?? extractFromNotes(lead?.notes ?? null, "Challenges"),
      createdAt: row.created_at,
      notifyCount: row.notify_count,
    };
  });

  return { gates };
}

/**
 * Answer a gate.
 *
 * Order matters. The gate is closed FIRST, conditionally on it still being
 * pending, so two people answering at once cannot both proceed. Only the update
 * that actually changed a row goes on to send email and move the lead.
 */
export async function answerDecisionGate(formData: FormData) {
  const auth = await assertAnyPermission("admissions.accept");
  if ("error" in auth) return { error: auth.error };
  const supabase = auth.supabase;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const gateId = String(formData.get("gate_id") ?? "");
  const answer = String(formData.get("answer") ?? "");
  const notes = String(formData.get("answer_notes") ?? "").trim() || null;

  const { data: existing, error: readError } = await supabase
    .from(GATE_TABLE)
    .select("id, lead_id, gate_key, status")
    .eq("id", gateId)
    .single();

  if (readError || !existing) return { error: "That decision could not be found." };
  if (existing.status !== "pending") {
    return { error: "That decision has already been answered." };
  }

  const gate = gateFor(existing.gate_key);
  if (!gate) return { error: `Unknown gate: ${existing.gate_key}` };
  const branch = branchFor(gate, answer);
  if (!branch) return { error: `"${answer}" is not an answer to this question.` };

  const { data: claimed, error: claimError } = await supabase
    .from(GATE_TABLE)
    .update({
      status: "answered",
      answer: branch.answer,
      answered_by: user?.id ?? null,
      answered_at: new Date().toISOString(),
      answer_notes: notes,
    })
    .eq("id", gateId)
    .eq("status", "pending")
    .select("id");

  if (claimError) return { error: claimError.message };
  // Zero rows means someone else answered between the read and the write.
  if (!claimed?.length) return { error: "That decision has already been answered." };

  const leadId = existing.lead_id as string;

  // The accept/deny gate hands off to the path that already generates the
  // enrollment packet, writes the decision row and updates the application.
  if (branch.delegatesToDecision) {
    const decisionForm = new FormData();
    decisionForm.set("lead_id", leadId);
    decisionForm.set("decision_type", branch.delegatesToDecision);
    decisionForm.set("decision_notes", notes ?? "");
    decisionForm.set("send_email", "true");
    const result = await submitAdmissionsDecision(decisionForm);
    if (result && "error" in result && result.error) {
      // The gate is answered and stays answered — re-opening it would let the
      // same decision be made twice. Surface the failure instead.
      return {
        error: `Recorded your answer, but the decision could not be completed: ${result.error}`,
      };
    }
    revalidatePath("/dashboard/admissions/decisions");
    return { ok: true as const, answer: branch.answer };
  }

  if (branch.stage) {
    const stageResult = await transitionCaseStage(supabase, leadId, branch.stage, user?.id ?? null);
    if (stageResult.error) {
      console.error("[answerDecisionGate] answered but stage did not move", {
        gateId,
        stage: branch.stage,
        error: stageResult.error,
      });
    }
  }

  if (branch.familyEvent) {
    try {
      await notifyAdmissionsEvent(supabase, {
        leadId,
        events: [branch.familyEvent],
        sentBy: user?.id ?? null,
      });
    } catch (mailError) {
      // The decision stands; the family just was not told yet. Say so rather
      // than reporting a clean success.
      return {
        error: `Your answer was recorded, but the email to the family failed: ${
          mailError instanceof Error ? mailError.message : String(mailError)
        }`,
      };
    }
  }

  revalidatePath("/dashboard/admissions/decisions");
  revalidatePath("/dashboard/people");
  return { ok: true as const, answer: branch.answer };
}
