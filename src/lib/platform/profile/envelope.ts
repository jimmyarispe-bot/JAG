import { getModuleMarketplace } from "@/lib/configuration/modules";
import { getIdentityContext } from "@/lib/platform/identity/context";
import type { ProfileEnvelopeBase, ProfileKind } from "@/lib/platform/profile/types";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

/** Load enabled module keys for an organization from Configuration Studio. */
export async function loadEnabledModuleKeys(
  supabase: AuthClient,
  organizationId: string | null
): Promise<string[]> {
  if (!organizationId) {
    return [
      "admissions",
      "ssis",
      "hr",
      "scheduling",
      "finance",
      "scholarships",
      "compliance",
      "transportation",
      "decision_intelligence",
      "platform",
    ];
  }

  const marketplace = await getModuleMarketplace(supabase, organizationId);
  return marketplace
    .filter((m) => m.status === "installed" || m.status === "enabled")
    .map((m) => m.moduleKey);
}

/** Shared envelope fields derived from identity context. */
export async function buildEnvelopeContext(
  supabase: AuthClient,
  organizationId: string | null
): Promise<{ permissions: string[]; enabledModules: string[] }> {
  const identity = await getIdentityContext();
  const permissions = identity?.permissions ?? [];
  const enabledModules = await loadEnabledModuleKeys(supabase, organizationId);
  return { permissions, enabledModules };
}

export interface BuildProfileEnvelopeInput {
  profileKind: ProfileKind;
  entityType: string;
  entityId: string;
  organizationId: string | null;
  schoolId: string | null;
  campusId?: string | null;
  displayName: string;
  subtitle?: string | null;
  basePath: string;
  sectionParam?: string;
  defaultSection?: string;
}

/** Construct a base envelope — profile kinds extend with domain-specific fields. */
export async function buildProfileEnvelopeBase(
  supabase: AuthClient,
  input: BuildProfileEnvelopeInput
): Promise<ProfileEnvelopeBase> {
  const { permissions, enabledModules } = await buildEnvelopeContext(
    supabase,
    input.organizationId
  );

  return {
    profileKind: input.profileKind,
    entityType: input.entityType,
    entityId: input.entityId,
    organizationId: input.organizationId,
    schoolId: input.schoolId,
    campusId: input.campusId ?? null,
    displayName: input.displayName,
    subtitle: input.subtitle ?? null,
    permissions,
    enabledModules,
    basePath: input.basePath,
    sectionParam: input.sectionParam ?? "section",
    defaultSection: input.defaultSection ?? "overview",
  };
}
