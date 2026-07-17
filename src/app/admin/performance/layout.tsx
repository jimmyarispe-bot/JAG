import { requirePagePermission } from "@/lib/platform/identity/page-guard";

export default async function AdminPerformanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePagePermission([
    "operations.view",
    "configuration.admin",
    "configuration.manage",
  ]);
  return children;
}
