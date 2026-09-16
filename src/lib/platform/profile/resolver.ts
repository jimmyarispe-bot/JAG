import type { ProfileKind } from "@/lib/platform/profile/types";
import {
  getProfileKindDefinition,
  getProfileSection,
  getProfileSections,
  resolveSectionKey,
} from "@/lib/platform/profile/registry";
import {
  buildProfileNavigation,
  sectionsForViewTabs,
} from "@/lib/platform/profile/navigation";
import {
  canAccessProfileKind,
  resolveProfileSection,
  resolveSectionVisibility,
} from "@/lib/platform/profile/access";
import type { ProfileEnvelopeBase, ProfileResolveOptions } from "@/lib/platform/profile/types";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export interface ResolvedProfile {
  kind: ProfileKind;
  envelope: ProfileEnvelopeBase;
  navigation: ReturnType<typeof buildProfileNavigation>;
  viewTabs: ReturnType<typeof sectionsForViewTabs>;
  activeSection: string;
  activeSectionDef: ReturnType<typeof resolveProfileSection> | null;
}

/** Full profile resolution for a page route — entity-agnostic entry point. */
export async function resolveProfile(
  kind: ProfileKind,
  entityId: string,
  options: {
    section?: string;
    supabase: AuthClient;
    buildEnvelope: () => Promise<ProfileEnvelopeBase | null>;
  } & ProfileResolveOptions
): Promise<ResolvedProfile | null> {
  const kindDef = getProfileKindDefinition(kind);
  if (!kindDef) return null;

  const envelope = await options.buildEnvelope();
  if (!envelope) return null;

  if (
    !canAccessProfileKind(kind, kindDef.viewPermissions, envelope.permissions)
  ) {
    return null;
  }

  const navigation = buildProfileNavigation(envelope, options.section, options);
  const activeKey = navigation.activeSection;
  const sectionDef = getProfileSection(kind, activeKey);

  return {
    kind,
    envelope,
    navigation,
    viewTabs: sectionsForViewTabs(navigation),
    activeSection: activeKey,
    activeSectionDef: sectionDef
      ? resolveProfileSection(sectionDef, envelope, options)
      : null,
  };
}

/**
 * Load data for the active profile section (lazy per-section fetch).
 *
 * THE PERMISSION CHECK HERE IS NOT DUPLICATION.
 *
 * Until 16 September 2026 this function resolved a section and called its
 * loadData with no permission test of any kind. Visibility was decided in
 * navigation.ts, which decides what appears in the MENU - so a section could be
 * absent from the tabs and still load and return its data to anyone who typed
 * `?section=<key>` in the address bar.
 *
 * That was found while closing a hole in the Scholarships & Funding section,
 * which renders families' household incomes. Fixing only the section's
 * permissions would have taken the tab away and left the data reachable, which
 * is the worse kind of fix: it looks closed.
 *
 * Hiding a menu item is not access control. This is the gate.
 *
 * `options` is threaded through so a caller that has already resolved a
 * viewer's permissions can pass them rather than having them re-read.
 */
export async function loadActiveSectionData(
  kind: ProfileKind,
  envelope: ProfileEnvelopeBase,
  sectionKey: string,
  supabase: AuthClient,
  ctx: Record<string, unknown> = {},
  options?: ProfileResolveOptions
): Promise<unknown> {
  const canonical = resolveSectionKey(kind, sectionKey);
  const section = getProfileSection(kind, canonical);
  if (!section?.loadData) return null;

  const { visible } = resolveSectionVisibility(section, envelope, options);
  if (!visible) return null;

  return section.loadData(supabase, envelope, ctx);
}

/** List all section keys registered for a profile kind (including hidden). */
export function listRegisteredSectionKeys(kind: ProfileKind): string[] {
  return getProfileSections(kind).map((s) => s.key);
}
