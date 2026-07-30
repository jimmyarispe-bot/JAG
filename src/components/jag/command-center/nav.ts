/**
 * Executive Command Center navigation — discovered from Capability SDK.
 * Shell + capability manifests. No duplicated hard-coded intelligence routes.
 */

import {
  CapabilityLoader,
  ensureCapabilitiesRegistered,
} from "@/lib/platform/capabilities";

export type JagNavItem = {
  readonly id: string;
  readonly label: string;
  readonly href: string;
};

ensureCapabilitiesRegistered();

/** Discovered navigation — capabilities register once; workspace reads registry. */
export const JAG_COMMAND_NAV: readonly JagNavItem[] =
  CapabilityLoader.discoverNavigation().map((item) => ({
    id: item.id,
    label: item.label,
    href: item.href,
  }));

export function isJagNavActive(pathname: string, href: string): boolean {
  if (href === "/jag") {
    return pathname === "/jag" || pathname === "/jag/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
