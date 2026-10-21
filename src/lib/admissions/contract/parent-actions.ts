"use server";

/**
 * A PARENT INITIALS AND SIGNS THEIR CHILD'S CONTRACT.
 *
 * WHO MAY SIGN is decided by the database, with the parent's own session:
 * `enrollment_packets` shows a guardian only the packets for their own child
 * (is_guardian_of_lead), and `enrollment_packet_signatures` accepts a row only
 * for such a packet. So the packet is read, and the signature written, with
 * the parent's client - never the service role.
 *
 * The service role is used for one thing only, AFTER that check: to mark the
 * packet complete and the plan `contracted` once every part is signed, which a
 * parent's account is rightly not allowed to write.
 *
 * SIGNING THE CONTRACT DOES NOT ENROLL THE CHILD. Jimmy, 18 October: the
 * first tuition payment does. The old path (signEnrollmentDocument) ran the
 * whole enrollment handoff on the last signature; this one stops at
 * "contracted" and tells Jimmy.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

import { getSessionUser } from "@/lib/auth/session";
import { sendTransactionalEmail } from "@/lib/platform/email/send";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { FINALIZING_CONTRACT_NOTIFY } from "@/lib/admissions/finalizing/notify";
import { invoiceFirstPayment } from "@/lib/finance/first-payment-invoice";
import { transitionCaseStage } from "@/lib/admissions/case/orchestration";

import { contractBlocksForSchool, loadLeadContract } from "./for-lead";
import { escapeHtml } from "./render";

const ACKNOWLEDGEMENT_KEY = "contract_acknowledgement";

function clean(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

export async function signContractPartAction(formData: FormData) {
  const session = await getSessionUser();
  if (!session) return { error: "Please sign in again." };

  const packetId = clean(formData.get("packet_id"));
  const templateKey = clean(formData.get("template_key"));
  const text = clean(formData.get("text"));
  const signerName = clean(formData.get("signer_name"));
  const agreed = formData.get("agree") === "on";

  if (!packetId || !templateKey) return { error: "Something is missing. Reload the page and try again." };
  if (!agreed) return { error: "Tick the box to confirm you have read this part." };
  if (!signerName) return { error: "Type your full name." };

  const parent = await createAuthClient();
  const { data: packet, error: packetError } = await parent
    .from("enrollment_packets")
    .select("id, lead_id, school_id, packet_status, schools(name)")
    .eq("id", packetId)
    .maybeSingle();
  if (packetError) return { error: packetError.message };
  if (!packet) return { error: "This contract is not available to your account." };
  if (packet.packet_status === "completed") return { error: "This contract is already signed." };

  const schools = (packet as Record<string, unknown>).schools as { name?: string } | { name?: string }[] | null;
  const schoolName = (Array.isArray(schools) ? schools[0]?.name : schools?.name) ?? "";
  const blocks = contractBlocksForSchool(schoolName);
  if (!blocks || !blocks.some((b) => b.templateKey === templateKey)) {
    return { error: "That part of the contract is not recognized." };
  }

  const isSignature = templateKey === ACKNOWLEDGEMENT_KEY;
  if (isSignature) {
    if (text.length < 4 || !/\s/.test(text)) return { error: "Type your full name to sign." };
  } else if (text.replace(/[^A-Za-z]/g, "").length < 2 || text.length > 6) {
    return { error: "Type your initials (2 to 6 letters)." };
  }

  const { data: existing } = await parent
    .from("enrollment_packet_signatures")
    .select("template_key")
    .eq("enrollment_packet_id", packetId);
  const done = new Set(((existing ?? []) as { template_key: string }[]).map((r) => r.template_key));
  if (done.has(templateKey)) return { error: "This part is already initialled." };

  if (isSignature) {
    const missing = blocks.filter((b) => b.templateKey !== ACKNOWLEDGEMENT_KEY && !done.has(b.templateKey));
    if (missing.length > 0) {
      return { error: `Initial every part first. Still to initial: ${missing.map((b) => b.title).join(", ")}.` };
    }
  }

  const { error: insertError } = await parent.from("enrollment_packet_signatures").insert({
    enrollment_packet_id: packetId,
    template_key: templateKey,
    signer_name: signerName,
    signer_email: session.email,
    signature_text: text,
  });
  if (insertError) return { error: insertError.message };

  done.add(templateKey);
  const complete = blocks.every((b) => done.has(b.templateKey));

  const admin = createServiceRoleClient();
  if (!complete) {
    await admin.from("enrollment_packets").update({ packet_status: "partially_signed" }).eq("id", packetId);
    revalidatePath("/contract");
    return { success: true, complete: false };
  }

  const nowIso = new Date().toISOString();
  const loaded = await loadLeadContract(admin, String(packet.lead_id));

  /* Keep the contract exactly as it was signed (migration 571). Figures can be
     edited afterwards; the signed copy must not move with them. */
  await (admin as unknown as SupabaseClient)
    .from("enrollment_packets")
    .update({
      packet_status: "completed",
      completed_at: nowIso,
      signed_contract: "error" in loaded ? null : loaded.contract.blocks,
      signed_contract_at: "error" in loaded ? null : nowIso,
    })
    .eq("id", packetId);

  if (!("error" in loaded)) {
    // student_tuition_plans is not in the generated database types.
    await (admin as unknown as SupabaseClient)
      .from("student_tuition_plans")
      .update({
        lifecycle: "contracted",
        lifecycle_changed_at: nowIso,
        lifecycle_note: `Contract signed by ${signerName}`,
      })
      .eq("id", loaded.contract.planId)
      .eq("lifecycle", "final");
  }

  // "Once it is signed, you will receive an invoice for your first tuition
  // payment." Square emails it now (Jimmy, 20 Oct 2026). Never blocks signing.
  let invoiceLine = "";
  // NOTHING OWED: the signature enrolls. Jimmy, 21 Oct 2026 (Harris Borum,
  // scholarship larger than tuition): "Signed contract" moves the child to
  // Enrolled when there is no first payment to wait for.
  const owesNothing = !("error" in loaded) && loaded.contract.fields.remaining_due <= 0;
  if (owesNothing) {
    const leadId = String(packet.lead_id);
    const { data: leadNow } = await admin.from("admissions_leads").select("lead_stage").eq("id", leadId).maybeSingle();
    if ((leadNow as { lead_stage?: string } | null)?.lead_stage === "accepted") {
      const moved = await transitionCaseStage(admin as never, leadId, "enrolled", null);
      invoiceLine = moved.error
        ? `<p><strong>Nothing is owed, but the move to Enrolled failed:</strong> ${escapeHtml(moved.error)}</p>`
        : `<p>The family owes nothing after scholarships, so the child is now on Enrolled Students. No invoice was sent.</p>`;
    }
  } else if (!("error" in loaded)) {
    const invoiced = await invoiceFirstPayment(admin as unknown as SupabaseClient, {
      planId: loaded.contract.planId,
      leadId: String(packet.lead_id),
    });
    invoiceLine =
      "error" in invoiced
        ? `<p><strong>The first-payment invoice was NOT sent:</strong> ${escapeHtml(invoiced.error)} Retry on Finalizing Contract.</p>`
        : `<p>Square has emailed the family the invoice for the first payment${invoiced.invoiceNumber ? ` (#${escapeHtml(invoiced.invoiceNumber)})` : ""}.</p>`;
  }

  try {
    const child = "error" in loaded ? "A child" : loaded.contract.studentName;
    await sendTransactionalEmail({
      to: FINALIZING_CONTRACT_NOTIFY,
      subject: `Contract signed: ${child} — ${schoolName}`,
      body:
        `<p>${escapeHtml(signerName)} signed ${escapeHtml(child)}'s contract at ${escapeHtml(schoolName)}.</p>` +
        invoiceLine +
        `<p>Next: the first tuition payment. Recorded in full, ${escapeHtml(child)} moves to Enrolled Students.</p>`,
      kind: "system_notification",
    });
  } catch (error) {
    console.error("[contract] signed notice failed", error instanceof Error ? error.message : String(error));
  }

  revalidatePath("/contract");
  revalidatePath("/dashboard/admissions/finalizing");
  return { success: true, complete: true };
}
