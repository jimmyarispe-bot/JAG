import { resolvePublicAppOrigin } from "@/lib/platform/branding";
import { sendTransactionalEmail } from "@/lib/platform/email/send";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import {
  HS_SCHOOL_ID,
  describeChoice,
  longDay,
  placementFromLead,
  readFamilyAsk,
} from "@/lib/admissions/placement";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

/**
 * WHO HEARS THAT A CHILD HAS REACHED FINALIZING CONTRACT, OR ENROLLED.
 *
 * Jimmy, 18 October 2026: "notify jimmy.arispe@theacademyway.org each time a
 * student reaches this stage". One address, his, written here once.
 */
export const FINALIZING_CONTRACT_NOTIFY = "jimmy.arispe@theacademyway.org";


function escape(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function describeChild(
  supabase: AuthClient,
  leadId: string
): Promise<{ name: string; campus: string }> {
  const { data } = await supabase
    .from("admissions_leads")
    .select("first_name, last_name, schools(name)")
    .eq("id", leadId)
    .maybeSingle();
  const row = data as
    | { first_name?: string | null; last_name?: string | null; schools?: { name?: string } | { name?: string }[] | null }
    | null;
  const name = `${row?.first_name ?? ""} ${row?.last_name ?? ""}`.trim() || "A child";
  const schools = row?.schools;
  const campus = (Array.isArray(schools) ? schools[0]?.name : schools?.name) ?? "a campus";
  return { name, campus };
}

async function startAndPlacementHtml(supabase: AuthClient, leadId: string): Promise<string> {
  try {
    const { data } = await supabase
      .from("admissions_leads")
      .select("school_id, placement_class_names, placement_sl_tutoring_days, placement_math_tutoring_days, actual_start_date, placement_recorded_at")
      .eq("id", leadId)
      .maybeSingle();
    const row = data as Record<string, unknown> | null;
    const ask = await readFamilyAsk(supabase as never, leadId);
    const lines = [`Parent's preferred start: ${escape(longDay(ask.preferredStart))}`];
    if (row?.school_id === HS_SCHOOL_ID) {
      const placed = placementFromLead(row);
      lines.push(`Parent asked for: ${escape(describeChoice(ask))}`);
      lines.push(
        placed.recordedAt
          ? `School leader placed: ${escape(describeChoice(placed))}`
          : "School leader placed: not chosen at Accept"
      );
      lines.push(`Actual start date: ${escape(placed.actualStartDate ? longDay(placed.actualStartDate) : "not chosen")}`);
    }
    return `<p>${lines.join("<br>")}</p>`;
  } catch {
    return "";
  }
}

/**
 * A child has been accepted and is now in Finalizing Contract.
 *
 * NEVER THROWS. The acceptance has already happened when this runs; a failed
 * notice must not be reported as a failed acceptance. It logs instead.
 */
export async function notifyReachedFinalizingContract(
  supabase: AuthClient,
  leadId: string
): Promise<void> {
  try {
    const { name, campus } = await describeChild(supabase, leadId);
    const link = `${resolvePublicAppOrigin()}/dashboard/admissions/finalizing`;
    // "That then needs to be included in the information sent to me" (Jimmy,
    // 20 Oct 2026): the preferred start, and at HS the leader's placement.
    const start = await startAndPlacementHtml(supabase, leadId);
    const result = await sendTransactionalEmail({
      to: FINALIZING_CONTRACT_NOTIFY,
      subject: `Finalizing Contract: ${name} — ${campus}`,
      body:
        `<p>${escape(name)} at ${escape(campus)} has been accepted and is now in Finalizing Contract.</p>` +
        start +
        `<p>Next: tuition, scholarships, the Schedule of Tuition Payments and the contract.</p>` +
        `<p><a href="${link}">Open Finalizing Contract</a></p>`,
      kind: "system_notification",
    });
    if (!result.success) {
      console.error("[finalizing] notice not sent", { leadId, error: result.error });
    }
  } catch (error) {
    console.error("[finalizing] notice threw", {
      leadId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/** The first tuition payment has been recorded and the child is enrolled. */
export async function notifyEnrolledByFirstPayment(
  supabase: AuthClient,
  leadId: string
): Promise<void> {
  try {
    const { name, campus } = await describeChild(supabase, leadId);
    const result = await sendTransactionalEmail({
      to: FINALIZING_CONTRACT_NOTIFY,
      subject: `Enrolled: ${name} — ${campus}`,
      body:
        `<p>The first tuition payment for ${escape(name)} at ${escape(campus)} has been recorded.</p>` +
        `<p>${escape(name)} is now on Enrolled Students.</p>` +
        `<p><a href="${resolvePublicAppOrigin()}/dashboard/enrolled-students">Open Enrolled Students</a></p>`,
      kind: "system_notification",
    });
    if (!result.success) {
      console.error("[finalizing] enrolled notice not sent", { leadId, error: result.error });
    }
  } catch (error) {
    console.error("[finalizing] enrolled notice threw", {
      leadId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
