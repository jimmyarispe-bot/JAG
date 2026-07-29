import { AdmissionsPublicShell } from "./AdmissionsPublicShell";

export function PublicContentPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <AdmissionsPublicShell title={title} subtitle={subtitle}>
      <div className="prose prose-slate max-w-none">{children}</div>
    </AdmissionsPublicShell>
  );
}
