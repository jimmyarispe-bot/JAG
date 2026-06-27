import { redirect } from "next/navigation";
import { buildFamilyProfileSectionHref } from "@/lib/families/profile/href";

interface FamilyFinancePageProps {
  params: Promise<{ id: string }>;
}

/** Legacy finance route — redirects to canonical family profile tuition section. */
export default async function FamilyFinancePage({ params }: FamilyFinancePageProps) {
  const { id } = await params;
  redirect(buildFamilyProfileSectionHref(id, "tuition"));
}
