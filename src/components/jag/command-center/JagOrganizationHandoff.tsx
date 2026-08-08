"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { switchJagOrganizationAction } from "@/lib/jag-command-center/organization-context-actions";

/**
 * One-shot cookie rebind when loaders resolved a customer org that the
 * signed session has not bound yet (post-onboarding handoff recovery).
 */
export function JagOrganizationHandoff({
  activeOrganizationId,
  sessionOrganizationId,
  needsRebind,
}: {
  readonly activeOrganizationId: string | null;
  readonly sessionOrganizationId: string | null;
  readonly needsRebind: boolean;
}) {
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    if (!needsRebind || !activeOrganizationId) return;
    ran.current = true;
    void switchJagOrganizationAction(activeOrganizationId).then((result) => {
      if (!result.ok) return;
      // Same-id rebind stamps recovered display identity onto the session cookie.
      if (sessionOrganizationId === activeOrganizationId) {
        router.refresh();
        return;
      }
      router.replace(result.href);
      router.refresh();
    });
  }, [
    activeOrganizationId,
    needsRebind,
    router,
    sessionOrganizationId,
  ]);

  return null;
}
