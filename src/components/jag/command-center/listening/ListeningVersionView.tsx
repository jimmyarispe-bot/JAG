"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { JagEmptyState, JagSection } from "@/components/jag/command-center";
import {
  addOptionAction,
  addQuestionAction,
  createCampaignAction,
  createSectionAction,
  deleteOptionAction,
  deleteQuestionAction,
  deleteSectionAction,
  duplicateQuestionAction,
  moveSectionAction,
  publishVersionAction,
  renameSectionAction,
  reorderQuestionsAction,
  retireVersionAction,
  updateOptionAction,
  updateQuestionAction,
} from "@/lib/jag-command-center/listening/actions";
import {
  LISTENING_EMPTY_COPY,
  LISTENING_V1_QUESTION_TYPES,
  moveIdInOrder,
  parseQuestionConfig,
  type ListeningSection,
} from "@/lib/platform/listening";
import { ListeningBanner } from "./ListeningBanner";
import { ListeningBreadcrumbs } from "./ListeningBreadcrumbs";
import { ListeningPublishDialog } from "./ListeningPublishDialog";
import { ListeningStatusPill } from "./ListeningStatusPill";

type Option = {
  id: string;
  label: string;
  option_key: string;
  value_numeric?: number | null;
};

type Question = {
  id: string;
  prompt: string;
  help_text: string;
  required: boolean;
  question_type: string;
  display_order: number;
  config?: Record<string, unknown> | null;
  options: Option[];
};

const CHOICE_TYPES = new Set(["single_choice", "multi_choice", "likert"]);

