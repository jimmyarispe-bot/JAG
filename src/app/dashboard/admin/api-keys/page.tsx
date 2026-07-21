import { redirect } from "next/navigation";
import { requireCatalogAccess } from "@/lib/platform/identity/page-guard";

/** Live API keys live in the integration developer portal. */
export default async function ApiKeysAdminPage() {
  await requireCatalogAccess("SYSTEM_ADMIN_ACCESS");
  redirect("/dashboard/integrations/developer");
}
