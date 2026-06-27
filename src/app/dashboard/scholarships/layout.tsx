import { requirePagePermission } from "@/lib/platform/identity/page-guard";

export default async function ScholarshipsLayout({ children }: { children: React.ReactNode }) {
  await requirePagePermission(["scholarships.view", "scholarships.approve"]);
  return children;
}
