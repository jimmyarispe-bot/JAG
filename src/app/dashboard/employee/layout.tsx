import { requirePagePermission } from "@/lib/platform/identity/page-guard";

export default async function EmployeePortalLayout({ children }: { children: React.ReactNode }) {
  await requirePagePermission(["employee.self_service", "hr.view"]);
  return children;
}
