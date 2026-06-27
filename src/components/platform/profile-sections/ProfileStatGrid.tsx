interface ProfileStatItem {
  label: string;
  value: string;
}

interface ProfileStatGridProps {
  items: ProfileStatItem[];
}

export function ProfileStatGrid({ items }: ProfileStatGridProps) {
  if (!items.length) return null;

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <article
          key={item.label}
          className="rounded-xl border border-slate-200 bg-white p-4"
        >
          <p className="text-sm text-slate-500">{item.label}</p>
          <p className="font-medium capitalize">{item.value}</p>
        </article>
      ))}
    </section>
  );
}
