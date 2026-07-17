import { requirePagePermission } from "@/lib/platform/identity/page-guard";

/** Shared auth gate for Organization Platform admin surfaces. */
export default async function OrgPlatformAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePagePermission([
    "configuration.admin",
    "configuration.manage",
    "certification.admin",
  ]);
  return children;
}
