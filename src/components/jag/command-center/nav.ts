/**
 * Executive Command Center navigation — composed from Capability SDK.
 * Prefer composeWorkspaceNavigation(context) for platform vs customer mode.
 */

import {
  composeWorkspaceNavigation,
  type JagCommandNavItem,
  type WorkspaceNavContext,
} from "@/lib/jag-command-center/navigation/compose-workspace-nav";
import {
  CapabilityLoader,
  ensureCapabilitiesRegistered,
} from "@/lib/platform/capabilities";

export type JagNavItem = JagCommandNavItem;

ensureCapabilitiesRegistered();

/**
 * @deprecated Module-level full nav — platform/admin default only.
 * Prefer getJagCommandNav(context) so customer orgs do not inherit admin chrome.
 */
export const JAG_COMMAND_NAV: readonly JagNavItem[] =
  CapabilityLoader.discoverNavigation().map((item) => ({
    id: item.id,
    label: item.label,
    href: item.href,
    group: item.group,
  }));

export function getJagCommandNav(
  context: WorkspaceNavContext
): readonly JagNavItem[] {
  return composeWorkspaceNavigation(context);
}

export function isJagNavActive(pathname: string, href: string): boolean {
  if (href === "/jag") {
    return pathname === "/jag" || pathname === "/jag/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
