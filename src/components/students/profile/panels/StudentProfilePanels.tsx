import Link from "next/link";
import { StatCard } from "@/components/dashboard/StatCard";
import { FundingSourceBadges } from "@/components/ui/FundingSourceBadges";
import { SuccessScoreBadge, SuccessScoreBreakdown } from "@/components/students/SuccessScoreBadge";
import {
  ProfileBadge,
  ProfileCard,
  ProfileEmpty,
  ProfileItem,
  ProfileJsonList,
} from "@/components/students/profile/shared/ProfilePrimitives";
import { gradeLabel } from "@/lib/constants/grades";
import { programLabel } from "@/lib/constants/programs";
import { formatCurrency } from "@/lib/format";
import type { SisEnrollment, StudentRecord } from "@/lib/students/queries";
import type { StudentConversionLink } from "@/lib/sis/queries";
import type { ExecutiveSummary } from "@/lib/ssis/queries";

export function OverviewPanel({
  student,
  summary,
  conversion,
  enrollments,
  displayName,
}: {
  student: StudentRecord;
  summary: ExecutiveSummary;
  conversion: StudentConversionLink | null;
  enrollments: SisEnrollment[];
  displayName: string;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-xl font-bold text-brand-700">
          {student.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={student.photo_url} alt="" className="h-16 w-16 rounded-2xl object-cover" />
          ) : (
            student.first_name[0]?.toUpperCase()
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-slate-900">{displayName}</h2>
          <p className="text-sm text-slate-500">
            ID {student.student_number ?? "—"} · {gradeLabel(student.grade_level)} ·{" "}
            {programLabel(student.program)}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <ProfileBadge label={summary.lifecycleStage} />
            <ProfileBadge label={student.enrollment_status} />
            {summary.successScore && (
              <SuccessScoreBadge
                score={summary.successScore.overallScore}
                indicator={summary.successScore.statusIndicator}
              />
            )}
            {summary.medicalAlertCount > 0 && (
              <ProfileBadge label={`${summary.medicalAlertCount} medical alerts`} tone="amber" />
            )}
            {summary.spedReviewDue && <ProfileBadge label="SPED review due" tone="rose" />}
            {summary.parentDisengaged && (
              <ProfileBadge label="Low parent engagement" tone="amber" />
            )}
            {summary.missionControlAlertCount > 0 && (
              <ProfileBadge label={`${summary.missionControlAlertCount} MC alerts`} tone="rose" />
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {summary.successScore && (
            <SuccessScoreBadge
              score={summary.successScore.overallScore}
              indicator={summary.successScore.statusIndicator}
              size="lg"
            />
          )}
          {conversion && (
            <Link
              href={`/dashboard/admissions/leads/${conversion.lead_id}`}
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              View admissions history →
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Attendance" value={`${summary.attendanceRate}%`} description="This month" accent="emerald" icon={<span>✓</span>} />
        <StatCard title="Academic Growth" value={String(summary.successScore?.componentScores.academic_growth ?? "—")} description="Success score component" accent="indigo" icon={<span>A</span>} />
        <StatCard title="Scholarships" value={String(summary.scholarshipCount)} description="Funding records" accent="sky" icon={<span>$</span>} />
        <StatCard title="State Funding" value={summary.stateFundingVerified ? "Verified" : "Pending"} description="Verification status" accent="amber" icon={<span>F</span>} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Behavior" value={`${summary.positiveBehaviorCount}+`} description={`${summary.incidentCount} incidents`} accent="indigo" icon={<span>B</span>} />
        <StatCard title="Services" value={String(summary.activeServicesCount)} description="Scheduled sessions" accent="sky" icon={<span>S</span>} />
        <StatCard title="Parent Engagement" value={String(summary.parentEngagementScore)} description={summary.parentDisengaged ? "Disengaged" : "Active"} accent="emerald" icon={<span>P</span>} />
        <StatCard title="Tasks" value={String(summary.outstandingTasks)} description="Mission Control open items" accent="rose" icon={<span>T</span>} />
      </div>

      {summary.successScore && (
        <ProfileCard title="Student Success Score">
          <SuccessScoreBreakdown components={summary.successScore.componentScores} />
        </ProfileCard>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <ProfileCard title="Funding">
          <FundingSourceBadges codes={student.funding_sources} />
        </ProfileCard>
        <ProfileCard title="Enrollment">
          {enrollments.length === 0 ? (
            <ProfileEmpty>No enrollments</ProfileEmpty>
          ) : (
            <ul className="space-y-2 text-sm">
              {enrollments.map((e) => (
                <li key={e.id} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span>{e.school_years?.name ?? "—"}</span>
                  <span className="capitalize text-slate-500">{e.enrollment_status}</span>
                </li>
              ))}
            </ul>
          )}
        </ProfileCard>
      </div>
    </div>
  );
}

export function ProfilePanel({
  student,
  enrollments,
  conversion,
  lifecycleHistory,
}: {
  student: StudentRecord;
  enrollments: SisEnrollment[];
  conversion: StudentConversionLink | null;
  lifecycleHistory: Record<string, unknown>[];
}) {
  const stateIds = Array.isArray(student.state_student_ids) ? student.state_student_ids : [];
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ProfileCard title="Master Record">
        <dl className="grid gap-3 sm:grid-cols-2">
          <ProfileItem label="Legal Name" value={`${student.first_name} ${student.last_name}`} />
          <ProfileItem label="Preferred Name" value={student.preferred_name ?? "—"} />
          <ProfileItem label="Student ID" value={student.student_number ?? "—"} />
          <ProfileItem label="DOB" value={student.date_of_birth ?? "—"} />
          <ProfileItem label="Grade" value={gradeLabel(student.grade_level)} />
          <ProfileItem label="Program" value={programLabel(student.program)} />
          <ProfileItem label="School" value={student.schools?.name ?? "—"} />
          <ProfileItem label="Campus" value={student.campuses?.name ?? "—"} />
          <ProfileItem label="Lifecycle" value={student.lifecycle_stage ?? "—"} />
          <ProfileItem label="Status" value={student.enrollment_status} />
          <ProfileItem label="Start Date" value={student.enrollment_start_date ?? "—"} />
          <ProfileItem label="Exit Date" value={student.enrollment_exit_date ?? "—"} />
          <ProfileItem label="Graduation Year" value={student.graduation_year ? String(student.graduation_year) : "—"} />
          <ProfileItem
            label="State Student IDs"
            value={
              stateIds.length
                ? stateIds.map((s: { state: string; id: string }) => `${s.state}: ${s.id}`).join(", ")
                : "—"
            }
          />
        </dl>
      </ProfileCard>
      <ProfileCard title="Enrollments">
        {enrollments.length === 0 ? (
          <ProfileEmpty>No enrollments recorded</ProfileEmpty>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500">
                <th className="pb-2">Year</th>
                <th className="pb-2">Program</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((e) => (
                <tr key={e.id} className="border-t border-slate-100">
                  <td className="py-2">{e.school_years?.name ?? "—"}</td>
                  <td className="py-2">{programLabel(e.program)}</td>
                  <td className="py-2 capitalize">{e.enrollment_status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {conversion && (
          <p className="mt-4 text-xs text-slate-400">
            Converted from admissions on {new Date(conversion.converted_at).toLocaleDateString()} (
            {conversion.conversion_source})
          </p>
        )}
      </ProfileCard>
      {lifecycleHistory.length > 0 && (
        <ProfileCard title="Lifecycle History">
          <ul className="space-y-2 text-sm">
            {lifecycleHistory.map((t) => (
              <li key={String(t.id)} className="rounded-lg bg-slate-50 px-3 py-2 capitalize">
                {String(t.from_stage)} → {String(t.to_stage)}
                <span className="ml-2 text-xs text-slate-400">
                  {new Date(String(t.created_at)).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </ProfileCard>
      )}
    </div>
  );
}

export function MedicalPanel({
  medical,
  alertCount,
}: {
  medical: Record<string, unknown> | null;
  alertCount: number;
}) {
  if (!medical) {
    return (
      <ProfileCard title="Medical">
        <ProfileEmpty>No medical profile on file</ProfileEmpty>
      </ProfileCard>
    );
  }
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ProfileCard title="Health Summary">
        {alertCount > 0 && <ProfileBadge label={`${alertCount} active alerts`} tone="amber" />}
        <ProfileJsonList label="Allergies" items={medical.allergies} />
        <ProfileJsonList label="Medications" items={medical.medications} />
        <ProfileJsonList label="Diagnoses" items={medical.diagnoses} />
      </ProfileCard>
      <ProfileCard title="Care Team & Plans">
        <ProfileItem label="Physician" value={String(medical.physician_name ?? "—")} />
        <ProfileItem label="Insurance" value={String(medical.insurance_carrier ?? "—")} />
        {Boolean(medical.seizure_plan) && <ProfileItem label="Seizure Plan" value="On file" />}
        {Boolean(medical.diabetes_plan) && <ProfileItem label="Diabetes Plan" value="On file" />}
        {Boolean(medical.emergency_medical_plan) && (
          <p className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">
            {String(medical.emergency_medical_plan)}
          </p>
        )}
      </ProfileCard>
    </div>
  );
}

export function SpedPanel({
  plans,
  reviewDue,
}: {
  plans: Record<string, unknown>[];
  reviewDue: boolean;
}) {
  return (
    <div className="space-y-4">
      {reviewDue && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          A special education review is due within 30 days.
        </div>
      )}
      {plans.length === 0 ? (
        <ProfileCard title="Special Education">
          <ProfileEmpty>No IEP or 504 plans on file</ProfileEmpty>
        </ProfileCard>
      ) : (
        plans.map((plan) => (
          <ProfileCard key={String(plan.id)} title={`${String(plan.plan_type).toUpperCase()} Plan`}>
            <dl className="grid gap-2 sm:grid-cols-2 text-sm">
              <ProfileItem label="Status" value={String(plan.status)} />
              <ProfileItem label="Eligibility" value={String(plan.eligibility_category ?? "—")} />
              <ProfileItem label="Annual Review" value={String(plan.annual_review_date ?? "—")} />
              <ProfileItem label="Reevaluation" value={String(plan.reevaluation_date ?? "—")} />
            </dl>
            {Array.isArray(plan.accommodations) && plan.accommodations.length > 0 && (
              <div className="mt-3">
                <p className="text-xs uppercase text-slate-400">Accommodations</p>
                <ul className="mt-2 space-y-1 text-sm">
                  {(plan.accommodations as unknown[]).map((item, idx) => (
                    <li key={idx} className="rounded-lg bg-slate-50 px-3 py-1.5">
                      {typeof item === "string"
                        ? item
                        : String((item as { description?: string; name?: string }).description ?? (item as { name?: string }).name ?? JSON.stringify(item))}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </ProfileCard>
        ))
      )}
    </div>
  );
}

export function AcademicPanel({
  data,
}: {
  data: {
    profile: Record<string, unknown> | null;
    assessments: Record<string, unknown>[];
    goals: Record<string, unknown>[];
    interventions: Record<string, unknown>[];
  };
}) {
  const p = data.profile;
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ProfileCard title="Learning Profile">
        {!p ? (
          <ProfileEmpty>No learning profile</ProfileEmpty>
        ) : (
          <dl className="grid gap-2 sm:grid-cols-2 text-sm">
            <ProfileItem label="Reading" value={String(p.reading_level ?? "—")} />
            <ProfileItem label="Math" value={String(p.math_level ?? "—")} />
            <ProfileItem label="Writing" value={String(p.writing_level ?? "—")} />
            <ProfileItem label="Structured Literacy" value={String(p.structured_literacy_level ?? "—")} />
            <ProfileItem label="IEP Status" value={String(p.iep_status ?? "none")} />
          </dl>
        )}
      </ProfileCard>
      <ProfileCard title="Assessments & Interventions">
        <p className="text-xs uppercase text-slate-400">
          Recent Assessments ({data.assessments.length})
        </p>
        {data.assessments.slice(0, 5).map((a) => (
          <p key={String(a.id)} className="mt-1 text-sm">
            {String(a.assessment_type)} — {String(a.score ?? "—")} ({String(a.assessed_on)})
          </p>
        ))}
        <p className="mt-4 text-xs uppercase text-slate-400">
          Active Interventions ({data.interventions.length})
        </p>
        {data.interventions.slice(0, 5).map((i) => (
          <p key={String(i.id)} className="mt-1 text-sm">
            {String(i.intervention_type)}
          </p>
        ))}
      </ProfileCard>
    </div>
  );
}

export function AttendancePanel({
  records,
  summary,
}: {
  records: Record<string, unknown>[];
  summary: ExecutiveSummary | null;
}) {
  return (
    <div className="space-y-4">
      {summary && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard title="Rate" value={`${summary.attendanceRate}%`} description="This month" accent="emerald" icon={<span>A</span>} />
          <StatCard title="Absences" value={String(summary.absencesThisMonth)} description="This month" accent="amber" icon={<span>A</span>} />
          <StatCard title="Tardies" value={String(summary.tardiesThisMonth)} description="This month" accent="rose" icon={<span>T</span>} />
        </div>
      )}
      <ProfileCard title="Recent Attendance">
        {records.length === 0 ? (
          <ProfileEmpty>No attendance recorded</ProfileEmpty>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500">
                <th className="pb-2">Date</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={String(r.id)} className="border-t border-slate-100">
                  <td className="py-2">{String(r.attendance_date)}</td>
                  <td className="py-2 capitalize">{String(r.status).replace(/_/g, " ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </ProfileCard>
    </div>
  );
}

export function BehaviorPanel({
  events,
  summary,
}: {
  events: Record<string, unknown>[];
  summary: ExecutiveSummary | null;
}) {
  return (
    <div className="space-y-4">
      {summary && (
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard title="Positive" value={String(summary.positiveBehaviorCount)} description="This month" accent="emerald" icon={<span>+</span>} />
          <StatCard title="Incidents" value={String(summary.incidentCount)} description="This month" accent="rose" icon={<span>!</span>} />
        </div>
      )}
      <ProfileCard title="Recent Events">
        {events.length === 0 ? (
          <ProfileEmpty>No behavior events</ProfileEmpty>
        ) : (
          <ul className="space-y-2 text-sm">
            {events.map((e) => (
              <li key={String(e.id)} className="rounded-lg bg-slate-50 px-3 py-2">
                <span className="font-medium capitalize">{String(e.event_type).replace(/_/g, " ")}</span>
                <span className="ml-2 text-slate-500">{String(e.title)}</span>
                <p className="text-xs text-slate-400">
                  {new Date(String(e.occurred_at)).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </ProfileCard>
    </div>
  );
}

export function ServicesPanel({
  sessions,
  count,
}: {
  sessions: Record<string, unknown>[];
  count: number;
}) {
  return (
    <ProfileCard title={`Student Services (${count} upcoming)`}>
      {sessions.length === 0 ? (
        <ProfileEmpty>No service sessions recorded</ProfileEmpty>
      ) : (
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-slate-500">
              <th className="pb-2">Type</th>
              <th className="pb-2">Scheduled</th>
              <th className="pb-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={String(s.id)} className="border-t border-slate-100">
                <td className="py-2 capitalize">{String(s.service_type).replace(/_/g, " ")}</td>
                <td className="py-2">
                  {s.scheduled_at ? new Date(String(s.scheduled_at)).toLocaleString() : "—"}
                </td>
                <td className="py-2 capitalize">{String(s.session_status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </ProfileCard>
  );
}

export function DocumentsPanel({
  documents,
  conversion,
}: {
  documents: Record<string, unknown>[];
  conversion: StudentConversionLink | null;
}) {
  return (
    <ProfileCard title="Document Vault">
      {conversion && (
        <p className="mb-4 text-sm text-slate-500">
          Documents inherited from admissions are marked with source type &quot;admissions&quot;.
        </p>
      )}
      {documents.length === 0 ? (
        <ProfileEmpty>No documents on file</ProfileEmpty>
      ) : (
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-slate-500">
              <th className="pb-2">Type</th>
              <th className="pb-2">File</th>
              <th className="pb-2">Source</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((d) => (
              <tr key={String(d.id)} className="border-t border-slate-100">
                <td className="py-2 capitalize">{String(d.document_type).replace(/_/g, " ")}</td>
                <td className="py-2">{String(d.file_name)}</td>
                <td className="py-2 capitalize">{String(d.source_type ?? "upload")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </ProfileCard>
  );
}

export function FundingPanel({
  records,
  summary,
  schoolId,
}: {
  records: Record<string, unknown>[];
  summary: ExecutiveSummary | null;
  schoolId: string;
}) {
  return (
    <div className="space-y-4">
      {summary && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard title="Funding Records" value={String(summary.fundingRecordCount)} description="All sources" accent="indigo" icon={<span>F</span>} />
          <StatCard title="Scholarships" value={String(summary.scholarshipCount)} description="School + outside" accent="sky" icon={<span>S</span>} />
          <StatCard title="State Funding" value={summary.stateFundingVerified ? "Verified" : "Pending"} description="ESA / vouchers" accent="emerald" icon={<span>V</span>} />
        </div>
      )}
      <ProfileCard title="Funding Center">
        {records.length === 0 ? (
          <ProfileEmpty>No funding records synced yet</ProfileEmpty>
        ) : (
          <>
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-slate-500">
                  <th className="pb-2">Category</th>
                  <th className="pb-2">Program</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={String(r.id)} className="border-t border-slate-100">
                    <td className="py-2 capitalize">{String(r.funding_category).replace(/_/g, " ")}</td>
                    <td className="py-2">{String(r.program_name ?? "—")}</td>
                    <td className="py-2">{r.award_amount ? `$${r.award_amount}` : "—"}</td>
                    <td className="py-2 capitalize">{String(r.verification_status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <a
              href={`/api/ssis/funding-export?schoolId=${encodeURIComponent(schoolId)}`}
              className="mt-4 inline-block text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              Export funding report (CSV) →
            </a>
          </>
        )}
      </ProfileCard>
    </div>
  );
}

export function EngagementPanel({
  data,
}: {
  data: {
    events: Record<string, unknown>[];
    engagementScore: number;
    portalLogins: number;
    messages: number;
    documentUploads: number;
    disengaged: boolean;
  };
}) {
  return (
    <div className="space-y-4">
      {data.disengaged && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          This family shows low engagement over the last 30 days. Consider outreach.
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard title="Score" value={String(data.engagementScore)} description="30-day engagement" accent="indigo" icon={<span>E</span>} />
        <StatCard title="Portal Logins" value={String(data.portalLogins)} description="Last 30 days" accent="emerald" icon={<span>L</span>} />
        <StatCard title="Messages" value={String(data.messages)} description="Last 30 days" accent="sky" icon={<span>M</span>} />
        <StatCard title="Uploads" value={String(data.documentUploads)} description="Documents" accent="amber" icon={<span>U</span>} />
      </div>
      <ProfileCard title="Engagement History">
        {data.events.length === 0 ? (
          <ProfileEmpty>No engagement events recorded</ProfileEmpty>
        ) : (
          <ul className="space-y-2 text-sm">
            {data.events.map((e) => (
              <li key={String(e.id)} className="rounded-lg bg-slate-50 px-3 py-2">
                <span className="font-medium capitalize">{String(e.event_type).replace(/_/g, " ")}</span>
                <span className="ml-2 text-slate-500">{String(e.summary)}</span>
                <p className="text-xs text-slate-400">
                  {new Date(String(e.occurred_at)).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </ProfileCard>
    </div>
  );
}

export function PlaceholderMessagePanel({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <ProfileCard title={title}>
      <ProfileEmpty>{message}</ProfileEmpty>
    </ProfileCard>
  );
}

export function BillingPanel({
  profile,
  studentId,
}: {
  profile: Record<string, unknown> | null;
  studentId: string;
}) {
  if (!profile) {
    return (
      <ProfileCard title="Tuition & Billing">
        <ProfileEmpty>No billing account linked to this student&apos;s family</ProfileEmpty>
      </ProfileCard>
    );
  }

  const account = profile.account as { balance?: number; account_status?: string } | null;
  const studentInvoices = (profile.studentInvoices as Record<string, unknown>[]) ?? [];
  const paymentPlans = (profile.paymentPlans as Record<string, unknown>[]) ?? [];
  const family = profile.family as { family_name?: string } | null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Account Balance"
          value={formatCurrency(Number(account?.balance ?? 0))}
          description={account?.account_status ?? "—"}
          accent="indigo"
          icon={<span>$</span>}
        />
        <StatCard
          title="Student Invoices"
          value={String(studentInvoices.length)}
          description="Assigned to this student"
          accent="sky"
          icon={<span>I</span>}
        />
        <StatCard
          title="Payment Plans"
          value={String(paymentPlans.length)}
          description={family?.family_name ?? "Family account"}
          accent="emerald"
          icon={<span>P</span>}
        />
      </div>
      <ProfileCard title="Student Invoices">
        {studentInvoices.length === 0 ? (
          <ProfileEmpty>No invoices assigned to this student yet</ProfileEmpty>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500">
                <th className="pb-2">Invoice</th>
                <th className="pb-2">Due</th>
                <th className="pb-2">Total</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {studentInvoices.map((inv) => (
                <tr key={String(inv.id)} className="border-t border-slate-100">
                  <td className="py-2">{String(inv.invoice_number)}</td>
                  <td className="py-2">{String(inv.due_date)}</td>
                  <td className="py-2">{formatCurrency(Number(inv.total_amount ?? 0))}</td>
                  <td className="py-2 capitalize">{String(inv.invoice_status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </ProfileCard>
      {profile.family ? (
        <Link
          href={`/dashboard/families/${(profile.family as { id: string }).id}?section=tuition`}
          className="inline-block text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          Open family billing center →
        </Link>
      ) : null}
    </div>
  );
}

export function SchedulingPanel({
  sessions,
  services,
  courseEnrollments,
}: {
  sessions: Record<string, unknown>[];
  services: Record<string, unknown>[];
  courseEnrollments?: Record<string, unknown>[];
}) {
  const hasEntries = sessions.length > 0 || services.length > 0 || (courseEnrollments?.length ?? 0) > 0;
  if (!hasEntries) {
    return (
      <ProfileCard title="Schedule">
        <ProfileEmpty>No schedule entries — enroll in a course section to populate the timetable</ProfileEmpty>
      </ProfileCard>
    );
  }

  return (
    <div className="space-y-6">
      {(courseEnrollments?.length ?? 0) > 0 && (
        <ProfileCard title="Course Enrollments">
          <ul className="space-y-2 text-sm">
            {courseEnrollments!.map((e) => {
              const cs = Array.isArray(e.course_sections) ? e.course_sections[0] : e.course_sections;
              const course = cs && (Array.isArray(cs.courses) ? cs.courses[0] : cs.courses);
              return (
                <li key={String(e.id)} className="rounded-lg bg-slate-50 px-3 py-2">
                  {(course as { name?: string })?.name ?? "Course"} ·{" "}
                  {(cs as { section_code?: string })?.section_code ?? "Section"}
                  <span className="ml-2 capitalize text-slate-500">{String(e.enrollment_status)}</span>
                </li>
              );
            })}
          </ul>
        </ProfileCard>
      )}
      {sessions.length > 0 && (
        <ProfileCard title="Upcoming Instructional Sessions">
          <ul className="space-y-2 text-sm">
            {sessions.map((s) => {
              const cs = Array.isArray(s.course_sections) ? s.course_sections[0] : s.course_sections;
              const course = cs && (Array.isArray(cs.courses) ? cs.courses[0] : cs.courses);
              return (
                <li key={String(s.id)} className="rounded-lg bg-slate-50 px-3 py-2">
                  {(course as { name?: string })?.name ?? "Session"} —{" "}
                  {s.scheduled_start
                    ? new Date(String(s.scheduled_start)).toLocaleString()
                    : "—"}
                </li>
              );
            })}
          </ul>
        </ProfileCard>
      )}
      {services.length > 0 && (
        <ProfileCard title="Upcoming Service Sessions">
          <ul className="space-y-2 text-sm">
            {services.map((s) => (
              <li key={String(s.id)} className="rounded-lg bg-slate-50 px-3 py-2 capitalize">
                {String(s.service_type).replace(/_/g, " ")} —{" "}
                {s.scheduled_at ? new Date(String(s.scheduled_at)).toLocaleString() : "—"}
              </li>
            ))}
          </ul>
        </ProfileCard>
      )}
    </div>
  );
}

export function LearningJourneyPanel({
  journey,
  domains,
  competencies,
  evidence,
}: {
  journey: Record<string, unknown> | null;
  domains: Record<string, unknown>[];
  competencies: Record<string, unknown>[];
  evidence: Record<string, unknown>[];
}) {
  if (!journey) {
    return (
      <ProfileCard title="Personal Learning Journey">
        <ProfileEmpty>No active learning journey — created automatically at enrollment</ProfileEmpty>
      </ProfileCard>
    );
  }

  return (
    <div className="space-y-6">
      <ProfileCard title="PAJ Journey">
        <dl className="grid gap-2 sm:grid-cols-2 text-sm">
          <ProfileItem label="Status" value={String(journey.status)} />
          <ProfileItem label="Track" value={String(journey.program_track ?? "—")} />
          <ProfileItem label="Started" value={journey.started_at ? new Date(String(journey.started_at)).toLocaleDateString() : "—"} />
          <ProfileItem label="Domains" value={String(domains.length)} />
        </dl>
      </ProfileCard>
      <ProfileCard title={`Competencies (${competencies.length})`}>
        {competencies.length === 0 ? (
          <ProfileEmpty>No competency progress recorded yet</ProfileEmpty>
        ) : (
          <ul className="space-y-2 text-sm">
            {competencies.slice(0, 20).map((c) => (
              <li key={String(c.id)} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span>{String(c.competency_key)}</span>
                <span className="text-slate-500">Level {String(c.mastery_level ?? 0)}</span>
              </li>
            ))}
          </ul>
        )}
      </ProfileCard>
      <ProfileCard title={`Evidence (${evidence.length})`}>
        {evidence.length === 0 ? (
          <ProfileEmpty>No evidence artifacts linked yet</ProfileEmpty>
        ) : (
          <ul className="space-y-2 text-sm">
            {evidence.slice(0, 15).map((e) => (
              <li key={String(e.id)} className="rounded-lg bg-slate-50 px-3 py-2">
                <span className="font-medium">{String(e.evidence_type_key ?? "evidence")}</span>
                <span className="ml-2 text-slate-500">
                  {e.captured_at ? new Date(String(e.captured_at)).toLocaleDateString() : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </ProfileCard>
    </div>
  );
}

export function GraduationReadinessPanel({
  graduationScore,
  ruleOutcome,
  explanation,
  successScore,
  proficientCount,
  evidenceCount,
}: {
  graduationScore: number;
  ruleOutcome?: string;
  explanation?: string;
  successScore: {
    overallScore?: number;
    statusIndicator?: string;
    componentScores?: Record<string, number>;
  } | null;
  proficientCount: number;
  evidenceCount: number;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Readiness Score" value={`${graduationScore}%`} description={ruleOutcome ?? "Rules engine"} accent="emerald" icon={<span>G</span>} />
        <StatCard title="Proficient Competencies" value={String(proficientCount)} description="Mastery level 3+" accent="indigo" icon={<span>C</span>} />
        <StatCard title="Evidence Artifacts" value={String(evidenceCount)} description="ULR-linked" accent="sky" icon={<span>E</span>} />
      </div>
      {explanation && (
        <ProfileCard title="Rules Engine Assessment">
          <p className="text-sm text-slate-700">{explanation}</p>
        </ProfileCard>
      )}
      {successScore?.componentScores && (
        <ProfileCard title="Student Success Score">
          <SuccessScoreBreakdown components={successScore.componentScores} />
        </ProfileCard>
      )}
    </div>
  );
}

export function TeachersPanel({
  team,
  members,
}: {
  team: Record<string, unknown> | null;
  members: Record<string, unknown>[];
}) {
  if (!team && members.length === 0) {
    return (
      <ProfileCard title="Instructional Team">
        <ProfileEmpty>No instructional team assigned — synced from course roster at enrollment</ProfileEmpty>
      </ProfileCard>
    );
  }

  return (
    <ProfileCard title="Instructional Team">
      {members.length === 0 ? (
        <ProfileEmpty>Team record exists but no members assigned yet</ProfileEmpty>
      ) : (
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-slate-500">
              <th className="pb-2">Role</th>
              <th className="pb-2">Staff</th>
              <th className="pb-2">Primary</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => {
              const emp = Array.isArray(m.employees) ? m.employees[0] : m.employees;
              const profile = emp && (Array.isArray(emp.employee_profiles) ? emp.employee_profiles[0] : emp.employee_profiles);
              return (
                <tr key={String(m.id)} className="border-t border-slate-100">
                  <td className="py-2 capitalize">{String(m.team_role ?? "staff").replace(/_/g, " ")}</td>
                  <td className="py-2">{(profile as { display_name?: string })?.display_name ?? "Staff"}</td>
                  <td className="py-2">{m.is_primary ? "Yes" : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </ProfileCard>
  );
}

export function GradeHistoryPanel({
  lifecycle,
  enrollments,
  courseEnrollments,
}: {
  lifecycle: Record<string, unknown>[];
  enrollments: Record<string, unknown>[];
  courseEnrollments: Record<string, unknown>[];
}) {
  return (
    <div className="space-y-6">
      <ProfileCard title="School Year Enrollments">
        {enrollments.length === 0 ? (
          <ProfileEmpty>No enrollment history</ProfileEmpty>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500">
                <th className="pb-2">Year</th>
                <th className="pb-2">Program</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((e) => (
                <tr key={String(e.id)} className="border-t border-slate-100">
                  <td className="py-2">{(e.school_years as { name?: string })?.name ?? "—"}</td>
                  <td className="py-2">{programLabel(String(e.program ?? ""))}</td>
                  <td className="py-2 capitalize">{String(e.enrollment_status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </ProfileCard>
      {courseEnrollments.length > 0 && (
        <ProfileCard title="Course Enrollment History">
          <ul className="space-y-2 text-sm">
            {courseEnrollments.map((e) => {
              const cs = Array.isArray(e.course_sections) ? e.course_sections[0] : e.course_sections;
              const course = cs && (Array.isArray(cs.courses) ? cs.courses[0] : cs.courses);
              return (
                <li key={String(e.id)} className="rounded-lg bg-slate-50 px-3 py-2">
                  {(course as { name?: string })?.name ?? "Course"} ·{" "}
                  {(e.school_years as { name?: string })?.name ?? ""}
                  <span className="ml-2 text-slate-500">
                    {e.enrolled_at ? new Date(String(e.enrolled_at)).toLocaleDateString() : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        </ProfileCard>
      )}
      {lifecycle.length > 0 && (
        <ProfileCard title="Lifecycle Transitions">
          <ul className="space-y-2 text-sm">
            {lifecycle.map((t) => (
              <li key={String(t.id)} className="rounded-lg bg-slate-50 px-3 py-2 capitalize">
                {String(t.from_stage)} → {String(t.to_stage)}
                <span className="ml-2 text-xs text-slate-400">
                  {new Date(String(t.created_at)).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </ProfileCard>
      )}
    </div>
  );
}
