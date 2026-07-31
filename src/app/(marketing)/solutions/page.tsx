import Link from "next/link";
import { JAG_INDUSTRIES } from "@/lib/jag-business/industries";

export default function SolutionsPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Solutions</h1>
      <p className="mt-3 text-slate-600">
        The JAG™ serves organizations across industries.
      </p>
      <ul className="mt-10 grid gap-3 sm:grid-cols-2">
        {JAG_INDUSTRIES.map((item) => (
          <li key={item.id}>
            <Link
              href={`/solutions/${item.id}`}
              className="block rounded-lg border border-slate-200 bg-white px-5 py-4 font-medium text-slate-900 hover:bg-slate-50"
            >
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
