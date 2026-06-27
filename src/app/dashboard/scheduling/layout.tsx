import { requirePagePermission } from "@/lib/platform/identity/page-guard";

export default async function SchedulingLayout({ children }: { children: React.ReactNode }) {
  await requirePagePermission(["hr.view", "scheduling.executive"]);
  return children;
}
