/**
 * "WE HAVE RECEIVED EVERYTHING WE REQUIRE" - TO THE FAMILY, SCHOOL LEADER COPIED.
 *
 * Jimmy, 21 October 2026: "Once a parent makes the first payment, then I need
 * to queue an email to go out to them saying that we have received everything
 * that we require, and the school leader will be in touch with the parent
 * next. Copy in the school leader to that email." Not to a family who owes
 * nothing (Harris Borum): there is no first payment, so it never fires.
 *
 * Sent the moment the first payment is recorded in full and the child moves
 * to Enrolled. Signed with Jimmy's Academy Way signature, campus underneath.
 */
import { jimmySignatureHtml } from "@/lib/admissions/portal/jimmy-signature";
import { LETTER_STYLE, PARAGRAPH_STYLE } from "@/lib/admissions/portal/prospect-invite-email";
import { sendTransactionalEmail } from "@/lib/platform/email/send";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function everythingReceivedSubject(schoolName: string): string {
  return `We have received everything we require - ${schoolName.trim() || "The Academy"}`;
}

export function buildEverythingReceivedBody(input: {
  parentNames: readonly string[];
  childName: string;
  schoolName: string;
  leaderName: string | null;
}): string {
  const p = (html: string) => `  <p style="${PARAGRAPH_STYLE}">${html}</p>`;
  const names = input.parentNames.map((n) => n.trim()).filter(Boolean);
  const greeting = names.length ? [p(`${esc(names.join(" and "))},`)] : [];
  const child = esc(input.childName.trim() || "your child");
  const leader = input.leaderName?.trim()
    ? `${esc(input.leaderName.trim())}, our school leader,`
    : "our school leader";

  return [
    `<div style="${LETTER_STYLE}">`,
    ...greeting,
    p(
      `Thank you. We have received ${child}'s signed contract and first tuition payment. ` +
        `We have received everything that we require, and ${leader} will be in touch with you next.`
    ),
    p(`Sincerely,`),
    jimmySignatureHtml(input.schoolName),
    `</div>`,
  ].join("\n");
}

type Client = { from: (table: string) => any }; // eslint-disable-line @typescript-eslint/no-explicit-any

/** Never throws: a failed letter must not undo a recorded payment. */
export async function sendEverythingReceived(supabase: Client, leadId: string): Promise<{ sent: boolean; error?: string }> {
  try {
    const { data: lead } = await supabase
      .from("admissions_leads")
      .select("first_name, schools(name, school_leader_bcc_email)")
      .eq("id", leadId)
      .maybeSingle();
    const row = lead as { first_name?: string | null; schools?: unknown } | null;
    const school = (Array.isArray(row?.schools) ? row?.schools[0] : row?.schools) as
      | { name?: string | null; school_leader_bcc_email?: string | null }
      | null
      | undefined;
    const schoolName = school?.name ?? "The Academy";
    const leaderEmail = (school?.school_leader_bcc_email ?? "").trim();

    const { data: guardians } = await supabase
      .from("admissions_lead_guardians")
      .select("first_name, email, primary_guardian")
      .eq("lead_id", leadId);
    const all = ((guardians ?? []) as { first_name?: string | null; email?: string | null; primary_guardian?: boolean | null }[])
      .filter((g) => (g.email ?? "").includes("@"));
    const primary = all.filter((g) => g.primary_guardian);
    const to = primary.length ? primary : all;
    if (!to.length) return { sent: false, error: "No parent email on file." };

    let leaderName: string | null = null;
    if (leaderEmail) {
      const local = leaderEmail.split("@")[0];
      const { data: users } = await supabase
        .from("users")
        .select("full_name, email")
        .ilike("email", `${local}@%`);
      const list = (users ?? []) as { full_name?: string | null; email?: string | null }[];
      const exact = list.find((u) => (u.email ?? "").toLowerCase() === leaderEmail.toLowerCase() && u.full_name);
      leaderName = (exact ?? list.find((u) => u.full_name))?.full_name ?? null;
    }

    const result = await sendTransactionalEmail({
      to: to.map((g) => String(g.email).trim()),
      ...(leaderEmail ? { cc: leaderEmail } : {}),
      replyTo: "jimmy.arispe@theacademyway.org",
      subject: everythingReceivedSubject(schoolName),
      body: buildEverythingReceivedBody({
        parentNames: to.map((g) => g.first_name ?? ""),
        childName: row?.first_name ?? "",
        schoolName,
        leaderName,
      }),
      kind: "transactional",
    });
    if (!result.success) {
      console.error("[finalizing] everything-received letter not sent", { leadId, error: result.error });
      return { sent: false, error: result.error };
    }
    return { sent: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[finalizing] everything-received letter threw", { leadId, error: message });
    return { sent: false, error: message };
  }
}
