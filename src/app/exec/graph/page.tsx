import Link from "next/link";

export const metadata = {
  title: "Executive Graph · JAG",
  description: "Organizational executive graph for Founder command",
};

export default function ExecutiveGraphPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <p className="text-sm font-medium text-slate-500">Founder &amp; CEO</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
          Executive Graph
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Organizational intelligence graph for founder decision-making.
        </p>
      </header>
      <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">
          Explore connected executive signals across AcademyOS and JAG.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/exec"
            className="inline-flex rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Executive Home
          </Link>
          <Link
            href="/exec/brief"
            className="inline-flex rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Executive Brief
          </Link>
        </div>
      </section>
    </div>
  );
}
