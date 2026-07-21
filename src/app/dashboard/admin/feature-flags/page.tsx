import { redirect } from "next/navigation";
import { requireCatalogAccess } from "@/lib/platform/identity/page-guard";

/** Live feature flags live in Cloud Console — do not ship an unfinished admin shell. */
export default async function AdminFeatureFlagsPage() {
  await requireCatalogAccess("SYSTEM_ADMIN_ACCESS");
  redirect("/cloud/feature-flags");
}
