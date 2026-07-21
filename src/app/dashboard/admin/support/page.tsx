import { redirect } from "next/navigation";
import { requirePagePermission } from "@/lib/platform/identity/page-guard";

/** Support access is managed from Users / Security — do not ship an unfinished shell. */
export default async function SupportAccessAdminPage() {
  await requirePagePermission(["impersonate.users", "security.view"]);
  redirect("/dashboard/admin/users");
}