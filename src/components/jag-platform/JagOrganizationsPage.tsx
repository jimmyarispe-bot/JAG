import Link from "next/link";
import type { JagOrganizationCard } from "@/lib/jag-platform/organizations";

export function JagOrganizationsPage({
  organizations,
}: {
  readonly organizations: readonly JagOrganizationCard[];
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Organizations</h2>
        <p className="mt-1 text-sm text-slate-600">
          Launch installed products for each organization.
        </p>
      </div>

      <ul className="space-y-4">
        {organizations.map((org) => (
          <li
            key={org.id}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h3 className="text-xl font-semibold text-slate-900">{org.name}</h3>
            <p className="mt-1 text-sm text-slate-600">
              Health: {org.health} · Status: {org.status}
            </p>

            <div className="mt-5">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Products
              </h4>
              <ul className="mt-3 space-y-3">
                {org.products.map((product) => (
                  <li
                    key={product.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {product.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        Status: {product.status}
                      </p>
                    </div>
                    {product.status === "active" ? (
                      <Link
                        href={product.launchPath}
                        className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                      >
                        Launch →
                      </Link>
                    ) : (
                      <span className="text-xs font-medium text-slate-500">
                        Coming Soon
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
