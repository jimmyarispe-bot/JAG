import { JAG_INDUSTRIES } from "@/lib/jag-business/industries";

export default function ProductsPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Products</h1>
      <p className="mt-3 text-slate-600">
        Industry operating systems on The JAG™ platform.
      </p>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        {JAG_INDUSTRIES.map((item) => (
          <li
            key={item.id}
            className="rounded-xl border border-slate-200 bg-white p-6"
          >
            <p className="text-lg font-semibold text-slate-900">
              {item.productName}
            </p>
            <p className="mt-1 text-sm text-slate-500">{item.name}</p>
            <p className="mt-4 text-sm font-medium text-slate-800">
              {item.available ? "Available" : "Coming Soon"}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
