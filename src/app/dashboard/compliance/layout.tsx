import { requirePagePermission } from "@/lib/platform/identity/page-guard";

export default async function ComplianceLayout({ children }: { children: React.ReactNode }) {
  await requirePagePermission(["compliance.view", "compliance.manage"]);
  return children;
}
