import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { getSessionUser } from "@/lib/auth/session";
import { isParentOnly, PARENT_HOME } from "@/lib/admissions/contract/parent-only";

/**
 * Parents see their child's contract and nothing else until Jimmy opens the
 * rest (18 October 2026). See lib/admissions/contract/parent-only.ts.
 */
export default async function ApplyPortalLayout({ children }: { children: ReactNode }) {
  const session = await getSessionUser();
  if (isParentOnly(session)) redirect(PARENT_HOME);
  return <>{children}</>;
}
