"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  describeOutcome,
  validateSchoolContact,
  type SchoolContactPatch,
} from "@/lib/admissions/school-contacts-shared";
import { updateSchoolAdmissionsContact } from "@/lib/admissions/school-contact-actions";

/**
 * One card per school. Saved individually, because these are four different
 * people's details and a single Save that writes all four invites a typo in one
 * to be filed alongside three corrections.
 */

export interface SchoolContactRow extends SchoolContactPatch {
  readonly id: string;
  readonly name: string;
  readonly leadCount: number;
}

function SchoolCard({ initial }: { initial: SchoolContactRow }) {
  const router = useRouter();
  const [patch, setPatch] = useState<SchoolContactPatch>({
    contactName: initial.contactName,
    contactEmail: initial.contactEmail,
    bookingUrl: initial.bookingUrl,
    publicInquiries: initial.publicInquiries,
    fromEmail: initial.fromEmail,
  });
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const issues = validateSchoolContact(patch);
  const issueFor = (field: keyof SchoolContactPatch) =>
    issues.find((i) => i.field === field)?.message ?? null;

  const dirty =
    patch.contactName !== initial.contactName ||
    patch.contactEmail !== initial.contactEmail ||
    patch.bookingUrl !== initial.bookingUrl ||
    patch.publicInquiries !== initial.publicInquiries ||
    patch.fromEmail !== initial.fromEmail;

  // A malformed value is refused; "public but nobody to tell" is a warning, and
  // saving it is a decision the user is allowed to make.
  const blocked = issues.some(
    (i) => !(i.field === "contactEmail" && patch.publicInquiries && !patch.contactEmail)
  );

  function set<K extends keyof SchoolContactPatch>(key: K, value: SchoolContactPatch[K]) {
    setPatch((p) => ({ ...p, [key]: value }));
    setResult(null);
  }

  async function save() {
    setSaving(true);
    setResult(null);
    const out = await updateSchoolAdmissionsContact({ schoolId: initial.id, patch });
    setSaving(false);
    setResult(
      out.ok ? { ok: true, message: out.message } : { ok: false, message: out.error }
    );
    if (out.ok) router.refresh();
  }

  const field =
    "w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-slate-400";
  const label = "mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold text-slate-900">{initial.name}</h2>
        <span className="text-xs text-slate-500">
          {initial.leadCount} {initial.leadCount === 1 ? "inquiry" : "inquiries"} received
        </span>
      </div>

      <p className="mt-1 text-xs text-slate-500">{describeOutcome(patch)}</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={label}>Admissions contact</span>
          <input
            value={patch.contactName ?? ""}
            onChange={(e) => set("contactName", e.target.value || null)}
            placeholder="Name shown to families"
            className={field}
          />
        </label>

        <label className="block">
          <span className={label}>Contact email</span>
          <input
            type="email"
            value={patch.contactEmail ?? ""}
            onChange={(e) => set("contactEmail", e.target.value || null)}
            placeholder="name@theacademyway.org"
            className={field}
          />
          <span className="mt-1 block text-xs text-slate-400">
            Where inquiry alerts go, and where a parent&rsquo;s reply lands. Mail is still
            sent from the school&rsquo;s verified address.
          </span>
          {issueFor("contactEmail") && (
            <span className="mt-1 block text-xs text-amber-700">{issueFor("contactEmail")}</span>
          )}
        </label>

        <label className="block sm:col-span-2">
          <span className={label}>Send mail from</span>
          <input
            type="email"
            value={patch.fromEmail ?? ""}
            onChange={(e) => set("fromEmail", e.target.value || null)}
            placeholder="Leave blank until the domain is verified in Resend"
            className={field}
          />
          <span className="mt-1 block text-xs text-slate-400">
            The address families see this school&rsquo;s email come from. The domain must be
            verified in Resend first — an unverified sender is rejected and the email never
            arrives. Blank uses the network default, which is the right setting until DNS is
            done.
          </span>
          {issueFor("fromEmail") && (
            <span className="mt-1 block text-xs text-rose-700">{issueFor("fromEmail")}</span>
          )}
        </label>

        <label className="block sm:col-span-2">
          <span className={label}>Google appointment schedule link</span>
          <input
            value={patch.bookingUrl ?? ""}
            onChange={(e) => set("bookingUrl", e.target.value || null)}
            placeholder="https://calendar.google.com/calendar/appointments/schedules/…"
            className={field}
          />
          <span className="mt-1 block text-xs text-slate-400">
            Google Calendar → Create → Appointment schedule → Share → copy the booking page
            link. Leave blank and families are told someone will be in touch instead.
          </span>
          {issueFor("bookingUrl") && (
            <span className="mt-1 block text-xs text-rose-700">{issueFor("bookingUrl")}</span>
          )}
        </label>
      </div>

      <label className="mt-4 flex cursor-pointer items-start gap-2">
        <input
          type="checkbox"
          checked={patch.publicInquiries}
          onChange={(e) => set("publicInquiries", e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-slate-300"
        />
        <span className="text-sm text-slate-700">
          Show this school on the public inquiry form
          <span className="block text-xs text-slate-400">
            Unticked, families cannot choose it — the school is invisible at /apply.
          </span>
        </span>
      </label>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving || !dirty || blocked}
          className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {!dirty && !result && <span className="text-xs text-slate-400">No changes</span>}
        {result && (
          <span className={`text-sm ${result.ok ? "text-emerald-700" : "text-rose-700"}`}>
            {result.message}
          </span>
        )}
      </div>
    </div>
  );
}

export function SchoolAdmissionsContactPanel({ schools }: { schools: SchoolContactRow[] }) {
  if (!schools.length) {
    return (
      <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        No schools are visible to you.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {schools.map((school) => (
        <SchoolCard key={school.id} initial={school} />
      ))}
    </div>
  );
}
