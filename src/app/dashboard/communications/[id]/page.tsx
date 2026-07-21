import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CommunicationLifecycleActions } from "@/components/communications/CommunicationLifecycleActions";
import { PageHeader } from "@/components/ui/PageHeader";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { sendCommunicationAction } from "@/lib/communications/actions";
import {
  canComposeCommunications,
  canViewCommunications,
  getCommunicationById,
} from "@/lib/communications";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CommunicationDetailPage({ params }: PageProps) {
  const identity = await getIdentityContext();
  if (!canViewCommunications(identity)) {
    redirect("/dashboard");
  }

  const { id } = await params;
  const row = await getCommunicationById(id);
  if (!row) notFound();

  const canCompose = canComposeCommunications(identity);
  const recipients = (row.platform_communication_recipients ?? []) as Array<{
    id: string;
    display_name: string | null;
    email: string | null;
    phone: string | null;
    delivery_status: string;
  }>;
  const attachments = (row.platform_communication_attachments ?? []) as Array<{
    id: string;
    file_name: string;
    file_url: string;
    version: number;
  }>;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <PageHeader
        title={row.subject || "(no subject)"}
        subtitle={`Audit ${row.audit_id} · ${row.type} · ${row.status}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {canCompose ? (
              <CommunicationLifecycleActions
                communicationId={row.id}
                status={row.status}
                subject={row.subject}
                auditId={row.audit_id}
                variant="header"
              />
            ) : null}
            <Link
              href="/dashboard/communications"
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Back
            </Link>
          </div>
        }
      />

      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 text-sm">
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase text-slate-400">Direction</dt>
            <dd className="capitalize">{row.direction}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-400">Sender</dt>
            <dd>{row.sender_display_name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-400">Created</dt>
            <dd>{new Date(row.created_at).toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-400">Scheduled</dt>
            <dd>
              {row.scheduled_for
                ? new Date(row.scheduled_for).toLocaleString()
                : "—"}
            </dd>
          </div>
        </dl>

        <div>
          <p className="text-xs uppercase text-slate-400">Body</p>
          <pre className="mt-1 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-slate-800">
            {row.body_text || "(empty)"}
          </pre>
        </div>

        <div>
          <p className="text-xs uppercase text-slate-400">Recipients</p>
          <ul className="mt-1 space-y-1">
            {recipients.length === 0 ? (
              <li className="text-slate-500">No recipients listed</li>
            ) : (
              recipients.map((r) => (
                <li key={r.id}>
                  {r.display_name || r.email || r.phone || "Recipient"}{" "}
                  <span className="text-slate-400">({r.delivery_status})</span>
                </li>
              ))
            )}
          </ul>
        </div>

        {attachments.length > 0 && (
          <div>
            <p className="text-xs uppercase text-slate-400">Attachments</p>
            <ul className="mt-1 space-y-1">
              {attachments.map((a) => (
                <li key={a.id}>
                  <a href={a.file_url} className="text-brand-600 hover:underline">
                    {a.file_name}
                  </a>{" "}
                  <span className="text-slate-400">v{a.version}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {canCompose && (
          <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            {(row.status === "draft" || row.status === "scheduled" || row.status === "queued") && (
              <form
                action={async () => {
                  "use server";
                  await sendCommunicationAction(row.id);
                }}
              >
                <button
                  type="submit"
                  className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white"
                >
                  Send now
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
