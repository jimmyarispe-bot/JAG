export function PriorityBadge({ priority }: { priority: string }) {
  const cls =
    priority === "critical"
      ? "bg-rose-50 text-rose-700"
      : priority === "high"
        ? "bg-amber-50 text-amber-800"
        : priority === "normal"
          ? "bg-sky-50 text-sky-700"
          : "bg-slate-100 text-slate-600";
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${cls}`}>{priority}</span>;
}

export function ExplainBlock({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-slate-700">{value}</p>
    </div>
  );
}

export function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

export function NumberField({ name, label }: { name: string; label: string }) {
  return (
    <label className="block text-sm">
      <span className="text-slate-600">{label}</span>
      <input name={name} type="number" step="any" defaultValue={0} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
    </label>
  );
}
