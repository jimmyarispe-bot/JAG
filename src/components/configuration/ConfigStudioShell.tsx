import { ConfigStudioNav } from "@/components/configuration/ConfigStudioNav";

/** Server Component shell — keep forms out of the client nav module boundary. */
export function ConfigStudioShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
      </div>
      <ConfigStudioNav />
      {children}
    </div>
  );
}
