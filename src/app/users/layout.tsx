import { requirePagePermission } from "@/lib/platform/identity/page-guard";

export default async function UsersLayout({ children }: { children: React.ReactNode }) {
  await requirePagePermission([
    "configuration.admin",
    "configuration.manage",
    "certification.admin",
  ]);
  return children;
}
