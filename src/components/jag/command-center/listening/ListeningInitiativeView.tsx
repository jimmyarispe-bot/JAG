"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { JagEmptyState, JagSection } from "@/components/jag/command-center";
import {
  archiveInitiativeAction,
  createInstrumentAction,
  updateInitiativeAction,
} from "@/lib/jag-command-center/listening/actions";
import { LISTENING_EMPTY_COPY } from "@/lib/platform/listening";
import { ListeningBreadcrumbs } from "./ListeningBreadcrumbs";
import { ListeningStatusPill } from "./ListeningStatusPill";

type Version = {
  id: string;
  version_no: number;
  status: string;
};

type Instrument = {
  id: string;
  title: string;
  description: string;
  versions: Version[];
};

export function ListeningInitiativeView({
  organizationId,
  canManage,
  initiative,
  instruments,
  campaigns,
}: {
  readonly organizationId: string;
  readonly canManage: boolean;
  readonly initiative: Record<string, unknown>;
  readonly instruments: Instrument[];
  readonly campaigns: readonly Record<string, unknown>[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const id = String(initiative.id);

  return (
    <div className="space-y-8">
      <div>
        <ListeningBreadcrumbs
          items={[
            { label: "Listening", href: "/jag/listening" },
            { label: String(initiative.title) },
          ]}
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-medium text-[var(--jag-text)]">
            {String(initiative.title)}
          </h1>
          <ListeningStatusPill label={String(initiative.status)} />
        </div>
        <p className="mt-2 max-w-2xl text-sm text-[var(--jag-muted)]">
          {String(initiative.purpose || "No description")}
        </p>
        <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-[var(--jag-muted)]">
          <div>
            <dt className="inline text-[var(--jag-muted-2)]">Owner </dt>
            <dd className="inline font-[family-name:var(--font-jag-mono)]">
              {initiative.created_by ? String(initiative.created_by) : "—"}
            </dd>
          </div>
          <div>
            <dt className="inline text-[var(--jag-muted-2)]">Created </dt>
            <dd className="inline">
              {initiative.created_at ? String(initiative.created_at) : "—"}
            </dd>
          </div>
          <div>
            <dt className="inline text-[var(--jag-muted-2)]">Archived </dt>
            <dd className="inline">
              {initiative.archived_at ? String(initiative.archived_at) : "—"}
            </dd>
          </div>
        </dl>
      </div>

      {canManage ? (
        <JagSection title="Edit initiative">
          <form
            className="grid gap-3 md:grid-cols-2"
            action={(fd) => {
              start(async () => {
                const result = await updateInitiativeAction(fd);
                if (!result.ok) window.alert(result.error);
                else router.refresh();
              });
            }}
          >
            <input type="hidden" name="organizationId" value={organizationId} />
            <input type="hidden" name="initiativeId" value={id} />
            <label className="text-sm">
              Name
              <input
                name="title"
                defaultValue={String(initiative.title)}
                required
                className="mt-1 w-full rounded-md border border-[var(--jag-border)] bg-transparent px-3 py-2"
              />
            </label>
            <label className="text-sm">
              Status
              <select
                name="status"
                defaultValue={String(initiative.status)}
                className="mt-1 w-full rounded-md border border-[var(--jag-border)] bg-transparent px-3 py-2"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
                <option value="archived">Archived</option>
              </select>
            </label>
            <label className="text-sm md:col-span-2">
              Description
              <textarea
                name="purpose"
                defaultValue={String(initiative.purpose ?? "")}
                rows={3}
                className="mt-1 w-full rounded-md border border-[var(--jag-border)] bg-transparent px-3 py-2"
              />
            </label>
            <div className="flex gap-2 md:col-span-2">
              <button
                type="submit"
                disabled={pending}
                className="rounded-md bg-[var(--jag-accent)] px-3 py-1.5 text-sm text-white"
              >
                Save
              </button>
              <button
                type="submit"
                disabled={pending}
                formAction={(fd) => {
                  start(async () => {
                    const result = await archiveInitiativeAction(fd);
                    if (!result.ok) window.alert(result.error);
                    else router.push("/jag/listening");
                  });
                }}
                className="rounded-md border border-[var(--jag-border)] px-3 py-1.5 text-sm"
              >
                Archive
              </button>
            </div>
          </form>
        </JagSection>
      ) : null}

      <JagSection
        title="Instruments"
        description="Questionnaires under this initiative."
        actions={
          canManage ? (
            <form
              action={(fd) => {
                start(async () => {
                  const result = await createInstrumentAction(fd);
                  if (!result.ok) {
                    window.alert(result.error);
                    return;
                  }
                  if (result.id) {
                    router.push(`/jag/listening/instruments/${result.id}`);
                  } else router.refresh();
                });
              }}
              className="flex items-end gap-2"
            >
              <input type="hidden" name="organizationId" value={organizationId} />
              <input type="hidden" name="initiativeId" value={id} />
              <label className="text-xs">
                New instrument
                <input
                  name="title"
                  required
                  placeholder="Instrument name"
                  className="mt-1 block rounded-md border border-[var(--jag-border)] bg-transparent px-2 py-1.5 text-sm"
                />
              </label>
              <button
                type="submit"
                className="rounded-md bg-[var(--jag-accent)] px-3 py-1.5 text-sm text-white"
              >
                Create
              </button>
            </form>
          ) : null
        }
      >
        {instruments.length === 0 ? (
          <JagEmptyState
            title={LISTENING_EMPTY_COPY.instruments.title}
            description={LISTENING_EMPTY_COPY.instruments.description}
            action={
              canManage ? (
                <span className="text-sm text-[var(--jag-accent)]">
                  {LISTENING_EMPTY_COPY.instruments.action} using the form above.
                </span>
              ) : null
            }
          />
        ) : (
          <ul className="divide-y divide-[var(--jag-border)] rounded-md border border-[var(--jag-border)]">
            {instruments.map((inst) => {
              const latest = inst.versions[0];
              return (
                <li key={inst.id} className="px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link
                      href={`/jag/listening/instruments/${inst.id}`}
                      className="text-sm font-medium text-[var(--jag-text)] hover:underline"
                    >
                      {inst.title}
                    </Link>
                    <ListeningStatusPill label={latest?.status ?? "draft"} />
                  </div>
                  {latest ? (
                    <Link
                      href={`/jag/listening/versions/${latest.id}`}
                      className="mt-1 inline-block text-xs text-[var(--jag-muted)] hover:text-[var(--jag-accent)]"
                    >
                      Version {latest.version_no} · open builder
                    </Link>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </JagSection>

      <JagSection title="Campaigns">
        {campaigns.length === 0 ? (
          <JagEmptyState
            title={LISTENING_EMPTY_COPY.campaigns.title}
            description={LISTENING_EMPTY_COPY.campaigns.description}
          />
        ) : (
          <ul className="divide-y divide-[var(--jag-border)] rounded-md border border-[var(--jag-border)]">
            {campaigns.map((c) => (
              <li key={String(c.id)}>
                <Link
                  href={`/jag/listening/campaigns/${c.id}`}
                  className="flex items-center justify-between px-4 py-3 text-sm hover:bg-[var(--jag-panel)]"
                >
                  <span>{String(c.title)}</span>
                  <span className="text-xs uppercase text-[var(--jag-muted)]">
                    {String(c.status)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </JagSection>
    </div>
  );
}
