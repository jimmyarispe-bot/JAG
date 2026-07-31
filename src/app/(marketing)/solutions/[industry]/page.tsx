import Link from "next/link";
import { notFound } from "next/navigation";
import { getIndustry, JAG_INDUSTRIES } from "@/lib/jag-business/industries";

export function generateStaticParams() {
  return JAG_INDUSTRIES.map((item) => ({ industry: item.id }));
}

export default async function SolutionIndustryPage({
  params,
}: {
  params: Promise<{ industry: string }>;
}) {
  const { industry: industryId } = await params;
  const industry = getIndustry(industryId);
  if (!industry) notFound();

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm text-slate-500">
        <Link href="/solutions" className="hover:underline">
          Solutions
        </Link>
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        {industry.name}
      </h1>
      <p className="mt-4 text-slate-600">
        Placeholder for the {industry.name} solution page. Product:{" "}
        {industry.productName}
        {industry.available ? " (available)" : " (coming soon)"}.
      </p>
      <Link
        href="/start"
        className="mt-8 inline-flex rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
      >
        Start Your Pilot
      </Link>
    </div>
  );
}
