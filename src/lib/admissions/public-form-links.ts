import { getRequestWorkspaceContext } from "@/lib/platform/identity/request-context";
import { loadPublishedInterestForm } from "@/lib/admissions/interest-form/load";
import { extractDomainsFromSettings } from "@/lib/platform/organizations/domains";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * The public inquiry URLs, as parents actually reach them.
 *
 * WHY THIS EXISTS. On 9 September 2026 the inquiry form went onto the school
 * websites, and the address to publish existed nowhere in JAG. The only link
 * was a button labelled "Parent Inquiry Form" buried in a sub-navigation row
 * that renders solely in the legacy `?view=` screens — it opens the form, and
 * never shows the URL. Twice in one evening the answer to "where is it?" had to
 * be found by reading source.
 *
 * IT READS THE MAPPING, IT DOES NOT ASSUME IT. Every host below comes from
 * `org_organizations.settings.domains` — the same list
 * `resolveInterestFormOrganization()` matches the incoming Host header against.
 * So this panel shows the hosts that will actually resolve, not the ones
 * somebody believes are configured.
 *
 * THAT MATTERS BECAUSE THE PUBLIC FORM FAILS CLOSED AND SILENT. An unmapped
 * host does not error: `/apply` renders an amber "not available for this
 * organization yet" box, with no form and nothing logged. A parent sees a dead
 * page that looks deliberate. Reading the mapping back is the only way that
 * becomes visible from inside JAG.
 *
 * The campus list is the published form's own school list, so it is exactly
 * what a parent sees in the School dropdown — a campus missing here is a campus
 * no family can choose.
 */

export type PublicInquiryLinks = {
  /** Full URLs, ready to paste onto a website. Never a path fragment. */
  urls: string[];
  /** Campuses a parent can pick, straight from the published form. */
  campuses: { id: string; name: string }[];
  /** Set when there is nothing to publish. Rendered instead of an empty box. */
  unavailable: string | null;
};

function toUrl(host: string): string {
  return `https://${host}/apply`;
}

/**
 * Order the hosts so the one to publish comes first.
 *
 * THE ORG'S OWN DOOR ON THE PLATFORM DOMAIN WINS.
 *
 * This used to rank a custom parent-facing domain above the platform one, which
 * reads well and was wrong in practice: a vanity domain resolves only if
 * somebody has pointed DNS at it, and an unmapped host does not error - /apply
 * renders a polite "not available for this organization yet" and no form. The
 * platform subdomain is served directly and always resolves, so it is the one
 * that is safe to hand to a parent on the phone.
 *
 * The apex and its `www` twin rank last: they serve the form but say nothing
 * about which school, and staff have been sent to the wrong sign-in door by
 * exactly that ambiguity all week.
 */
function rankHost(host: string): number {
  const lower = host.toLowerCase();
  const isPlatform = lower === "thejag.org" || lower.endsWith(".thejag.org");
  const isBarePlatform = lower === "thejag.org" || lower === "www.thejag.org";

  if (isPlatform && !isBarePlatform) return 0; // theacademyway.thejag.org
  if (!isPlatform) return lower.startsWith("www.") ? 2 : 1; // a custom domain
  return 3; // thejag.org / www.thejag.org
}

export async function getPublicInquiryLinks(): Promise<PublicInquiryLinks> {
  const ctx = await getRequestWorkspaceContext();
  if (!ctx?.organizationId) {
    return {
      urls: [],
      campuses: [],
      unavailable: "No organization is resolved for your account, so the public form address cannot be shown.",
    };
  }

  const admin = createServiceRoleClient();

  // Check the error. supabase-js resolves an RLS or schema refusal rather than
  // throwing, and a swallowed one here would render "no domains configured" —
  // advice to go and fix something that is not broken.
  const { data, error } = await admin
    .from("org_organizations")
    .select("settings, name")
    .eq("id", ctx.organizationId)
    .maybeSingle();

  if (error) {
    return {
      urls: [],
      campuses: [],
      unavailable: `Could not read the organization's domain mapping: ${error.message}`,
    };
  }

  const row = data as { settings: unknown; name: string | null } | null;
  const hosts = extractDomainsFromSettings(row?.settings);

  const published = await loadPublishedInterestForm({
    organizationId: ctx.organizationId,
    organizationName: row?.name ?? ctx.branding.organizationName,
  });

  if (!hosts.length) {
    return {
      urls: [],
      campuses: [...(published?.schools ?? [])],
      unavailable:
        "No public domain is mapped to this organization, so /apply will render an empty form to anyone who visits. Add the hostname to the organization's domains before publishing a link.",
    };
  }

  /* Deduplicated by host, case-insensitively. The settings list had the same
     domain twice and the panel dutifully printed it twice, which is how a list
     of one useful address became five rows of noise. */
  const unique = [...new Set([...hosts].map((h) => h.trim().toLowerCase()).filter(Boolean))];
  const urls = unique
    .sort((a, b) => rankHost(a) - rankHost(b) || a.localeCompare(b))
    .map(toUrl);

  if (!published) {
    return {
      urls,
      campuses: [],
      unavailable:
        "These hosts resolve, but no interest form is published for this organization — parents reaching them see an empty page. Publish a form version before sharing the link.",
    };
  }

  return { urls, campuses: [...published.schools], unavailable: null };
}
