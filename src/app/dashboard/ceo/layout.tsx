import { requirePagePermission } from "@/lib/platform/identity/page-guard";

export default async function ExecutiveHomeLayout({ children }: { children: React.ReactNode }) {
  await requirePagePermission([
    "executive.dashboard",
    "executive.intelligence",
    "mission_control.access",
    "global.reporting",
  ]);
  return children;
}
