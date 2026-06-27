import { redirect } from "next/navigation";

interface LegacyLeadDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ section?: string; tab?: string }>;
}

/** Legacy lead route — redirects to canonical admissions case workspace. */
export default async function LegacyLeadDetailPage({
  params,
  searchParams,
}: LegacyLeadDetailPageProps) {
  const { id } = await params;
  const { section, tab } = await searchParams;
  const query = new URLSearchParams();
  if (section) query.set("section", section);
  if (tab) query.set("tab", tab);
  const suffix = query.size ? `?${query.toString()}` : "";
  redirect(`/dashboard/admissions/cases/${id}${suffix}`);
}
