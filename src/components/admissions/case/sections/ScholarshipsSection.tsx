"use client";

import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";
import { assertActionResult } from "@/components/experience-system/feedback/runMutation";
import {
  ProfileCard,
  ProfileEmpty,
} from "@/components/platform/profile-workspace/ProfilePrimitives";
import { StaffFundingVerificationPanel } from "@/components/admissions/StaffFundingVerificationPanel";
import { updateScholarshipStatus } from "@/lib/scholarships/actions";
import { formatCurrency } from "@/lib/format";
import { isAdmissionsCaseProfileEnvelope } from "@/lib/admissions/profile/types";
import type { ProfileSectionViewProps } from "@/lib/platform/profile/sections/types";
import { missing } from "./shared";

export function ScholarshipsSection(props: ProfileSectionViewProps) {
  const env = isAdmissionsCaseProfileEnvelope(props.envelope) ? props.envelope : null;
  const data = props.data as {
    verifications: Parameters<typeof StaffFundingVerificationPanel>[0]["verifications"];
    scholarships: {
      id: string;
      scholarship_status: string;
      requested_amount: number | null;
      approved_amount: number | null;
      household_income: number | null;
    }[];
    applicationIds: string[];
  } | null;
  const action = useActionFeedback({
    verb: "approve",
    successToast: "✓ Updated",
    errorToast: "Unable to update.",
    progressLabel: "Updating scholarship review…",
  });

  if (!data || !env) return missing("Scholarships & Funding");

  function handleScholarshipReview(id: string, status: string, amount?: number) {
    void action.run(async () => {
      const result = await updateScholarshipStatus(id, status, amount);
      assertActionResult(result);
      return result;
    });
  }

  const hasFunding = data.applicationIds.length > 0 && data.verifications.length > 0;
  const hasScholarships = data.scholarships.length > 0;

  if (!hasFunding && !hasScholarships) {
    return (
      <ProfileCard title="Scholarships & Funding">
        <ProfileEmpty>No funding records on file</ProfileEmpty>
      </ProfileCard>
    );
  }

  return (
    <div className="space-y-6">
      {hasScholarships && (
        <ProfileCard title="Scholarship Review">
          <div className="space-y-3">
            {data.scholarships.map((sch) => (
              <div
                key={sch.id}
                className="rounded-xl border border-slate-100 bg-slate-50 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-slate-900 capitalize">
                      {sch.scholarship_status.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-slate-500">
                      Requested {formatCurrency(Number(sch.requested_amount ?? 0))}
                      {sch.household_income != null &&
                        ` · Household income ${formatCurrency(Number(sch.household_income))}`}
                    </p>
                  </div>
                  {["submitted", "under_review"].includes(sch.scholarship_status) && (
                    <div className="flex flex-wrap gap-2">
                      <ActionButton
                        type="button"
                        status={action.status}
                        verb="approve"
                        labels={{ idle: "Approve", loading: "Approving…", success: "✓ Approved" }}
                        className="!rounded-lg !bg-emerald-600 !px-3 !py-1 !text-xs hover:!bg-emerald-700"
                        onClick={() =>
                          handleScholarshipReview(
                            sch.id,
                            "approved",
                            Number(sch.requested_amount ?? 0)
                          )
                        }
                      />
                      <ActionButton
                        type="button"
                        status={action.status}
                        verb="save"
                        variant="secondary"
                        labels={{ idle: "Deny", loading: "Denying…", success: "✓ Denied" }}
                        className="!rounded-lg !px-3 !py-1 !text-xs"
                        onClick={() => handleScholarshipReview(sch.id, "denied")}
                      />
                    </div>
                  )}
                  {sch.scholarship_status === "approved" && sch.approved_amount != null && (
                    <span className="text-xs font-medium text-emerald-700">
                      Approved {formatCurrency(Number(sch.approved_amount))}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ProfileCard>
      )}
      {hasFunding && (
        <StaffFundingVerificationPanel
          applicationId={data.applicationIds[0]!}
          leadId={env.leadId}
          verifications={data.verifications}
        />
      )}
    </div>
  );
}
