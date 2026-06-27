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

/** Load data for the active profile section (lazy per-section fetch). */
export async function loadActiveSectionData(
  kind: ProfileKind,
  envelope: ProfileEnvelopeBase,
  sectionKey: string,
  supabase: AuthClient,
  ctx: Record<string, unknown> = {}
): Promise<unknown> {
  const canonical = resolveSectionKey(kind, sectionKey);
  const section = getProfileSection(kind, canonical);
  if (!section?.loadData) return null;
  return section.loadData(supabase, envelope, ctx);
}

/** List all section keys registered for a profile kind (including hidden). */
export function listRegisteredSectionKeys(kind: ProfileKind): string[] {
  return getProfileSections(kind).map((s) => s.key);
}
