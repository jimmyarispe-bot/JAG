import type { ReactNode } from "react";
import type { ProfileEnvelopeBase, ProfileSectionDefinition } from "@/lib/platform/profile/types";
import type { ProfileWorkspaceContributions } from "@/lib/platform/profile/workspace/types";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

/** Props passed to every registered profile section component. */
export interface ProfileSectionViewProps<TData = unknown> {
  envelope: ProfileEnvelopeBase;
  data: TData;
  sectionKey: string;
}

export type ProfileSectionComponent = (
  props: ProfileSectionViewProps
) => ReactNode | Promise<ReactNode>;

export interface ProfileSectionContributions {
  header?: ProfileWorkspaceContributions["header"];
  workspaceAlerts?: ReactNode;
  context?: ProfileWorkspaceContributions["context"];
}

export interface ProfileSectionModuleDefinition extends ProfileSectionDefinition {
  /** Semantic version for independent section lifecycle */
  version: string;
  /** Stable component identifier: `{profileKind}:{sectionKey}` */
  componentId: string;
  /** Optional section-scoped contribution loader (widgets, alerts, quick actions) */
  loadContributions?: (
    supabase: AuthClient,
    envelope: ProfileEnvelopeBase,
    data: unknown
  ) => Promise<ProfileSectionContributions | null>;
}

export interface RegisterProfileSectionModuleInput {
  kind: import("@/lib/platform/profile/types").ProfileKind;
  definition: ProfileSectionModuleDefinition;
  /** Eager component reference (legacy — prefer componentLoader) */
  component?: ProfileSectionComponent;
  /** Lazy loader for code-split section UI */
  componentLoader?: () => Promise<ProfileSectionComponent>;
}
