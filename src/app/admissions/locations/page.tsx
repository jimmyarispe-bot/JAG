import Link from "next/link";
import { PublicContentPage } from "@/components/admissions/experience/PublicContentPage";
import { getSchoolsForInquiry } from "@/lib/admissions/portal/queries";

export default async function AdmissionsLocationsPage() {
  const schools = await getSchoolsForInquiry();
  return (
    <PublicContentPage
      title="Locations"
      subtitle="Campus and school locations available for inquiry, tours, and enrollment."
    >
      <ul className="not-prose grid gap-3 sm:grid-cols-2">
        {schools.map((s) => (
          <li key={s.id} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800">
            {s.name}
          </li>
        ))}
        {schools.length === 0 && (
          <li className="text-slate-600">Locations will appear when schools are published for inquiry.</li>
        )}
      </ul>
      <p className="mt-8">
        <Link href="/admissions/schedule-tour" className="font-medium text-slate-900 underline">
          Schedule a campus tour →
        </Link>
      </p>
    </PublicContentPage>
  );
}
