import { AssigneeWorkPanel } from "@/components/founder/AssigneeWorkPanel";
import { PageHeader } from "@/components/ui/PageHeader";
import { DecisionService } from "@/lib/platform/decisions";
import { getIdentityContext } from "@/lib/platform/identity/context";
import {
  hasPermission,
  toAuthzSnapshot,
} from "@/lib/platform/identity/authorization-service";
import { NotificationService } from "@/lib/platform/notifications";
import { OrganizationService } from "@/lib/platform/organizations";
import { OperationalPersistence } from "@/lib/platform/persistence";
import { createAuthClient } from "@/lib/supabase/server-auth";
import Link from "next/link";

/**
 * Sprint 067 — Executive Director (and Founder) assignee view.
 * Same DecisionService queue, filtered by assignee.
 */
export default async function MyDecisionsPage() {
  const ctx = await getIdentityContext();
  if (!ctx) return null;

  const org = await OrganizationService.resolve({ userId: ctx.effectiveUserId });
  try {
    const supabase = await createAuthClient();
    await OperationalPersistence.hydrate(supabase);
  } catch {
    // Soft-degrade when persistence tables are unavailable.
  }

  const queue = DecisionService.getQueue(
    org.organization.id !== "platform" ? org.organization.id : null
  );

  const isFounder = hasPermission(toAuthzSnapshot(ctx), "JAG_ACCESS");
  const buckets = NotificationService.assigneeBuckets(
    queue.decisions,
    {
      userId: ctx.effectiveUserId,
      role: isFounder ? "founder" : "executive_director",
    },
    new Date().toISOString()
  );

  // Also include role-targeted notifications without userId for ED/Founder roles
  const roleRecipient = isFounder ? "role:founder" : "role:executive_director";
  const roleBuckets = NotificationService.assigneeBuckets(
    queue.decisions,
    { userId: null, role: isFounder ? "founder" : "executive_director" },
    new Date().toISOString()
  );

  const merged = {
    myDecisions: [...new Set([...buckets.myDecisions, ...roleBuckets.myDecisions])],
    dueToday: [...new Set([...buckets.dueToday, ...roleBuckets.dueToday])],
    overdue: [...new Set([...buckets.overdue, ...roleBuckets.overdue])],
    recentlyAssigned: [
      ...new Set([...buckets.recentlyAssigned, ...roleBuckets.recentlyAssigned]),
    ],
  };

  const organizationNames: Record<string, string> = {};
  if (org.organization.id !== "platform") {
    organizationNames[org.organization.id] = org.organization.name;
  }

  const inbox = NotificationService.listForRecipient(ctx.effectiveUserId);
  const roleInbox = NotificationService.listForRecipient(roleRecipient);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Decisions"
        subtitle="Assigned work · due today · overdue · recently assigned"
        actions={
          isFounder ? (
            <Link
              href="/founder"
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Founder Workspace
            </Link>
          ) : null
        }
      />

      <AssigneeWorkPanel
        decisions={queue.decisions}
        buckets={merged}
        organizationNames={organizationNames}
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">In-app notifications</h2>
        {[...inbox, ...roleInbox].length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No notifications.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {[...inbox, ...roleInbox].map((n) => (
              <li
                key={n.id}
                className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2 text-sm"
              >
                <p className="font-medium text-slate-900">{n.title}</p>
                <p className="text-xs text-slate-500">
                  {n.body} · {n.status} · {new Date(n.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
