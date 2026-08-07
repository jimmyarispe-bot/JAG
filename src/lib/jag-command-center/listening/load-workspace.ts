import {
  estimateCompletionMinutes,
  getListeningCampaign,
  getListeningInitiative,
  getListeningInstrument,
  getListeningInstrumentVersion,
  listListeningCampaigns,
  listListeningCampaignsForVersion,
  listListeningInitiatives,
  listListeningInstruments,
  listListeningInstrumentVersions,
  listListeningQuestions,
  parseListeningSections,
} from "@/lib/platform/listening";
import { resolveListeningAccess } from "./access";

export type ListeningLandingModel = {
  readonly organizationId: string;
  readonly organizationName: string;
  readonly canManage: boolean;
  readonly initiatives: readonly Record<string, unknown>[];
  readonly draftInstruments: readonly Record<string, unknown>[];
  readonly publishedCampaigns: readonly Record<string, unknown>[];
  readonly recentActivity: readonly {
    readonly kind: string;
    readonly title: string;
    readonly at: string;
    readonly href: string;
  }[];
};

export async function loadListeningLanding(
  preferredOrgId?: string | null
): Promise<
  | { ok: true; model: ListeningLandingModel }
  | { ok: false; error: string }
> {
  const access = await resolveListeningAccess(preferredOrgId);
  if (!access.ok) return access;

  const [initiatives, instruments, campaigns] = await Promise.all([
    listListeningInitiatives(access.supabase, access.organizationId),
    listListeningInstruments(access.supabase, access.organizationId),
    listListeningCampaigns(access.supabase, access.organizationId),
  ]);

  const activeInitiatives = initiatives.filter(
    (i) => i.status === "active" || i.status === "draft"
  );

  const draftInstruments: Record<string, unknown>[] = [];
  for (const inst of instruments) {
    const versions = await listListeningInstrumentVersions(
      access.supabase,
      access.organizationId,
      inst.id
    );
    const latest = versions[0];
    if (!latest || latest.status === "draft") {
      draftInstruments.push({
        ...inst,
        latest_version_status: latest?.status ?? "draft",
        latest_version_id: latest?.id ?? null,
      });
    }
  }

  const publishedCampaigns = campaigns.filter(
    (c) => c.status === "open" || c.status === "scheduled"
  );

  const recentActivity = [
    ...initiatives.slice(0, 5).map((i) => ({
      kind: "initiative",
      title: String(i.title),
      at: String(i.updated_at ?? i.created_at),
      href: `/jag/listening/initiatives/${i.id}`,
    })),
    ...campaigns.slice(0, 5).map((c) => ({
      kind: "campaign",
      title: String(c.title),
      at: String(c.created_at),
      href: `/jag/listening/campaigns/${c.id}`,
    })),
  ]
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .slice(0, 8);

  return {
    ok: true,
    model: {
      organizationId: access.organizationId,
      organizationName: access.organizationName,
      canManage: access.canManage,
      initiatives: activeInitiatives,
      draftInstruments,
      publishedCampaigns,
      recentActivity,
    },
  };
}

export async function loadInitiativeDetail(
  initiativeId: string,
  preferredOrgId?: string | null
) {
  const access = await resolveListeningAccess(preferredOrgId);
  if (!access.ok) return access;
  const initiative = await getListeningInitiative(
    access.supabase,
    access.organizationId,
    initiativeId
  );
  if (!initiative) return { ok: false as const, error: "Initiative not found." };
  const [instruments, campaigns] = await Promise.all([
    listListeningInstruments(
      access.supabase,
      access.organizationId,
      initiativeId
    ),
    listListeningCampaigns(
      access.supabase,
      access.organizationId,
      initiativeId
    ),
  ]);
  const instrumentRows = [];
  for (const inst of instruments) {
    const versions = await listListeningInstrumentVersions(
      access.supabase,
      access.organizationId,
      inst.id
    );
    instrumentRows.push({ ...inst, versions });
  }
  return {
    ok: true as const,
    organizationId: access.organizationId,
    canManage: access.canManage,
    initiative,
    instruments: instrumentRows,
    campaigns,
  };
}

export async function loadInstrumentDetail(
  instrumentId: string,
  preferredOrgId?: string | null
) {
  const access = await resolveListeningAccess(preferredOrgId);
  if (!access.ok) return access;
  const instrument = await getListeningInstrument(
    access.supabase,
    access.organizationId,
    instrumentId
  );
  if (!instrument) return { ok: false as const, error: "Instrument not found." };
  const versions = await listListeningInstrumentVersions(
    access.supabase,
    access.organizationId,
    instrumentId
  );
  return {
    ok: true as const,
    organizationId: access.organizationId,
    canManage: access.canManage,
    instrument,
    versions,
  };
}

export async function loadVersionDetail(
  versionId: string,
  preferredOrgId?: string | null
) {
  const access = await resolveListeningAccess(preferredOrgId);
  if (!access.ok) return access;
  const version = await getListeningInstrumentVersion(
    access.supabase,
    access.organizationId,
    versionId
  );
  if (!version) return { ok: false as const, error: "Version not found." };
  const [questions, instrument, campaigns] = await Promise.all([
    listListeningQuestions(
      access.supabase,
      access.organizationId,
      versionId
    ),
    getListeningInstrument(
      access.supabase,
      access.organizationId,
      version.instrument_id
    ),
    listListeningCampaignsForVersion(
      access.supabase,
      access.organizationId,
      versionId
    ),
  ]);
  const sections = parseListeningSections(version.metadata);
  return {
    ok: true as const,
    organizationId: access.organizationId,
    canManage: access.canManage,
    version,
    instrument,
    questions,
    sections,
    campaigns,
    estimatedMinutes: estimateCompletionMinutes(questions),
  };
}

export async function loadCampaignDetail(
  campaignId: string,
  preferredOrgId?: string | null
) {
  const access = await resolveListeningAccess(preferredOrgId);
  if (!access.ok) return access;
  const campaign = await getListeningCampaign(
    access.supabase,
    access.organizationId,
    campaignId
  );
  if (!campaign) return { ok: false as const, error: "Campaign not found." };
  return {
    ok: true as const,
    organizationId: access.organizationId,
    canManage: access.canManage,
    campaign,
    /** Respondent collection ships later — placeholder until then. */
    responseCount: 0,
  };
}
