"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { JagEmptyState, JagSection } from "@/components/jag/command-center";
import {
  createDraftVersionAction,
  deleteInstrumentAction,
  updateInstrumentAction,
} from "@/lib/jag-command-center/listening/actions";
import { LISTENING_EMPTY_COPY } from "@/lib/platform/listening";
import { ListeningBreadcrumbs } from "./ListeningBreadcrumbs";
import { ListeningStatusPill } from "./ListeningStatusPill";

export function ListeningInstrumentView({
  organizationId,
  canManage,
  instrument,
  versions,
}: {
  readonly organizationId: string;
  readonly canManage: boolean;
  readonly instrument: Record<string, unknown>;
  readonly versions: readonly Record<string, unknown>[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const id = String(instrument.id);
  const initiativeId = instrument.initiative_id
    ? String(instrument.initiative_id)
    : null;
  const onlyDrafts = versions.every((v) => v.status === "draft");

  return (
    <div className="space-y-8">
      <div>
        <ListeningBreadcrumbs
          items={[
            { label: "Listening", href: "/jag/listening" },
            ...(initiativeId
              ? [
                  {
                    label: "Initiative",
                    href: `/jag/listening/initiatives/${initiativeId}`,
                  },
                ]
              : []),
            { label: String(instrument.title) },
          ]}
        />
        <h1 className="mt-3 text-2xl font-medium text-[var(--jag-text)]">
          {String(instrument.title)}
        </h1>
        <p className="mt-2 text-sm text-[var(--jag-muted)]">
          {String(instrument.description || "No description")}
        </p>
      </div>

      {canManage ? (
        <JagSection title="Instrument metadata">
          <form
            className="space-y-3"
            action={(fd) => {
              start(async () => {
                const result = await updateInstrumentAction(fd);
                if (!result.ok) window.alert(result.error);
                else router.refresh();
              });
            }}
          >
            <input type="hidden" name="organizationId" value={organizationId} />
            <input type="hidden" name="instrumentId" value={id} />
            <label className="block text-sm">
              Name
              <input
                name="title"
                defaultValue={String(instrument.title)}
                required
                className="mt-1 w-full rounded-md border border-[var(--jag-border)] bg-transparent px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              Description
              <textarea
                name="description"
                defaultValue={String(instrument.description ?? "")}
                rows={3}
                className="mt-1 w-full rounded-md border border-[var(--jag-border)] bg-transparent px-3 py-2"
              />
            </label>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={pending}
                className="rounded-md bg-[var(--jag-accent)] px-3 py-1.5 text-sm text-white"
              >
                Save
              </button>
              {onlyDrafts ? (
                <button
                  type="submit"
                  disabled={pending}
                  formAction={(fd) => {
                    start(async () => {
                      const result = await deleteInstrumentAction(fd);
                      if (!result.ok) window.alert(result.error);
                      else if (initiativeId) {
                        router.push(`/jag/listening/initiatives/${initiativeId}`);
                      } else router.push("/jag/listening");
                    });
                  }}
                  className="rounded-md border border-[var(--jag-border)] px-3 py-1.5 text-sm"
                >
                  Delete draft instrument
                </button>
              ) : null}
            </div>
          </form>
        </JagSection>
      ) : null}

      <JagSection
        title="Versions"
        description="Published versions are immutable. Edit drafts only."
        actions={
          canManage ? (
            <form
              action={(fd) => {
                start(async () => {
                  const result = await createDraftVersionAction(fd);
                  if (!result.ok) {
                    window.alert(result.error);
                    return;
                  }
                  if (result.id) {
                    router.push(`/jag/listening/versions/${result.id}`);
                  } else router.refresh();
                });
              }}
            >
              <input type="hidden" name="organizationId" value={organizationId} />
              <input type="hidden" name="instrumentId" value={id} />
              <button
                type="submit"
                className="rounded-md bg-[var(--jag-accent)] px-3 py-1.5 text-sm text-white"
              >
                New draft version
              </button>
            </form>
          ) : null
        }
      >
        {versions.length === 0 ? (
          <JagEmptyState
            title={LISTENING_EMPTY_COPY.versions.title}
            description={LISTENING_EMPTY_COPY.versions.description}
            action={
              canManage ? (
                <span className="text-sm text-[var(--jag-accent)]">
                  {LISTENING_EMPTY_COPY.versions.action}
                </span>
              ) : null
            }
          />
        ) : (
          <ul className="divide-y divide-[var(--jag-border)] rounded-md border border-[var(--jag-border)]">
            {versions.map((v) => (
              <li key={String(v.id)}>
                <Link
                  href={`/jag/listening/versions/${v.id}`}
                  className="flex items-center justify-between px-4 py-3 text-sm hover:bg-[var(--jag-panel)]"
                >
                  <span>Version {String(v.version_no)}</span>
                  <ListeningStatusPill label={String(v.status)} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </JagSection>
    </div>
  );
}
