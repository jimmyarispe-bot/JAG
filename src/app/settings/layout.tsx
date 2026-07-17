import { requirePagePermission } from "@/lib/platform/identity/page-guard";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  await requirePagePermission([
    "configuration.admin",
    "configuration.manage",
    "certification.admin",
  ]);
  return children;
}
