/**
 * ONE CHILD, EVERYTHING THE FAMILY TOLD US, ON ONE PAGE.
 *
 * Jimmy, 18 October 2026: "when user clicks on a students card they see all
 * of their inquiry/application information". Asked how, he chose "Whole card
 * → one page": the inquiry and the application together, no tabs.
 *
 * NOTHING NEW IS READ OR DRAWN HERE. Each block is the case page's own section
 * - the same loader, the same component, the same permission check - stacked
 * in the order the family filled them in. A section the viewer may not see,
 * or that fails to load, is left out rather than taking the page down.
 *
 * The full case page (notes, tasks, letters, the stage controls) is one link
 * away at the top.
 */
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import "@/lib/platform/profile";

import { AdmissionsCaseSectionSwitch } from "@/components/admissions/case/sections/AdmissionsCaseSectionSwitch";
import {
  buildAdmissionsCaseHref,
  loadAdmissionsCaseSectionData,
  resolveAdmissionsCaseProfile,
} from "@/lib/admissions/profile";
import { isAdmissionsCaseProfileEnvelope } from "@/lib/admissions/profile/types";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { createAuthClient } from "@/lib/supabase/server-auth";

export const dynamic = "force-dynamic";

const SECTIONS: ReadonlyArray<{ key: string; title: string }> = [
  { key: "prospect", title: "Family and child" },
  { key: "interest_form", title: "Inquiry" },
  { key: "student_questionnaire", title: "Student questionnaire" },
  { key: "applications", title: "Application" },
  { key: "documents", title: "Documents" },
];

const SECTION_PERMISSIONS = ["admissions.view", "admissions.manage", "admissions.accept"];

interface FullRecordPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdmissionsCaseFullRecordPage({ params }: FullRecordPageProps) {
  const ctx = await getIdentityContext();
  if (!ctx) redirect("/login");

  const { id } = await params;
  const supabase = await createAuthClient();

  const profile = await resolveAdmissionsCaseProfile(supabase, id, {});
  if (!profile) notFound();
  const envelope = profile.envelope;
  if (!isAdmissionsCaseProfileEnvelope(envelope)) notFound();

  const allowed = SECTION_PERMISSIONS.some((p) => envelope.permissions.includes(p));
  if (!allowed) notFound();

  const loaded = await Promise.all(
    SECTIONS.map(async (section) => {
      try {
        const data = await loadAdmissionsCaseSectionData(supabase, envelope, section.key);
        return { ...section, data, ok: true as const };
      } catch {
        return { ...section, data: null, ok: false as const };
      }
    })
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{envelope.displayName}</h1>
          {envelope.subtitle ? (
            <p className="mt-1 text-sm text-slate-500">{envelope.subtitle}</p>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/admissions?view=pipeline"
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            ← Pipeline
          </Link>
          <Link
            href={buildAdmissionsCaseHref(id)}
            className="rounded-xl border border-brand-200 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
          >
            Full case page
          </Link>
        </div>
      </div>

      {loaded
        .filter((s) => s.ok)
        .map((s) => (
          <section key={s.key} className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">{s.title}</h2>
            <AdmissionsCaseSectionSwitch envelope={envelope} data={s.data} sectionKey={s.key} />
          </section>
        ))}
    </div>
  );
}
