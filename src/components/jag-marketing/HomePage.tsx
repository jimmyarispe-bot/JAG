import Link from "next/link";
import { JAG_INDUSTRIES } from "@/lib/jag-business/industries";
import { JAG_SUBSCRIPTION_PLANS } from "@/lib/jag-business/plans";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
        {title}
      </h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function HomePage() {
  return (
    <>
      <section className="border-b border-slate-200 bg-gradient-to-b from-slate-950 to-slate-900 text-white">
        <div className="mx-auto max-w-6xl px-6 py-28">
          <p className="text-4xl font-semibold tracking-tight sm:text-5xl">
            The JAG™
          </p>
          <p className="mt-3 text-lg text-slate-300">
            Organizational Intelligence Operating System
          </p>
          <p className="mt-6 max-w-xl text-base text-slate-200">
            Run your organization with intelligence.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/start"
              className="rounded-md bg-white px-5 py-2.5 text-sm font-medium text-slate-900 hover:bg-slate-100"
            >
              Start Your Pilot
            </Link>
            <Link
              href="/contact"
              className="rounded-md border border-slate-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
            >
              Schedule a Demo
            </Link>
          </div>
        </div>
      </section>

      <Section title="Why The JAG™">
        <p className="max-w-2xl text-slate-600">
          The JAG is the executive operating system that launches and manages
          industry products. One platform. Clear organizational models.
          Decisions grounded in evidence.
        </p>
      </Section>

      <Section title="Industries">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {JAG_INDUSTRIES.map((industry) => (
            <li
              key={industry.id}
              className="rounded-lg border border-slate-200 bg-white px-4 py-4"
            >
              <Link
                href={`/solutions/${industry.id}`}
                className="font-medium text-slate-900 hover:underline"
              >
                {industry.name}
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="How It Works">
        <ol className="grid gap-4 text-sm text-slate-700 sm:grid-cols-4">
          {[
            "Choose a plan",
            "Create your organization",
            "Provision your workspace",
            "Sign in to The JAG",
          ].map((step, index) => (
            <li
              key={step}
              className="rounded-lg border border-slate-200 bg-white px-4 py-4"
            >
              <span className="text-xs font-semibold text-slate-400">
                {index + 1}
              </span>
              <p className="mt-2 font-medium text-slate-900">{step}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Products">
        <p className="mb-4 max-w-2xl text-slate-600">
          Industry operating systems on The JAG platform. AcademyOS is available
          today; others are coming soon.
        </p>
        <Link
          href="/products"
          className="text-sm font-medium text-slate-900 underline"
        >
          View products
        </Link>
      </Section>

      <Section title="Executive Intelligence">
        <p className="max-w-2xl text-slate-600">
          Ask grounded questions across policies, work, decisions, and reports.
          Executive Intelligence screens ship in a later phase — the foundation
          is already part of the platform.
        </p>
      </Section>

      <Section title="Testimonials">
        <p className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-8 text-sm text-slate-500">
          Placeholder — customer stories coming soon.
        </p>
      </Section>

      <Section title="Pricing Preview">
        <ul className="grid gap-4 sm:grid-cols-3">
          {JAG_SUBSCRIPTION_PLANS.map((plan) => (
            <li
              key={plan.id}
              className="rounded-lg border border-slate-200 bg-white px-4 py-5"
            >
              <p className="font-semibold text-slate-900">{plan.name}</p>
              <p className="mt-1 text-sm text-slate-500">{plan.tagline}</p>
              <p className="mt-4 text-lg font-medium text-slate-900">
                {plan.priceLabel}
              </p>
            </li>
          ))}
        </ul>
        <Link
          href="/pricing"
          className="mt-6 inline-block text-sm font-medium text-slate-900 underline"
        >
          See pricing details
        </Link>
      </Section>
    </>
  );
}
