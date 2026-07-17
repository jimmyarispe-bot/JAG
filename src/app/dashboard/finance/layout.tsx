import { requireFinanceAccess } from "@/lib/platform/identity/page-guard";

export default async function FinanceLayout({ children }: { children: React.ReactNode }) {
  // Sprint 008 — Financial Security (FINANCE_ACCESS via permission engine).
  await requireFinanceAccess();
  return children;
}
