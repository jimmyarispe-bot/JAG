import type { ReactNode } from "react";
import { requirePlatformAdministrationAccess } from "@/lib/platform/identity/page-guard";

/**
 * Sprint 009 — Platform Administration shell.
 * Every /dashboard/admin route passes through centralized authorization.
 */
export default async function PlatformAdministrationLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requirePlatformAdministrationAccess();
  return children;
}
