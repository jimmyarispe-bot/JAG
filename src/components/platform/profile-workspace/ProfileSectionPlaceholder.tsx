import type { ProfileSectionStatus } from "@/lib/platform/profile/types";

interface ProfileSectionPlaceholderProps {
  title: string;
  status: ProfileSectionStatus;
  description?: string;
}

export function ProfileSectionPlaceholder({
  title,
  status,
  description,
}: ProfileSectionPlaceholderProps) {
  const statusLabel =
    status === "live"
      ? "Live"
      : status === "partial"
        ? "Partial"
        : "Coming soon";

  const statusTone =
    status === "live"
      ? "bg-emerald-50 text-emerald-800"
      : status === "partial"
        ? "bg-amber-50 text-amber-800"
        : "bg-slate-100 text-slate-600";

  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-8 text-center">
      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusTone}`}>
        {statusLabel}
      </span>
      <h2 className="mt-4 text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
        {description ??
          (status === "placeholder"
            ? "This section is registered in the Platform Profile Registry. Full module content ships in the next phase."
            : "This section is partially integrated. Additional module content is coming soon.")}
      </p>
    </div>
  );
}
