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
   * Both notices below are Jimmy's own words, 24 September. The inquiry one is
   * unchanged and stays exactly as it was: "this needs to be the inquiry
   * received confirmation notice."
   *
   * One correction to his application text, which he was told about: he wrote
   * "your will receive". It reads "you will receive".
   */
  const applicationSubmitted = applied === "1";

  /* The child, where we know them. "your child" is the honest fallback. */
  const child = school.studentFirstName ?? "your child";

  /**
   * THE INQUIRY WORDING, UNCHANGED.
   *
   * A campus with a building offers a tour. The high school and Virtual have
   * no building, and offering a tour of one would be a promise nobody can
   * keep - so they offer the thing they actually do.
   *
   * Falls back to the in-person wording when the school could not be read,
   * which is the same case where the page names the network rather than a
   * campus. Vaguer, but never wrong about a specific school.
   */
  const nextStep = school.meetsVirtually
    ? "schedule a day/time to meet virtually with them"
    : "schedule your tour or meeting";

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
          <p className="mt-2 text-slate-600">
            Thank you for your interest in {name}. Our admissions team is sending you an email now
            for you to {nextStep}.
          </p>
        )}
        {lead && (
          <p className="mt-3 text-xs text-slate-400">Reference: {lead.slice(0, 8).toUpperCase()}</p>
        )}
      </div>
    </ApplyShell>
  );
}
