import { requirePagePermission } from "@/lib/platform/identity/page-guard";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  await requirePagePermission(["ai.teacher", "instruction.executive", "hr.view", "students.view"]);
  return children;
}
