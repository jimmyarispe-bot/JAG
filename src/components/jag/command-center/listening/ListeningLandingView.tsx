"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { JagEmptyState, JagSection } from "@/components/jag/command-center";
import type { ListeningLandingModel } from "@/lib/jag-command-center/listening/load-workspace";
import { createInitiativeAction } from "@/lib/jag-command-center/listening/actions";
import { LISTENING_EMPTY_COPY } from "@/lib/platform/listening";
import { ListeningStatusPill } from "./ListeningStatusPill";

function CardLink({
  href,
  title,
  meta,
  status,
}: {
  href: string;
  title: string;
  meta?: string;
  status?: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-md border border-[var(--jag-border)] bg-[var(--jag-panel)] px-4 py-3 transition hover:border-[var(--jag-accent)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[var(--jag-text)]">
            {title}
          </p>
          {meta ? (
            <p className="mt-1 text-xs text-[var(--jag-muted)]">{meta}</p>
          ) : null}
        </div>
        {status ? <ListeningStatusPill label={status} /> : null}
      </div>
    </Link>
  );
}

export function ListeningLandingView({
  model,
}: {
  readonly model: ListeningLandingModel;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const empty =
    model.initiatives.length === 0 &&
    model.draftInstruments.length === 0 &&
    model.publishedCampaigns.length === 0;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--jag-muted)]">
            Organizational Listening
          </p>
          <h1 className="mt-1 text-2xl font-medium tracking-tight text-[var(--jag-text)]">
            Listening
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--jag-muted)]">
            Author initiatives, instruments, and campaigns for{" "}
            {model.organizationName}. Capture durable organizational signal —
            no dashboards or AI in this workspace.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/jag/listening/intelligence"
            className="rounded-md border border-[var(--jag-border)] px-3 py-2 text-sm"
          >
            Intelligence workbench
          </Link>
          {model.canManage ? (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="rounded-md bg-[var(--jag-accent)] px-3 py-2 text-sm font-medium text-white"
            >
              New initiative
            </button>
          ) : null}
        </div>
      </header>

      {open && model.canManage ? (
        <form
          className="space-y-3 rounded-md border border-[var(--jag-border)] bg-[var(--jag-panel)] p-4"
          action={(fd) => {
            start(async () => {
              const result = await createInitiativeAction(fd);
              if (!result.ok) {
                window.alert(result.error);
                return;
              }
              setOpen(false);
              if (result.id) {
                router.push(`/jag/listening/initiatives/${result.id}`);
              } else {
                router.refresh();
              }
            });
          }}
        >
          <input type="hidden" name="organizationId" value={model.organizationId} />
          <label className="block text-sm text-[var(--jag-text)]">
            Name
            <input
              name="title"
              required
              className="mt-1 w-full rounded-md border border-[var(--jag-border)] bg-transparent px-3 py-2"
              placeholder="e.g. Q3 Culture Pulse"
            />
          </label>
          <label className="block text-sm text-[var(--jag-text)]">
            Description
            <textarea
              name="purpose"
              rows={3}
              className="mt-1 w-full rounded-md border border-[var(--jag-border)] bg-transparent px-3 py-2"
              placeholder="Why this listening effort exists"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-[var(--jag-accent)] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {pending ? "Creating…" : "Create initiative"}
          </button>
        </form>
      ) : null}

      {empty ? (
        <JagEmptyState
          title={LISTENING_EMPTY_COPY.initiatives.title}
          description={LISTENING_EMPTY_COPY.initiatives.description}
          action={
            model.canManage ? (
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="text-sm font-medium text-[var(--jag-accent)]"
                data-testid="listening-empty-create-initiative"
              >
                {LISTENING_EMPTY_COPY.initiatives.action}
              </button>
            ) : (
              <span className="text-sm text-[var(--jag-muted)]">
                LISTENING_MANAGE required to author.
              </span>
            )
          }
        />
      ) : (
        <>
          <JagSection
            title="Active initiatives"
            description="Organization-scoped listening programs."
          >
            {model.initiatives.length === 0 ? (
              <JagEmptyState
                title={LISTENING_EMPTY_COPY.initiatives.title}
                description={LISTENING_EMPTY_COPY.initiatives.description}
                action={
                  model.canManage ? (
                    <button
                      type="button"
                      onClick={() => setOpen(true)}
                      className="text-sm font-medium text-[var(--jag-accent)]"
                    >
                      {LISTENING_EMPTY_COPY.initiatives.action}
                    </button>
                  ) : null
                }
              />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {model.initiatives.map((i) => (
                  <CardLink
                    key={String(i.id)}
                    href={`/jag/listening/initiatives/${i.id}`}
                    title={String(i.title)}
                    meta={String(i.purpose || "No description")}
                    status={String(i.status)}
                  />
                ))}
              </div>
            )}
          </JagSection>

          <JagSection title="Draft instruments" description="Work in progress.">
            {model.draftInstruments.length === 0 ? (
              <JagEmptyState
                title={LISTENING_EMPTY_COPY.instruments.title}
                description={LISTENING_EMPTY_COPY.instruments.description}
              />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {model.draftInstruments.map((i) => (
                  <CardLink
                    key={String(i.id)}
                    href={`/jag/listening/instruments/${i.id}`}
                    title={String(i.title)}
                    meta="Draft"
                    status="draft"
                  />
                ))}
              </div>
            )}
          </JagSection>

          <JagSection
            title="Published campaigns"
            description="Open or scheduled collection windows."
          >
            {model.publishedCampaigns.length === 0 ? (
              <JagEmptyState
                title={LISTENING_EMPTY_COPY.campaigns.title}
                description={LISTENING_EMPTY_COPY.campaigns.description}
              />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {model.publishedCampaigns.map((c) => (
                  <CardLink
                    key={String(c.id)}
                    href={`/jag/listening/campaigns/${c.id}`}
                    title={String(c.title)}
                    meta={String(c.privacy_mode)}
                    status={String(c.status)}
                  />
                ))}
              </div>
            )}
          </JagSection>

          <JagSection title="Recent activity">
            {model.recentActivity.length === 0 ? (
              <p className="text-sm text-[var(--jag-muted)]">No recent activity.</p>
            ) : (
              <ul className="divide-y divide-[var(--jag-border)] rounded-md border border-[var(--jag-border)]">
                {model.recentActivity.map((a) => (
                  <li key={`${a.kind}-${a.href}-${a.at}`}>
                    <Link
                      href={a.href}
                      className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-[var(--jag-panel)]"
                    >
                      <span className="text-[var(--jag-text)]">{a.title}</span>
                      <span className="text-xs uppercase tracking-[0.08em] text-[var(--jag-muted)]">
                        {a.kind}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </JagSection>
        </>
      )}
    </div>
  );
}
