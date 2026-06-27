import { requirePagePermission } from "@/lib/platform/identity/page-guard";

export default async function ProjectsLayout({ children }: { children: React.ReactNode }) {
  await requirePagePermission(["work.view", "work.manage"]);
  return children;
}
