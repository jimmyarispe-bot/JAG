import { requirePagePermission } from "@/lib/platform/identity/page-guard";

export default async function HrLayout({ children }: { children: React.ReactNode }) {
  await requirePagePermission(["hr.view", "hr.manage", "employee.self_service"]);
  return children;
}
