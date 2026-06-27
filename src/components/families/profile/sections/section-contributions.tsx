import type { ReactNode } from "react";
import { ProfileCard, ProfileEmpty } from "@/components/platform/profile-workspace/ProfilePrimitives";
import type { ProfileSectionContributions } from "@/lib/platform/profile/sections/types";
import type { ProfileEnvelopeBase } from "@/lib/platform/profile/types";
import { isFamilyProfileEnvelope } from "@/lib/families/profile/types";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export async function loadOverviewContributions(
  _supabase: AuthClient,
  envelope: ProfileEnvelopeBase,
  data: unknown
): Promise<ProfileSectionContributions | null> {
  if (!isFamilyProfileEnvelope(envelope)) return null;
  const overview = data as { metrics?: Record<string, number> } | null;
  const metrics = overview?.metrics;
  if (!metrics) return null;

  const alerts: ReactNode[] = [];
  if (metrics.missingDocuments > 0) {
    alerts.push(
      <div
        key="docs"
        className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
      >
        {metrics.missingDocuments} missing or expired document(s) require attention.
      </div>
    );
  }
  if (metrics.alertCount > 0) {
    alerts.push(
      <div
        key="alerts"
        className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
      >
        {metrics.alertCount} household alert(s)
        {metrics.criticalAlerts > 0 ? ` · ${metrics.criticalAlerts} critical` : ""}.
      </div>
    );
  }

  return {
    header: alerts.length ? { alerts: <>{alerts}</> } : undefined,
    context: {
      widgets: (
        <ProfileCard title="Household Snapshot">
          <ul className="space-y-1 text-sm text-slate-600">
            <li>{metrics.studentCount} student(s)</li>
            <li>{metrics.guardianCount} guardian(s)</li>
            <li>{metrics.openAdmissions} open admission(s)</li>
          </ul>
        </ProfileCard>
      ),
    },
  };
}

export async function loadDocumentsContributions(
  _supabase: AuthClient,
  _envelope: ProfileEnvelopeBase,
  data: unknown
): Promise<ProfileSectionContributions | null> {
  const docs = data as {
    expiring?: unknown[];
    expired?: unknown[];
    missingChecklist?: unknown[];
  } | null;
  if (!docs) return null;
  const expiring = docs.expiring?.length ?? 0;
  const expired = docs.expired?.length ?? 0;
  const missing = docs.missingChecklist?.length ?? 0;
  if (!expiring && !expired && !missing) return null;

  return {
    workspaceAlerts: (
      <>
        {missing > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {missing} admissions checklist item(s) still incomplete.
          </div>
        )}
        {(expiring > 0 || expired > 0) && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {expired} expired and {expiring} expiring document(s) on file.
          </div>
        )}
      </>
    ),
  };
}

export async function loadNotesContributions(
  _supabase: AuthClient,
  _envelope: ProfileEnvelopeBase,
  data: unknown
): Promise<ProfileSectionContributions | null> {
  const notes = (data as { is_pinned?: boolean }[] | null) ?? [];
  const pinned = notes.filter((n) => n.is_pinned).length;
  return {
    context: {
      widgets: (
        <ProfileCard title="Notes Summary">
          <p className="text-sm text-slate-600">
            {notes.length} household note(s){pinned > 0 ? ` · ${pinned} pinned` : ""}.
          </p>
        </ProfileCard>
      ),
    },
  };
}

export async function loadActivityContributions(
  _supabase: AuthClient,
  _envelope: ProfileEnvelopeBase,
  data: unknown
): Promise<ProfileSectionContributions | null> {
  const events = (data as unknown[] | null) ?? [];
  return {
    context: {
      notifications: (
        <p className="text-sm text-slate-600">{events.length} activity event(s) in timeline.</p>
      ),
    },
  };
}

export async function loadCommunicationsContributions(
  _supabase: AuthClient,
  _envelope: ProfileEnvelopeBase,
  data: unknown
): Promise<ProfileSectionContributions | null> {
  const comms = data as { unreadCount?: number; conversations?: unknown[] } | null;
  if (!comms?.unreadCount) {
    return {
      context: {
        notifications: <ProfileEmpty>No open conversation threads.</ProfileEmpty>,
      },
    };
  }
  return {
    context: {
      notifications: (
        <p className="text-sm text-slate-600">
          {comms.unreadCount} open conversation thread(s) · {comms.conversations?.length ?? 0}{" "}
          recent.
        </p>
      ),
    },
  };
}

export async function loadTuitionContributions(
  _supabase: AuthClient,
  envelope: ProfileEnvelopeBase,
  data: unknown
): Promise<ProfileSectionContributions | null> {
  if (!isFamilyProfileEnvelope(envelope)) return null;
  const profile = data as { account?: { balance?: number } | null } | null;
  const balance = Number(profile?.account?.balance ?? 0);
  if (balance <= 0) return null;
  return {
    header: {
      alerts: (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Outstanding household balance: ${balance.toFixed(2)}
        </div>
      ),
    },
  };
}
