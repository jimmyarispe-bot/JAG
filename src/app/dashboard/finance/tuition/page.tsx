import Link from "next/link";
import { listTuitionPriceGrid } from "@/lib/finance/tuition-catalog";
import { TuitionPriceGrid } from "@/components/finance/TuitionPriceGrid";

export const dynamic = "force-dynamic";

export const metadata = { title: "Tuition · The JAG™" };

export default async function TuitionPricingPage() {
  const result = await listTuitionPriceGrid();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link href="/dashboard/finance" className="text-sm text-slate-500 hover:text-slate-700">
        ‹ Back
      </Link>

      <h1 className="mt-2 text-2xl font-semibold text-slate-900">Tuition</h1>
      <p className="mt-1 text-slate-500">
        What each school charges. A blank price is not zero — it means nothing can be billed for
        that item yet.
      </p>

      <div className="mt-6">
        {"error" in result ? (
          <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900" role="alert">
            {result.error}
          </div>
        ) : (
          <TuitionPriceGrid groups={result.groups} />
        )}
      </div>
    </div>
  );
}
