"use client";

import { useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitListeningResponseAction } from "@/lib/listening-public/submit-action";
import {
  clearDraftStorage,
  markSubmittedLocally,
  readDraftFromStorage,
  readSubmittedLocally,
  seedDraftFromDefaults,
  toSubmitAnswers,
  validateCurrentQuestion,
  validateRequiredAnswers,
  writeDraftToStorage,
  type ListeningDraftAnswers,
  type ListeningRespondentView,
} from "@/lib/platform/listening";
import { ListeningProgress } from "./ListeningProgress";
import { ListeningQuestionField } from "./ListeningQuestionField";
import { ListeningThankYou } from "./ListeningThankYou";

type Phase = "intro" | "questions" | "review" | "submitting" | "done" | "error";

const PRIVACY_LABEL: Record<string, string> = {
  anonymous: "Anonymous",
  confidential: "Confidential",
  identified: "Identified",
};

export function ListeningRespondentSurvey({
  token,
  view,
}: {
  readonly token: string;
  readonly view: ListeningRespondentView;
}) {
  const router = useRouter();
  const headingId = useId();
  const mainRef = useRef<HTMLDivElement>(null);
  const [pending, start] = useTransition();
  const [phase, setPhase] = useState<Phase>("intro");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<ListeningDraftAnswers>({});
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitLock, setSubmitLock] = useState(false);

  const questions = view.questions;
  const current = questions[index] ?? null;
  const sectionForCurrent = useMemo(() => {
    if (!current?.sectionId) return null;
    return view.sections.find((s) => s.id === current.sectionId) ?? null;
  }, [current, view.sections]);

  const sectionNav = useMemo(() => {
    return view.sections.map((section) => {
      const firstIndex = questions.findIndex((q) => q.sectionId === section.id);
      return { ...section, firstIndex };
    });
  }, [view.sections, questions]);

  useEffect(() => {
    const already = readSubmittedLocally(token);
    if (already) {
      setPhase("done");
      return;
    }
    const saved = readDraftFromStorage(token);
    const seeded = seedDraftFromDefaults(questions);
    setAnswers(saved ? { ...seeded, ...saved } : seeded);
  }, [token, questions]);

  useEffect(() => {
    if (phase === "intro" || phase === "done") return;
    writeDraftToStorage(token, answers);
  }, [answers, token, phase]);

  useEffect(() => {
    if (phase !== "questions" && phase !== "review") return;
    mainRef.current?.focus();
  }, [index, phase]);

  function setAnswer(questionId: string, value: unknown) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setFieldError(null);
  }

  function goNext() {
    if (!current) return;
    const check = validateCurrentQuestion(current, answers[current.id]);
    if (!check.ok) {
      setFieldError(check.message);
      return;
    }
    setFieldError(null);
    if (index >= questions.length - 1) {
      setPhase("review");
      return;
    }
    setIndex((i) => i + 1);
  }

  function goPrev() {
    setFieldError(null);
    if (phase === "review") {
      setPhase("questions");
      setIndex(Math.max(0, questions.length - 1));
      return;
    }
    if (index <= 0) {
      setPhase("intro");
      return;
    }
    setIndex((i) => i - 1);
  }

  function submit() {
    if (submitLock || pending || phase === "submitting") return;
    const required = validateRequiredAnswers(questions, answers);
    if (!required.ok) {
      setSubmitError(required.message);
      const firstMissing = required.missingIds[0];
      if (firstMissing) {
        const idx = questions.findIndex((q) => q.id === firstMissing);
        if (idx >= 0) {
          setIndex(idx);
          setPhase("questions");
          setFieldError("This question is required.");
        }
      }
      return;
    }

    setSubmitLock(true);
    setSubmitError(null);
    setPhase("submitting");
    const payload = toSubmitAnswers(questions, answers);

    start(async () => {
      const result = await submitListeningResponseAction({
        token,
        answers: payload,
      });
      if (!result.ok) {
        setSubmitLock(false);
        setPhase("review");
        setSubmitError(result.error);
        return;
      }
      clearDraftStorage(token);
      markSubmittedLocally(token, {
        title: view.title,
        privacyStatement: view.privacyStatement,
      });
      setPhase("done");
      router.replace(`/listen/${encodeURIComponent(token)}/complete`);
    });
  }

  if (phase === "done") {
    return (
      <ListeningThankYou
        title={view.title}
        privacyStatement={view.privacyStatement}
      />
    );
  }

  return (
    <div className="space-y-6" data-testid="listening-respondent-survey">
      <header className="space-y-3 border-b border-[var(--lp-border)] pb-5">
        <p className="text-xs uppercase tracking-[0.12em] text-[var(--lp-muted)]">
          Organizational Listening
        </p>
        <h1 id={headingId} className="text-2xl font-medium text-[var(--lp-text)]">
          {view.title}
        </h1>
        <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--lp-muted)]">
          <div>
            <dt className="inline text-[var(--lp-muted-2)]">Privacy </dt>
            <dd className="inline">
              {PRIVACY_LABEL[view.privacyMode] ?? view.privacyMode}
            </dd>
          </div>
          <div>
            <dt className="inline text-[var(--lp-muted-2)]">Time </dt>
            <dd className="inline">~{view.estimatedMinutes} min</dd>
          </div>
          <div>
            <dt className="inline text-[var(--lp-muted-2)]">Questions </dt>
            <dd className="inline">{view.questionCount}</dd>
          </div>
        </dl>
      </header>

      {phase !== "intro" ? (
        <ListeningProgress
          current={
            phase === "review" || phase === "submitting"
              ? questions.length
              : index + 1
          }
          total={questions.length}
        />
      ) : null}

      {view.sections.length > 0 && phase === "questions" ? (
        <nav aria-label="Sections" className="flex flex-wrap gap-2">
          {sectionNav.map((s) => {
            const active = current?.sectionId === s.id;
            return (
              <button
                key={s.id}
                type="button"
                disabled={s.firstIndex < 0}
                onClick={() => {
                  if (s.firstIndex >= 0) {
                    setIndex(s.firstIndex);
                    setFieldError(null);
                  }
                }}
                className={`rounded-md border px-2.5 py-1 text-xs ${
                  active
                    ? "border-[var(--lp-accent)] text-[var(--lp-text)]"
                    : "border-[var(--lp-border)] text-[var(--lp-muted)]"
                }`}
              >
                {s.title}
              </button>
            );
          })}
        </nav>
      ) : null}

      <div
        ref={mainRef}
        tabIndex={-1}
        className="outline-none"
        aria-labelledby={headingId}
      >
        {phase === "intro" ? (
          <div className="space-y-5" data-testid="listening-intro">
            {view.introduction ? (
              <p className="text-sm leading-relaxed text-[var(--lp-muted)]">
                {view.introduction}
              </p>
            ) : (
              <p className="text-sm text-[var(--lp-muted)]">
                Please share your perspective. Your progress is saved on this
                device until you submit.
              </p>
            )}
            {view.privacyStatement ? (
              <p className="rounded-md border border-[var(--lp-border)] bg-[var(--lp-panel)] px-3 py-3 text-sm text-[var(--lp-muted)]">
                {view.privacyStatement}
              </p>
            ) : null}
            <button
              type="button"
              className="rounded-md bg-[var(--lp-accent)] px-4 py-2.5 text-sm font-medium text-[var(--lp-accent-text)]"
              onClick={() => {
                setPhase("questions");
                setIndex(0);
              }}
            >
              Begin
            </button>
          </div>
        ) : null}

        {phase === "questions" && current ? (
          <div className="space-y-5">
            {sectionForCurrent ? (
              <div className="rounded-md border border-[var(--lp-border)] bg-[var(--lp-panel)] px-3 py-3">
                <p className="text-sm font-medium text-[var(--lp-text)]">
                  {sectionForCurrent.title}
                </p>
                {sectionForCurrent.description ? (
                  <p className="mt-1 text-xs text-[var(--lp-muted)]">
                    {sectionForCurrent.description}
                  </p>
                ) : null}
              </div>
            ) : null}
            <ListeningQuestionField
              question={current}
              value={answers[current.id]}
              onChange={(v) => setAnswer(current.id, v)}
              error={fieldError}
            />
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={goPrev}
                className="rounded-md border border-[var(--lp-border)] px-4 py-2.5 text-sm text-[var(--lp-text)]"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={goNext}
                className="rounded-md bg-[var(--lp-accent)] px-4 py-2.5 text-sm font-medium text-[var(--lp-accent-text)]"
              >
                {index >= questions.length - 1 ? "Review" : "Next"}
              </button>
            </div>
          </div>
        ) : null}

        {(phase === "review" || phase === "submitting") && (
          <div className="space-y-5" data-testid="listening-review">
            <p className="text-sm text-[var(--lp-muted)]">
              Review your answers, then submit once. You will not be able to
              change them after submission.
            </p>
            <ul className="space-y-3">
              {questions.map((q) => (
                <li
                  key={q.id}
                  className="rounded-md border border-[var(--lp-border)] px-3 py-2 text-sm"
                >
                  <p className="text-[var(--lp-muted-2)]">
                    {q.number}. {q.prompt}
                  </p>
                  <p className="mt-1 text-[var(--lp-text)]">
                    {formatAnswer(q.id, answers[q.id], q.questionType)}
                  </p>
                  <button
                    type="button"
                    className="mt-1 text-xs text-[var(--lp-accent)]"
                    onClick={() => {
                      setIndex(q.number - 1);
                      setPhase("questions");
                    }}
                  >
                    Edit
                  </button>
                </li>
              ))}
            </ul>
            {submitError ? (
              <p className="text-sm text-[var(--lp-danger)]" role="alert">
                {submitError}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={goPrev}
                disabled={phase === "submitting"}
                className="rounded-md border border-[var(--lp-border)] px-4 py-2.5 text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={submitLock || phase === "submitting"}
                data-testid="listening-submit"
                className="rounded-md bg-[var(--lp-accent)] px-4 py-2.5 text-sm font-medium text-[var(--lp-accent-text)] disabled:opacity-50"
              >
                {phase === "submitting" ? "Submitting…" : "Submit responses"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatAnswer(
  _id: string,
  value: unknown,
  type: string
): string {
  if (value === undefined || value === null || value === "") return "—";
  if (type === "multi_choice" && Array.isArray(value)) {
    return value.length ? value.join(", ") : "—";
  }
  return String(value);
}