export function ListeningVersionView({
  organizationId,
  canManage,
  version,
  instrument,
  questions: initialQuestions,
  sections: initialSections,
  campaigns,
  estimatedMinutes,
  justPublished = false,
}: {
  readonly organizationId: string;
  readonly canManage: boolean;
  readonly version: Record<string, unknown>;
  readonly instrument: Record<string, unknown> | null;
  readonly questions: Question[];
  readonly sections: readonly ListeningSection[];
  readonly campaigns: readonly Record<string, unknown>[];
  readonly estimatedMinutes: number;
  readonly justPublished?: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [publishOpen, setPublishOpen] = useState(false);
  const [showPublished, setShowPublished] = useState(justPublished);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [optimisticOrder, setOptimisticOrder] = useState<string[] | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const versionId = String(version.id);
  const isDraft = version.status === "draft";
  const isPublished = version.status === "published";
  const locked = !isDraft;

  const ordered = useMemo(() => {
    const base = [...initialQuestions].sort(
      (a, b) => a.display_order - b.display_order
    );
    if (!optimisticOrder) return base;
    const byId = new Map(base.map((q) => [q.id, q]));
    return optimisticOrder
      .map((id) => byId.get(id))
      .filter((q): q is Question => Boolean(q));
  }, [initialQuestions, optimisticOrder]);

  const questionNumbers = useMemo(() => {
    const map = new Map<string, number>();
    ordered.forEach((q, i) => map.set(q.id, i + 1));
    return map;
  }, [ordered]);

  function run(action: (fd: FormData) => Promise<{ ok: boolean; error?: string }>, fd: FormData) {
    start(async () => {
      setLocalError(null);
      const result = await action(fd);
      if (!result.ok) {
        setLocalError(result.error ?? "Action failed.");
        setOptimisticOrder(null);
        return;
      }
      setOptimisticOrder(null);
      router.refresh();
    });
  }

  function moveQuestion(id: string, direction: "up" | "down") {
    const ids = ordered.map((q) => q.id);
    const next = moveIdInOrder(ids, id, direction);
    if (next.join() === ids.join()) return;
    setOptimisticOrder(next);
    const fd = new FormData();
    fd.set("organizationId", organizationId);
    fd.set("versionId", versionId);
    fd.set("orderedIds", next.join(","));
    run(reorderQuestionsAction, fd);
  }

  return (
    <div className="space-y-8">
      <div>
        <ListeningBreadcrumbs
          items={[
            { label: "Listening", href: "/jag/listening" },
            ...(instrument?.initiative_id
              ? [
                  {
                    label: "Initiative",
                    href: `/jag/listening/initiatives/${String(instrument.initiative_id)}`,
                  },
                ]
              : []),
            ...(instrument
              ? [
                  {
                    label: String(instrument.title),
                    href: `/jag/listening/instruments/${String(instrument.id)}`,
                  },
                ]
              : []),
            { label: `Version ${String(version.version_no)}` },
          ]}
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-medium text-[var(--jag-text)]">
            Version {String(version.version_no)}
          </h1>
          <ListeningStatusPill label={String(version.status)} />
        </div>
        <p className="mt-2 text-sm text-[var(--jag-muted)]">
          {locked
            ? "Published versions are locked. Preview anytime; create a new draft to edit."
            : "Design questions and sections, preview the survey, then publish to lock this version."}
        </p>
      </div>

      {showPublished ? (
        <ListeningBanner tone="success" onDismiss={() => setShowPublished(false)}>
          Version published. It is now immutable. You can create a campaign below.
        </ListeningBanner>
      ) : null}
      {localError ? (
        <ListeningBanner tone="info" onDismiss={() => setLocalError(null)}>
          {localError}
        </ListeningBanner>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/jag/listening/versions/${versionId}/preview`}
          className="rounded-md border border-[var(--jag-border)] px-3 py-1.5 text-sm"
          data-testid="listening-preview-link"
        >
          Preview draft
        </Link>
        {canManage && isDraft ? (
          <button
            type="button"
            disabled={pending || ordered.length === 0}
            onClick={() => setPublishOpen(true)}
            className="rounded-md bg-[var(--jag-accent)] px-3 py-1.5 text-sm text-white disabled:opacity-50"
          >
            Publish version
          </button>
        ) : null}
        {canManage && isPublished ? (
          <form
            action={(fd) => {
              run(retireVersionAction, fd);
            }}
          >
            <input type="hidden" name="organizationId" value={organizationId} />
            <input type="hidden" name="versionId" value={versionId} />
            <button
              type="submit"
              className="rounded-md border border-[var(--jag-border)] px-3 py-1.5 text-sm"
            >
              Retire version
            </button>
          </form>
        ) : null}
      </div>

      <ListeningPublishDialog
        open={publishOpen}
        pending={pending}
        summary={{
          questionCount: ordered.length,
          sectionCount: initialSections.length,
          estimatedMinutes,
          campaigns: campaigns.map((c) => ({
            id: String(c.id),
            title: String(c.title),
            status: String(c.status),
          })),
        }}
        onCancel={() => setPublishOpen(false)}
        onConfirm={() => {
          const fd = new FormData();
          fd.set("organizationId", organizationId);
          fd.set("versionId", versionId);
          start(async () => {
            const result = await publishVersionAction(fd);
            if (!result.ok) {
              setLocalError(result.error);
              return;
            }
            setPublishOpen(false);
            setShowPublished(true);
            router.replace(
              `/jag/listening/versions/${versionId}?published=1`
            );
            router.refresh();
          });
        }}
      />

      {canManage && isDraft ? (
        <JagSection
          title="Sections"
          description="Group questions. Stored in version metadata — no schema change."
        >
          <form
            className="mb-4 flex flex-wrap items-end gap-2"
            action={(fd) => run(createSectionAction, fd)}
          >
            <input type="hidden" name="organizationId" value={organizationId} />
            <input type="hidden" name="versionId" value={versionId} />
            <label className="text-xs">
              Title
              <input
                name="title"
                required
                placeholder="e.g. Workload"
                className="mt-1 block rounded-md border border-[var(--jag-border)] bg-transparent px-2 py-1.5 text-sm"
              />
            </label>
            <label className="text-xs">
              Description
              <input
                name="description"
                placeholder="Optional"
                className="mt-1 block w-56 rounded-md border border-[var(--jag-border)] bg-transparent px-2 py-1.5 text-sm"
              />
            </label>
            <button
              type="submit"
              className="rounded-md bg-[var(--jag-accent)] px-3 py-1.5 text-sm text-white"
            >
              Create section
            </button>
          </form>

          {initialSections.length === 0 ? (
            <p className="text-sm text-[var(--jag-muted)]">
              No sections yet. Questions appear in a single list until you add
              sections.
            </p>
          ) : (
            <ul className="space-y-3">
              {initialSections.map((section) => {
                const isCollapsed = collapsed[section.id];
                const count = ordered.filter(
                  (q) => parseQuestionConfig(q.config).sectionId === section.id
                ).length;
                return (
                  <li
                    key={section.id}
                    className="rounded-md border border-[var(--jag-border)] p-3"
                    data-testid="listening-section"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        className="text-left text-sm font-medium text-[var(--jag-text)]"
                        onClick={() =>
                          setCollapsed((c) => ({
                            ...c,
                            [section.id]: !c[section.id],
                          }))
                        }
                      >
                        {isCollapsed ? "▸" : "▾"} {section.title}{" "}
                        <span className="text-xs font-normal text-[var(--jag-muted)]">
                          ({count})
                        </span>
                      </button>
                      <div className="flex gap-2 text-xs">
                        <form action={(fd) => run(moveSectionAction, fd)}>
                          <input
                            type="hidden"
                            name="organizationId"
                            value={organizationId}
                          />
                          <input type="hidden" name="versionId" value={versionId} />
                          <input type="hidden" name="sectionId" value={section.id} />
                          <input type="hidden" name="direction" value="up" />
                          <button type="submit">Up</button>
                        </form>
                        <form action={(fd) => run(moveSectionAction, fd)}>
                          <input
                            type="hidden"
                            name="organizationId"
                            value={organizationId}
                          />
                          <input type="hidden" name="versionId" value={versionId} />
                          <input type="hidden" name="sectionId" value={section.id} />
                          <input type="hidden" name="direction" value="down" />
                          <button type="submit">Down</button>
                        </form>
                        <form action={(fd) => run(deleteSectionAction, fd)}>
                          <input
                            type="hidden"
                            name="organizationId"
                            value={organizationId}
                          />
                          <input type="hidden" name="versionId" value={versionId} />
                          <input type="hidden" name="sectionId" value={section.id} />
                          <button type="submit" className="text-red-400">
                            Delete
                          </button>
                        </form>
                      </div>
                    </div>
                    {!isCollapsed ? (
                      <form
                        className="mt-3 grid gap-2 md:grid-cols-2"
                        action={(fd) => run(renameSectionAction, fd)}
                      >
                        <input
                          type="hidden"
                          name="organizationId"
                          value={organizationId}
                        />
                        <input type="hidden" name="versionId" value={versionId} />
                        <input type="hidden" name="sectionId" value={section.id} />
                        <label className="text-xs">
                          Rename
                          <input
                            name="title"
                            defaultValue={section.title}
                            className="mt-1 w-full rounded-md border border-[var(--jag-border)] bg-transparent px-2 py-1.5"
                          />
                        </label>
                        <label className="text-xs">
                          Description
                          <input
                            name="description"
                            defaultValue={section.description}
                            className="mt-1 w-full rounded-md border border-[var(--jag-border)] bg-transparent px-2 py-1.5"
                          />
                        </label>
                        <button
                          type="submit"
                          className="justify-self-start text-xs text-[var(--jag-accent)]"
                        >
                          Save section
                        </button>
                      </form>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </JagSection>
      ) : null}

      <JagSection title="Questions" description="No branching in Slice 2.2.">
        {ordered.length === 0 ? (
          <JagEmptyState
            title={LISTENING_EMPTY_COPY.questions.title}
            description={LISTENING_EMPTY_COPY.questions.description}
            action={
              canManage && isDraft ? (
                <span className="text-sm text-[var(--jag-accent)]">
                  {LISTENING_EMPTY_COPY.questions.action} using the form below.
                </span>
              ) : null
            }
          />
        ) : (
          <ol className="space-y-3">
            {ordered.map((q, index) => {
              const cfg = parseQuestionConfig(q.config);
              return (
                <li
                  key={q.id}
                  className="rounded-md border border-[var(--jag-border)] bg-[var(--jag-panel)] p-4"
                  data-testid="listening-question-card"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-[var(--jag-text)]">
                        {questionNumbers.get(q.id)}. {q.prompt}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.08em] text-[var(--jag-muted)]">
                        {q.question_type}
                        {q.required ? " · required" : " · optional"}
                        {cfg.sectionId
                          ? ` · ${initialSections.find((s) => s.id === cfg.sectionId)?.title ?? "section"}`
                          : ""}
                      </p>
                    </div>
                    {canManage && isDraft ? (
                      <div className="flex flex-wrap gap-2 text-xs">
                        <button type="button" onClick={() => moveQuestion(q.id, "up")}>
                          Up
                        </button>
                        <button
                          type="button"
                          onClick={() => moveQuestion(q.id, "down")}
                        >
                          Down
                        </button>
                        <form action={(fd) => run(duplicateQuestionAction, fd)}>
                          <input
                            type="hidden"
                            name="organizationId"
                            value={organizationId}
                          />
                          <input type="hidden" name="versionId" value={versionId} />
                          <input type="hidden" name="questionId" value={q.id} />
                          <button type="submit">Duplicate</button>
                        </form>
                        <form action={(fd) => run(deleteQuestionAction, fd)}>
                          <input
                            type="hidden"
                            name="organizationId"
                            value={organizationId}
                          />
                          <input type="hidden" name="versionId" value={versionId} />
                          <input type="hidden" name="questionId" value={q.id} />
                          <button type="submit" className="text-red-400">
                            Delete
                          </button>
                        </form>
                      </div>
                    ) : null}
                  </div>

                  {canManage && isDraft ? (
                    <form
                      className="mt-3 grid gap-2 md:grid-cols-2"
                      action={(fd) => run(updateQuestionAction, fd)}
                    >
                      <input
                        type="hidden"
                        name="organizationId"
                        value={organizationId}
                      />
                      <input type="hidden" name="versionId" value={versionId} />
                      <input type="hidden" name="questionId" value={q.id} />
                      <label className="text-xs md:col-span-2">
                        Question title
                        <input
                          name="prompt"
                          defaultValue={q.prompt}
                          required
                          className="mt-1 w-full rounded-md border border-[var(--jag-border)] bg-transparent px-2 py-1.5"
                        />
                      </label>
                      <label className="text-xs md:col-span-2">
                        Help text
                        <input
                          name="helpText"
                          defaultValue={q.help_text}
                          className="mt-1 w-full rounded-md border border-[var(--jag-border)] bg-transparent px-2 py-1.5"
                        />
                      </label>
                      <label className="text-xs">
                        Placeholder
                        <input
                          name="placeholder"
                          defaultValue={cfg.placeholder ?? ""}
                          className="mt-1 w-full rounded-md border border-[var(--jag-border)] bg-transparent px-2 py-1.5"
                        />
                      </label>
                      <label className="text-xs">
                        Default value
                        <input
                          name="defaultValue"
                          defaultValue={
                            cfg.defaultValue != null
                              ? String(cfg.defaultValue)
                              : ""
                          }
                          className="mt-1 w-full rounded-md border border-[var(--jag-border)] bg-transparent px-2 py-1.5"
                        />
                      </label>
                      <label className="text-xs">
                        Section
                        <select
                          name="sectionId"
                          defaultValue={cfg.sectionId ?? ""}
                          className="mt-1 w-full rounded-md border border-[var(--jag-border)] bg-transparent px-2 py-1.5"
                        >
                          <option value="">Ungrouped</option>
                          {initialSections.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.title}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          name="required"
                          value="true"
                          defaultChecked={q.required}
                        />
                        Required
                      </label>
                      {q.question_type === "numeric" ? (
                        <>
                          <label className="text-xs">
                            Min
                            <input
                              name="min"
                              type="number"
                              defaultValue={cfg.min ?? ""}
                              className="mt-1 w-full rounded-md border border-[var(--jag-border)] bg-transparent px-2 py-1.5"
                            />
                          </label>
                          <label className="text-xs">
                            Max
                            <input
                              name="max"
                              type="number"
                              defaultValue={cfg.max ?? ""}
                              className="mt-1 w-full rounded-md border border-[var(--jag-border)] bg-transparent px-2 py-1.5"
                            />
                          </label>
                          <label className="text-xs">
                            Step
                            <input
                              name="step"
                              type="number"
                              defaultValue={cfg.step ?? ""}
                              className="mt-1 w-full rounded-md border border-[var(--jag-border)] bg-transparent px-2 py-1.5"
                            />
                          </label>
                        </>
                      ) : null}
                      {q.question_type === "likert" ? (
                        <>
                          <label className="text-xs">
                            Low label
                            <input
                              name="likertLowLabel"
                              defaultValue={cfg.likertLowLabel ?? ""}
                              className="mt-1 w-full rounded-md border border-[var(--jag-border)] bg-transparent px-2 py-1.5"
                            />
                          </label>
                          <label className="text-xs">
                            High label
                            <input
                              name="likertHighLabel"
                              defaultValue={cfg.likertHighLabel ?? ""}
                              className="mt-1 w-full rounded-md border border-[var(--jag-border)] bg-transparent px-2 py-1.5"
                            />
                          </label>
                        </>
                      ) : null}
                      <button
                        type="submit"
                        className="justify-self-start rounded-md border border-[var(--jag-border)] px-2 py-1 text-xs"
                      >
                        Save question
                      </button>
                    </form>
                  ) : null}

                  {CHOICE_TYPES.has(q.question_type) ? (
                    <ul className="mt-3 space-y-1 text-sm text-[var(--jag-muted)]">
                      {q.options.map((opt) => (
                        <li
                          key={opt.id}
                          className="flex flex-wrap items-center justify-between gap-2"
                        >
                          {canManage && isDraft ? (
                            <form
                              className="flex flex-1 items-center gap-2"
                              action={(fd) => run(updateOptionAction, fd)}
                            >
                              <input
                                type="hidden"
                                name="organizationId"
                                value={organizationId}
                              />
                              <input
                                type="hidden"
                                name="versionId"
                                value={versionId}
                              />
                              <input type="hidden" name="optionId" value={opt.id} />
                              <input
                                name="label"
                                defaultValue={opt.label}
                                className="flex-1 rounded-md border border-[var(--jag-border)] bg-transparent px-2 py-1 text-sm"
                              />
                              <button type="submit" className="text-xs">
                                Save
                              </button>
                            </form>
                          ) : (
                            <span>{opt.label}</span>
                          )}
                          {canManage && isDraft ? (
                            <form action={(fd) => run(deleteOptionAction, fd)}>
                              <input
                                type="hidden"
                                name="organizationId"
                                value={organizationId}
                              />
                              <input
                                type="hidden"
                                name="versionId"
                                value={versionId}
                              />
                              <input type="hidden" name="optionId" value={opt.id} />
                              <button type="submit" className="text-xs text-red-400">
                                Remove
                              </button>
                            </form>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {canManage && isDraft && CHOICE_TYPES.has(q.question_type) ? (
                    <form
                      className="mt-2 flex gap-2"
                      action={(fd) => run(addOptionAction, fd)}
                    >
                      <input
                        type="hidden"
                        name="organizationId"
                        value={organizationId}
                      />
                      <input type="hidden" name="versionId" value={versionId} />
                      <input type="hidden" name="questionId" value={q.id} />
                      <input
                        name="label"
                        required
                        placeholder="New option"
                        className="flex-1 rounded-md border border-[var(--jag-border)] bg-transparent px-2 py-1 text-sm"
                      />
                      <button type="submit" className="text-xs text-[var(--jag-accent)]">
                        Add option
                      </button>
                    </form>
                  ) : null}
                  <p className="mt-2 text-[10px] text-[var(--jag-muted-2)]">
                    Position {index + 1} of {ordered.length}
                  </p>
                </li>
              );
            })}
          </ol>
        )}
      </JagSection>

      {canManage && isDraft ? (
        <JagSection title="Add question">
          <form
            className="space-y-3 rounded-md border border-[var(--jag-border)] p-4"
            action={(fd) => run(addQuestionAction, fd)}
          >
            <input type="hidden" name="organizationId" value={organizationId} />
            <input type="hidden" name="versionId" value={versionId} />
            <label className="block text-sm">
              Type
              <select
                name="questionType"
                className="mt-1 w-full rounded-md border border-[var(--jag-border)] bg-transparent px-3 py-2"
                defaultValue="short_text"
              >
                {LISTENING_V1_QUESTION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Question title
              <input
                name="prompt"
                required
                className="mt-1 w-full rounded-md border border-[var(--jag-border)] bg-transparent px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              Help text
              <input
                name="helpText"
                className="mt-1 w-full rounded-md border border-[var(--jag-border)] bg-transparent px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              Section
              <select
                name="sectionId"
                className="mt-1 w-full rounded-md border border-[var(--jag-border)] bg-transparent px-3 py-2"
                defaultValue=""
              >
                <option value="">Ungrouped</option>
                {initialSections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="required" value="true" defaultChecked />
              Required
            </label>
            <div className="space-y-2">
              <p className="text-xs text-[var(--jag-muted)]">
                Options (choice / likert — at least two)
              </p>
              <input
                name="optionLabel"
                placeholder="Option A"
                className="w-full rounded-md border border-[var(--jag-border)] bg-transparent px-3 py-2 text-sm"
              />
              <input
                name="optionLabel"
                placeholder="Option B"
                className="w-full rounded-md border border-[var(--jag-border)] bg-transparent px-3 py-2 text-sm"
              />
              <input
                name="optionLabel"
                placeholder="Option C"
                className="w-full rounded-md border border-[var(--jag-border)] bg-transparent px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              className="rounded-md bg-[var(--jag-accent)] px-3 py-1.5 text-sm text-white"
            >
              Add question
            </button>
          </form>
        </JagSection>
      ) : null}

      {canManage && isPublished && instrument?.initiative_id ? (
        <JagSection
          title="Create campaign"
          description="Generate a public listening link. Token shown once."
        >
          <form
            className="grid gap-3 md:grid-cols-2"
            action={(fd) => {
              start(async () => {
                const result = await createCampaignAction(fd);
                if (!result.ok) {
                  setLocalError(result.error);
                  return;
                }
                if (result.id && result.publicToken && result.publicUrl) {
                  try {
                    sessionStorage.setItem(
                      `listening.campaign.public.${result.id}`,
                      JSON.stringify({
                        token: result.publicToken,
                        url: result.publicUrl,
                      })
                    );
                  } catch {
                    /* ignore */
                  }
                  router.push(`/jag/listening/campaigns/${result.id}`);
                } else router.refresh();
              });
            }}
          >
            <input type="hidden" name="organizationId" value={organizationId} />
            <input
              type="hidden"
              name="initiativeId"
              value={String(instrument.initiative_id)}
            />
            <input type="hidden" name="instrumentVersionId" value={versionId} />
            <label className="text-sm md:col-span-2">
              Campaign name
              <input
                name="title"
                required
                className="mt-1 w-full rounded-md border border-[var(--jag-border)] bg-transparent px-3 py-2"
              />
            </label>
            <label className="text-sm">
              Privacy
              <select
                name="privacyMode"
                defaultValue="anonymous"
                className="mt-1 w-full rounded-md border border-[var(--jag-border)] bg-transparent px-3 py-2"
              >
                <option value="anonymous">Anonymous</option>
                <option value="confidential">Confidential</option>
                <option value="identified">Identified</option>
              </select>
            </label>
            <label className="text-sm">
              Open date
              <input
                type="datetime-local"
                name="opensAt"
                className="mt-1 w-full rounded-md border border-[var(--jag-border)] bg-transparent px-3 py-2"
              />
            </label>
            <label className="text-sm">
              Close date
              <input
                type="datetime-local"
                name="closesAt"
                className="mt-1 w-full rounded-md border border-[var(--jag-border)] bg-transparent px-3 py-2"
              />
            </label>
            <button
              type="submit"
              className="rounded-md bg-[var(--jag-accent)] px-3 py-1.5 text-sm text-white md:col-span-2 md:w-fit"
            >
              Create campaign & generate link
            </button>
          </form>
        </JagSection>
      ) : null}
    </div>
  );
}
