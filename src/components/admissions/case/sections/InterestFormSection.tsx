import { ProfileItem } from "@/components/platform/profile-workspace/ProfilePrimitives";
import { missing } from "./shared";
import type { ProfileSectionViewProps } from "@/lib/platform/profile/sections/types";

/**
 * What the family actually said.
 *
 * Until 17 September 2026 there was nowhere in JAG to read a family's inquiry
 * form. The answers have been stored since migration 223 and exactly one
 * function read them — getInquiryHighlights, which returns two fields and feeds
 * only the Decisions screen, so a family's own words were visible while a
 * decision was open and vanished the moment it was answered.
 *
 * The same was true of `admissions_leads.notes`. The September import wrote
 * every family's GREATNESS and challenges into that column for 300-odd
 * children, migration 238 wrote Julian Oubre Towa's history there, and the
 * Overview section loads the lead with select("*") and renders none of it. The
 * Notes tab reads `admissions_notes`, a different table entirely.
 *
 * So this section is two things a school leader has never been able to see:
 * the form, and the notes column.
 *
 * ORDER IS DELIBERATE. The family's own sentences come first, above anything
 * the system recorded about them, because the decision this page exists to
 * support is about a child, not a record.
 */

type Answer = { question_key: string; value: unknown };

type Data = {
  submittedAt: string | null;
  answers: Answer[];
  labels: Record<string, string>;
  leadNotes: string | null;
  unavailable: string | null;
} | null;

/** jsonb holds strings, numbers, booleans and arrays. Render each honestly. */
function renderValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value.trim() || "—";
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) {
    const parts = value.map((v) => renderValue(v)).filter((v) => v !== "—");
    return parts.length ? parts.join(", ") : "—";
  }
  return JSON.stringify(value);
}

/** student_greatness -> "Student greatness", when the form gave us no label. */
function humanise(key: string): string {
  const words = key.replace(/[_-]+/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function InterestFormSection(props: ProfileSectionViewProps) {
  const data = props.data as Data;
  if (!data) return missing("Interest form");

  /*
   * An error is not the same as an empty form, and saying "no interest form"
   * over a failed read is the costume this codebase keeps handing to failure.
   */
  if (data.unavailable) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <p className="font-medium">The interest form could not be loaded.</p>
        <p className="mt-1">{data.unavailable}</p>
        <p className="mt-1">This is not the same as the family not having filled one in.</p>
      </div>
    );
  }

  const hasForm = data.answers.length > 0;
  const hasNotes = Boolean(data.leadNotes?.trim());

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-900">
            What the family told us
          </h3>
          {data.submittedAt && (
            <span className="text-xs text-slate-500">
              Submitted {new Date(data.submittedAt).toLocaleDateString()}
            </span>
          )}
        </div>

        {hasForm ? (
          <dl className="mt-3 space-y-3">
            {data.answers.map((a) => (
              <div key={a.question_key}>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  {data.labels[a.question_key] ?? humanise(a.question_key)}
                </dt>
                {/* whitespace-pre-line: a parent's paragraphs are theirs to keep. */}
                <dd className="mt-0.5 whitespace-pre-line text-sm text-slate-800">
                  {renderValue(a.value)}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="mt-2 text-sm text-slate-500">
            No interest form on file. This family was added by import or by hand
            rather than through the public form, so there are no answers to show.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">
          Notes recorded on this lead
        </h3>
        <p className="mt-0.5 text-xs text-slate-500">
          Written by imports and migrations. Separate from the Notes tab, which
          holds notes staff have typed.
        </p>
        {hasNotes ? (
          <p className="mt-3 whitespace-pre-line text-sm text-slate-800">
            {data.leadNotes}
          </p>
        ) : (
          <p className="mt-2 text-sm text-slate-500">Nothing recorded.</p>
        )}
      </section>

      {!hasForm && !hasNotes && (
        <ProfileItem
          label="Where the family's words would come from"
          value="The public inquiry form at /apply, or the GREATNESS and challenges captured on an import."
        />
      )}
    </div>
  );
}
