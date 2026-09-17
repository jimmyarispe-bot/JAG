import Link from "next/link";
import { buildAdmissionsCaseSectionHref } from "@/lib/admissions/profile/href";
import { pipelineStageColor } from "@/lib/admissions/registry";
import type { AdmissionsCaseProfileEnvelope } from "@/lib/admissions/profile/types";

/** A date the family typed, shown the way a person would say it. */
function readableDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="text-xs uppercase tracking-wide text-slate-400">{label}</span>
      <span className="text-sm text-slate-700">{children}</span>
    </span>
  );
}

/**
 * The facts that belong beside a child's name on every screen.
 *
 * Staff open a case to DO something - ring the parent, check the grade, confirm
 * the campus - and until now every one of those answers lived on a tab. The
 * phone number was four clicks from the name on a card whose whole purpose is
 * that child.
 *
 * Email and phone are real links. On a phone the number dials; on a desktop the
 * address opens the mail client. A number you have to retype is a number that
 * gets retyped wrong.
 *
 * Every field is omitted when empty rather than shown as a dash. A row of
 * "Grade —  Start —  Phone —" reads as a broken screen; its absence reads as
 * what it is, which is a family who has not told us yet.
 */
export function AdmissionsCaseProfileBadges({
  envelope,
}: {
  envelope: AdmissionsCaseProfileEnvelope;
}) {
  const color = envelope.pipelineStage
    ? pipelineStageColor(envelope.pipelineStage)
    : "bg-slate-100 text-slate-700";

  const startDate = readableDate(envelope.desiredStartDate);

  return (
    <div className="flex w-full flex-col gap-2">
      <span className={`w-fit rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
        {envelope.pipelineStageLabel}
      </span>

      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
        {envelope.schoolName && <Fact label="School">{envelope.schoolName}</Fact>}
        {envelope.applyingForGrade && (
          <Fact label="Grade">{envelope.applyingForGrade.replace(/_/g, " ")}</Fact>
        )}
        {startDate && <Fact label="Start">{startDate}</Fact>}
        {envelope.guardianName && <Fact label="Parent">{envelope.guardianName}</Fact>}
        {envelope.guardianEmail && (
          <Fact label="Email">
            <a
              href={`mailto:${envelope.guardianEmail}`}
              className="text-brand-700 hover:underline"
            >
              {envelope.guardianEmail}
            </a>
          </Fact>
        )}
        {envelope.guardianPhone && (
          <Fact label="Phone">
            <a
              href={`tel:${envelope.guardianPhone.replace(/[^+\d]/g, "")}`}
              className="text-brand-700 hover:underline"
            >
              {envelope.guardianPhone}
            </a>
          </Fact>
        )}
      </div>
    </div>
  );
}

export function AdmissionsCaseProfileHeaderActions({
  envelope,
}: {
  envelope: AdmissionsCaseProfileEnvelope;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={buildAdmissionsCaseSectionHref(envelope.caseId, "pipeline")}
        className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Pipeline
      </Link>
      <Link
        href={buildAdmissionsCaseSectionHref(envelope.caseId, "decisions")}
        className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Decisions
      </Link>
      <Link
        href={buildAdmissionsCaseSectionHref(envelope.caseId, "notes")}
        className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Notes
      </Link>
    </div>
  );
}
