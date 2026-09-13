"use client";

import Link from "next/link";
import { startApplication } from "@/lib/admissions/portal/actions";
import { leadStageLabel } from "@/lib/constants/admissions";
import { programLabel } from "@/lib/constants/programs";
import type { GuardianPortalLead } from "@/lib/admissions/portal/queries";
import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";
import { assertActionResult } from "@/components/experience-system/feedback/runMutation";
import { portalSectionClass } from "./styles";

interface PortalLeadListProps {
  leads: GuardianPortalLead[];
  schoolYearBySchool: Record<string, { id: string; name: string } | undefined>;
  /** Shown back to the family so a mismatch is visible rather than mysterious. */
  userEmail: string;
  /** Set when the read failed. Null means it succeeded and genuinely found nothing. */
  loadError?: string | null;
}

export function PortalLeadList({
  leads,
  schoolYearBySchool,
  userEmail,
  loadError,
}: PortalLeadListProps) {
  const action = useActionFeedback({
    verb: "submit",
    labels: { idle: "Start Application", loading: "Starting…", success: "✓ Started" },
    successToast: "✓ Application started.",
    errorToast: "Unable to start application.",
    progressLabel: "Starting application…",
  });

  /**
   * THE READ FAILED.
   *
   * Deliberately has no route back to the interest form. A family whose
   * application we simply could not fetch must not be invited to fill the whole
   * thing in again — that produces a duplicate lead, and admissions then has two
   * records for one child with no way to tell which is real.
   */
  if (loadError) {
    return (
      <div className={`${portalSectionClass} text-center`}>
        <h2 className="text-lg font-semibold text-slate-900">
          We could not load your application
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          {loadError} Please try again in a moment. If it keeps happening, reply to the email
          that invited you and we will sort it out for you.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 inline-flex rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Try again
        </button>
      </div>
    );
  }

  /**
   * NOTHING FOUND, and the read genuinely succeeded.
   *
   * The old wording here was "No inquiries found — submit an inquiry using the
   * same email as your account", with Submit Inquiry as the primary button. For
   * an invited parent that is wrong twice over: they already submitted one, and
   * the button sends them back to the form to submit it again.
   *
   * The realistic cause is that the enquiry carries a different email from the
   * one they were invited on, so the address they are signed in as is shown to
   * them — that is the fact that makes the mismatch solvable. Starting a fresh
   * enquiry stays available for somebody who really has not made one, but as a
   * quiet line rather than the loudest thing on the page.
   */
  if (leads.length === 0) {
    return (
      <div className={`${portalSectionClass} text-center`}>
        <h2 className="text-lg font-semibold text-slate-900">
          We can&rsquo;t find an application for this email
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          You are signed in as <span className="font-medium text-slate-700">{userEmail}</span>.
          If the school invited you, your enquiry may have been submitted under a different email
          address — reply to the email that invited you and we will connect it to this account.
        </p>
        <p className="mt-4 text-xs text-slate-400">
          Haven&rsquo;t enquired yet?{" "}
          <Link href="/apply" className="font-medium text-brand-600 underline hover:text-brand-700">
            Start here
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {leads.map((lead) => {
        const schoolYear = schoolYearBySchool[lead.school_id];
        const activeApplication = lead.applications[0];

        return (
          <article key={lead.id} className={portalSectionClass}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {lead.first_name} {lead.last_name}
                </h2>
                <p className="text-sm text-slate-500">
                  {lead.schools?.name ?? "School"} · {programLabel(lead.program)}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Stage: {leadStageLabel(lead.lead_stage)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeApplication ? (
                  <Link
                    href={`/apply/portal/${activeApplication.id}`}
                    className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                  >
                    Open Application
                  </Link>
                ) : (
                  <ActionButton
                    type="button"
                    status={action.status}
                    verb="submit"
                    labels={{
                      idle: schoolYear ? "Start Application" : "School year unavailable",
                      loading: "Starting…",
                      success: "✓ Started",
                    }}
                    disabled={!schoolYear}
                    className="!rounded-xl !bg-brand-600 !px-4 !py-2 hover:!bg-brand-700"
                    onClick={() => {
                      if (!schoolYear) return;
                      void action.run(async () => {
                        const result = await startApplication(lead.id, schoolYear.id);
                        assertActionResult(result);
                        if (result.applicationId) {
                          window.location.href = `/apply/portal/${result.applicationId}`;
                        }
                        return result;
                      });
                    }}
                  />
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
