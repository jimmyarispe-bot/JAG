import { requirePagePermission } from "@/lib/platform/identity/page-guard";

export default async function AutomationLayout({ children }: { children: React.ReactNode }) {
  await requirePagePermission(["workflows.view", "workflows.manage", "mission_control.access"]);
  return children;
}
