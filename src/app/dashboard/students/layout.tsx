import { requirePagePermission } from "@/lib/platform/identity/page-guard";

export default async function StudentsLayout({ children }: { children: React.ReactNode }) {
  await requirePagePermission(["students.view", "students.edit"]);
  return children;
}
