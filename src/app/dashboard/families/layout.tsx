import { requirePagePermission } from "@/lib/platform/identity/page-guard";

export default async function FamiliesLayout({ children }: { children: React.ReactNode }) {
  await requirePagePermission([
    "students.view",
    "students.edit",
    "families.manage",
    "portal.parent.access",
  ]);
  return children;
}
