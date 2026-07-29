import Link from "next/link";
import { PublicContentPage } from "@/components/admissions/experience/PublicContentPage";
import { PROGRAMS } from "@/lib/constants/programs";

export default function AdmissionsProgramsPage() {
  return (
    <PublicContentPage
      title="Programs"
      subtitle="Choose the learning path that fits your student. Selection carries into the online application."
    >
      <ul className="not-prose grid gap-4 sm:grid-cols-2">
        {PROGRAMS.map((p) => (
          <li key={p.value} className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-slate-900">{p.label}</h2>
            <p className="mt-2 text-sm text-slate-600">
              Apply with program of interest selected — Admissions CRM and Learning
              Intelligence use the same program codes.
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-8">
        <Link href="/apply" className="font-medium text-slate-900 underline">
          Start interest form →
        </Link>
      </p>
    </PublicContentPage>
  );
}
