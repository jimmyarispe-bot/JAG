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
}

export function PortalLeadList({ leads, schoolYearBySchool }: PortalLeadListProps) {
  const action = useActionFeedback({
    verb: "submit",
    labels: { idle: "Start Application", loading: "Starting…", success: "✓ Started" },
    successToast: "✓ Application started.",
    errorToast: "Unable to start application.",
    progressLabel: "Starting application…",
  });

  if (leads.length === 0) {
    return (
      <div className={`${portalSectionClass} text-center`}>
        <h2 className="text-lg font-semibold text-slate-900">No inquiries found</h2>
        <p className="mt-2 text-sm text-slate-500">
          Submit an inquiry using the same email as your account, or contact admissions for help.
        </p>
        <Link
          href="/apply"
          className="mt-4 inline-flex rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Submit Inquiry
        </Link>
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
