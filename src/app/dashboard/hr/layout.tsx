import { requirePagePermission } from "@/lib/platform/identity/page-guard";

/**
 * A.1 — HR console is hr.view/manage only.
 * Employee self-service uses /dashboard/employee (separate gate).
 */
export default async function HrLayout({ children }: { children: React.ReactNode }) {
  await requirePagePermission(["hr.view", "hr.manage"]);
  return children;
}
