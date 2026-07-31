import Link from "next/link";
import { JAG_SUBSCRIPTION_PLANS } from "@/lib/jag-business/plans";

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Pricing</h1>
      <p className="mt-3 text-slate-600">
        Placeholder pricing for the pilot. Payments are not integrated yet.
      </p>
      <ul className="mt-10 grid gap-6 lg:grid-cols-3">
        {JAG_SUBSCRIPTION_PLANS.map((plan) => (
          <li
            key={plan.id}
            className="flex flex-col rounded-xl border border-slate-200 bg-white p-6"
          >
            <h2 className="text-xl font-semibold text-slate-900">{plan.name}</h2>
            <p className="mt-1 text-sm text-slate-500">{plan.tagline}</p>
            <p className="mt-6 text-2xl font-medium text-slate-900">
              {plan.priceLabel}
            </p>
            <ul className="mt-6 flex-1 space-y-2 text-sm text-slate-600">
              {plan.features.map((feature) => (
                <li key={feature}>• {feature}</li>
              ))}
            </ul>
            <Link
              href={`/start?plan=${plan.id}`}
              className="mt-8 inline-flex justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              Start Your Pilot
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
