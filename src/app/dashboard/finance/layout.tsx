import { requirePagePermission } from "@/lib/platform/identity/page-guard";

export default async function FinanceLayout({ children }: { children: React.ReactNode }) {
  await requirePagePermission(["finance.view", "finance.billing", "portal.parent.access"]);
  return children;
}
