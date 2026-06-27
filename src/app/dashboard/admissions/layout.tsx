import { requirePagePermission } from "@/lib/platform/identity/page-guard";
import "@/lib/admissions/registry/register";

export default async function AdmissionsLayout({ children }: { children: React.ReactNode }) {
  await requirePagePermission(["admissions.view", "admissions.manage", "admissions.accept"]);
  return children;
}
