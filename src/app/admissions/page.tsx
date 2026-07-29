import Link from "next/link";
import { AdmissionsPublicShell } from "@/components/admissions/experience/AdmissionsPublicShell";

const CTA = [
  {
    href: "/apply",
    title: "Interest form",
    body: "Share parent and student details to enter the admissions CRM pipeline.",
  },
  {
    href: "/admissions/discovery-call",
    title: "Discovery call",
    body: "Schedule a conversation with admissions — confirmation and reminders follow.",
  },
  {
    href: "/admissions/assessment",
    title: "Assessment request",
    body: "Request a learning assessment with document upload and status tracking.",
  },
  {
    href: "/apply/portal",
    title: "Application dashboard",
    body: "Track draft through enrolled status, documents, scholarships, and tuition.",
  },
];

export default function AdmissionsLandingPage() {
  return (
    <AdmissionsPublicShell>
      <section className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.14em] text-slate-500">
            Admissions Experience
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            A clear path from inquiry to first day
          </h1>
          <p className="mt-4 max-w-xl text-lg text-slate-600">
            Explore programs, request a tour or assessment, apply online, and complete
            enrollment — all orchestrated on Identity, Knowledge, Finance, Workflow, and
            Learning Intelligence.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/apply"
              className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
            >
              Start interest form
            </Link>
            <Link
              href="/admissions/schedule-tour"
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              Schedule a tour
            </Link>
            <Link
              href="/admissions/programs"
              className="rounded-lg border border-transparent px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              View programs
            </Link>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Journey
          </h2>
          <ol className="mt-4 space-y-3 text-sm text-slate-700">
            <li>1. Interest & CRM lead</li>
            <li>2. Discovery / assessment</li>
            <li>3. Online application & documents</li>
            <li>4. Interview & decision</li>
            <li>5. Offer, contracts & tuition</li>
            <li>6. Parent portal onboarding</li>
          </ol>
        </div>
      </section>

      <section className="mt-14 grid gap-4 sm:grid-cols-2">
        {CTA.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm"
          >
            <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{item.body}</p>
          </Link>
        ))}
      </section>
    </AdmissionsPublicShell>
  );
}
