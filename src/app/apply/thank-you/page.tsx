import { ApplyShell } from "@/components/admissions/portal/ApplyShell";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { loadOrganizationBranding } from "@/lib/branding";
import { resolveInterestFormOrganization } from "@/lib/admissions/interest-form/org-resolve";

interface ThankYouPageProps {
  searchParams: Promise<{ lead?: string ; applied?: string}>;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The school the family actually chose, read back from their own lead.
 *
 * Not taken from the query string: anything a visitor can edit is a claim, and
 * a page that thanks somebody for their interest in a school they never picked
 * is worse than one that names the network. The lead id is an unguessable
 * UUID and a school's name is public, so reading it with the service role costs
 * nothing and gives the family the name they expect to see.
 *
 * Every failure returns null and the caller falls back to the network name. A
 * thank-you page is not worth a 500.
 */
async function schoolForLead(
  leadId: string | undefined
): Promise<{ name: string | null; meetsVirtually: boolean; studentFirstName: string | null }> {
  const none = { name: null, meetsVirtually: false, studentFirstName: null };
  if (!leadId || !UUID.test(leadId)) return none;
  try {
    const admin = createServiceRoleClient();
    /*
     * The child's own name, for the application notice. Preferred name first -
     * it is what the family calls the child - falling back to the legal first
     * name. Null when neither is set, and the sentence is written so that it
     * still reads correctly without it.
     */
    const { data, error } = await admin
      .from("admissions_leads")
      .select("first_name, preferred_name, schools(name, meets_virtually)")
      .eq("id", leadId)
      .maybeSingle();
    if (error || !data) return none;
    const row = data as Record<string, unknown>;
    const schools = row.schools as { name?: string; meets_virtually?: boolean } | null;
    const name = typeof schools?.name === "string" ? schools.name.trim() : "";
    const preferred =
      typeof row.preferred_name === "string" ? row.preferred_name.trim() : "";
    const legal = typeof row.first_name === "string" ? row.first_name.trim() : "";
    return {
      name: name || null,
      meetsVirtually: schools?.meets_virtually === true,
      studentFirstName: preferred || legal || null,
    };
  } catch {
    return none;
  }
}

export default async function ApplyThankYouPage({ searchParams }: ThankYouPageProps) {
  const { lead, applied } = await searchParams;
  const supabase = await createAuthClient();
  const [branding, org, school] = await Promise.all([
    loadOrganizationBranding(supabase),
    resolveInterestFormOrganization(),
    schoolForLead(lead),
  ]);

  const name = school.name ?? org?.organizationName ?? branding.productName;

  /**
   * What the family is being invited to book.
   *
   * A campus with a building offers a tour. The high school and Virtual have no
   * building, and offering a tour of one would be a promise nobody can keep —
   * so they offer the thing they actually do.
   *
   * Falls back to the in-person wording when the school could not be read,
   * which is the same case where the page names the network rather than a
   * campus. Vaguer, but never wrong about a specific school.
   */
  /**
   * AN APPLICATION IS NOT AN INQUIRY, AND THIS PAGE SERVES BOTH.
   *
   * The invited-application route has passed `applied=1` here since it
   * shipped, and this page never read it - so a family who had just completed
   * a full application was told "Inquiry Received" and invited to book a tour
   * they had already had.
   *
   * The APPLICATION notice is Jimmy's own words from 24 September, with one
   * correction he was told about: he wrote "your will receive".
   *
   * THE INQUIRY NOTICE WAS ALSO HIS, AND WAS REWRITTEN ON 5 OCTOBER because
   * the behaviour underneath it had changed. See the long note below.
   */
  const applicationSubmitted = applied === "1";

  /* The child, where we know them. "your child" is the honest fallback. */
  const child = school.studentFirstName ?? "your child";

  /**
   * THE INQUIRY WORDING, REWRITTEN 5 OCTOBER.
   *
   * ── WHAT WAS WRONG WITH IT ──────────────────────────────────────────────
   *
   * It said "Our admissions team is sending you an email NOW". That was true
   * when Jimmy wrote it on 24 September and stopped being true six days
   * later. Migration 489 made the family's first letter a decision: nothing
   * reaches them until a school leader reads what they wrote and presses
   * send, and the reminders behind her run to seventy-two hours.
   *
   * So a parent read "now", waited two days, received nothing, and either
   * concluded we were broken or emailed to ask - which is worse, because it
   * arrives in a mailbox nobody is watching for it.
   *
   * It also offered a "tour". There is no tour at inquiry stage anywhere:
   * GA and FL schedule a phone conversation (migration 493) and Virtual and
   * HS a virtual meeting (496, 498). A page promising a tour and a letter
   * offering a telephone call are two different schools to the person
   * reading them.
   *
   * ── WHAT IT SAYS NOW ────────────────────────────────────────────────────
   *
   * Jimmy approved this on 5 October. It describes a person doing something,
   * because that is what happens, and it deliberately PROMISES NO TIMEFRAME:
   * "within two business days" is a commitment four campuses would have to
   * keep, and the only thing enforcing it today is a reminder to one leader.
   *
   * THE TWO VARIANTS MUST AGREE WITH THE 1d LETTERS. If the wording of
   * inquiry_thank_you_email ever changes at a campus, this changes with it -
   * the page and the letter are read ten minutes apart by the same person.
   */
  const nextStep = school.meetsVirtually
    ? "schedule a virtual meeting with us"
    : "schedule a phone conversation with us";

  return (
    // No navigation, and no buttons below. A family who has just submitted an
    // enquiry has one thing to do next, which is read the email we are about to
    // send them. Every link here is a way to end up somewhere they cannot use.
    <ApplyShell organizationName={org?.organizationName} showNav={false}>
      <div className="mx-auto max-w-xl rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700">
          ✓
        </div>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">
          {applicationSubmitted ? "Application Received" : "Inquiry Received"}
        </h1>
        {applicationSubmitted ? (
          <p className="mt-2 text-slate-600">
            Thank you for submitting {child}&rsquo;s Admissions Application. Next, you will receive
            an email with a link to schedule {child}&rsquo;s Shadow Day(s).
          </p>
        ) : (
          <>
            <p className="mt-2 text-slate-600">
              Thank you for your interest in {name}. We have everything you told us about {child}.
            </p>
            <p className="mt-3 text-slate-600">
              We will read it and email you a link so you can {nextStep}. Nothing else is needed
              from you right now.
            </p>
          </>
        )}
        {lead && (
          <p className="mt-3 text-xs text-slate-400">Reference: {lead.slice(0, 8).toUpperCase()}</p>
        )}
      </div>
    </ApplyShell>
  );
}
