import Link from "next/link";

interface AdminSectionPlaceholderProps {
  title: string;
  description: string;
  relatedHref?: string;
  relatedLabel?: string;
}

export function AdminSectionPlaceholder({
  title,
  description,
  relatedHref,
  relatedLabel,
}: AdminSectionPlaceholderProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
      {relatedHref && relatedLabel && (
        <Link
          href={relatedHref}
          className="mt-4 inline-flex text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          {relatedLabel} →
        </Link>
      )}
    </section>
  );
}
