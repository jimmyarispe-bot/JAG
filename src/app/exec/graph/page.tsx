import { redirect } from "next/navigation";

/**
 * Executive Graph shell was unfinished — route to live Mission Control
 * (organization graph / mission panels) instead of a placeholder page.
 */
export default function ExecutiveGraphPage() {
  redirect("/dashboard/mission-control");
}
