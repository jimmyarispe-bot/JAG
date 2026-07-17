import type { ReactNode } from "react";
import { requireJagAccess } from "@/lib/platform/identity/page-guard";

export const metadata = {
  title: "JAG Executive Workspace",
  description: "Executive morning brief, organizational intelligence, and JAG conversation workspace",
};

export default async function JagLayout({ children }: { children: ReactNode }) {
  // Sprint 007 — Founder Protection (JAG_ACCESS via permission engine).
  await requireJagAccess();
  return <div className="min-h-full">{children}</div>;
}
