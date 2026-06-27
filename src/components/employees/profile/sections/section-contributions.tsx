import type { ReactNode } from "react";
import { ProfileCard, ProfileEmpty } from "@/components/platform/profile-workspace/ProfilePrimitives";
import type { ProfileSectionContributions } from "@/lib/platform/profile/sections/types";
import type { ProfileEnvelopeBase } from "@/lib/platform/profile/types";
import { isEmployeeProfileEnvelope } from "@/lib/employees/profile/types";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

function expiringCertCount(certifications: Record<string, unknown>[]): number {
  const in90 = Date.now() + 90 * 86400000;
  return certifications.filter((cert) => {
    const exp = cert.expiration_date as string | null;
    if (!exp) return false;
    return new Date(exp).getTime() <= in90;
  }).length;
}

export async function loadOverviewContributions(
  _supabase: AuthClient,
  envelope: ProfileEnvelopeBase,
  data: unknown
): Promise<ProfileSectionContributions | null> {
  if (!isEmployeeProfileEnvelope(envelope)) return null;
  const profile = (data as { profile?: { onboarding?: Record<string, unknown>[]; certifications?: Record<string, unknown>[] } })?.profile;
  if (!profile) return null;

  const pending = (profile.onboarding ?? []).filter((t) => t.status !== "completed");
  const expiring = expiringCertCount(profile.certifications ?? []);

  const alerts: ReactNode[] = [];
  if (pending.length > 0) {
    alerts.push(
      <div
        key="onboarding"
        className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
      >
        {pending.length} onboarding task(s) still open.
      </div>
    );
  }
  if (expiring > 0) {
    alerts.push(
      <div
        key="certs"
        className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
      >
        {expiring} certification(s) expiring within 90 days.
      </div>
    );
  }

  return {
    header: alerts.length ? { alerts: <>{alerts}</> } : undefined,
    context: {
      widgets: (
        <ProfileCard title="At a Glance">
          <ul className="space-y-1 text-sm text-slate-600">
            <li>{profile.certifications?.length ?? 0} certification(s)</li>
            <li>{pending.length} open onboarding task(s)</li>
          </ul>
        </ProfileCard>
      ),
    },
  };
}

export async function loadCertificationsContributions(
  _supabase: AuthClient,
  _envelope: ProfileEnvelopeBase,
  data: unknown
): Promise<ProfileSectionContributions | null> {
  const certifications = (data as { certifications?: Record<string, unknown>[] })?.certifications ?? [];
  const expiring = expiringCertCount(certifications);
  if (!expiring) return null;

  return {
    header: {
      alerts: (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {expiring} certification(s) expiring within 90 days.
        </div>
      ),
    },
    context: {
      quickActions: (
        <p className="text-sm text-slate-600">Review expiring credentials before compliance deadlines.</p>
      ),
    },
  };
}

export async function loadComplianceContributions(
  _supabase: AuthClient,
  _envelope: ProfileEnvelopeBase,
  data: unknown
): Promise<ProfileSectionContributions | null> {
  const center = data as {
    expiringCertifications?: Record<string, unknown>[];
    pendingOnboarding?: Record<string, unknown>[];
  } | null;
  if (!center) return null;

  const expiring = center.expiringCertifications?.length ?? 0;
  const pending = center.pendingOnboarding?.length ?? 0;
  if (!expiring && !pending) {
    return {
      context: {
        notifications: <ProfileEmpty>No compliance items require attention.</ProfileEmpty>,
      },
    };
  }

  return {
    workspaceAlerts: (
      <>
        {expiring > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {expiring} organization certification(s) expiring within 90 days.
          </div>
        )}
        {pending > 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            {pending} onboarding task(s) pending organization-wide.
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
  const notes = (data as unknown[] | null) ?? [];
  const pinned = notes.filter((n) => (n as { is_pinned?: boolean }).is_pinned).length;

  return {
    context: {
      widgets: (
        <ProfileCard title="Notes Summary">
          <p className="text-sm text-slate-600">
            {notes.length} note(s) on file{pinned > 0 ? ` · ${pinned} pinned` : ""}.
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
        <p className="text-sm text-slate-600">{events.length} recent activity event(s) loaded.</p>
      ),
    },
  };
}
