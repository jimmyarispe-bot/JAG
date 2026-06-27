import { requirePagePermission } from "@/lib/platform/identity/page-guard";

export default async function MissionControlLayout({ children }: { children: React.ReactNode }) {
  await requirePagePermission("mission_control.access");
  return children;
}
