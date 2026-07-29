import Link from "next/link";
import type { ExecutiveDashboardCard } from "@/lib/executive-intelligence";

export function JagExecutiveCard({ card }: { readonly card: ExecutiveDashboardCard }) {
  const body = (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-slate-300">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {card.title}
      </p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{card.value}</p>
      {card.subtitle ? (
        <p className="mt-1 text-xs text-slate-500">{card.subtitle}</p>
      ) : null}
    </div>
  );

  if (card.href) {
    return (
      <Link href={card.href} className="block focus:outline-none focus:ring-2 focus:ring-slate-400">
        {body}
      </Link>
    );
  }
  return body;
}
