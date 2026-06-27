import { requirePagePermission } from "@/lib/platform/identity/page-guard";

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  await requirePagePermission([
    "configuration.admin",
    "configuration.manage",
    "certification.admin",
  ]);
  return children;
}
