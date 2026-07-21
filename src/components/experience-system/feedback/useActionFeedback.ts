"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_ERROR_HINT,
  DEFAULT_PROCESSING_THRESHOLD_MS,
  DEFAULT_SUCCESS_DURATION_MS,
  resolveActionLabels,
  type ActionLabelSet,
  type ActionStatus,
  type ActionVerb,
} from "./action-labels";
import { useAnnounce } from "./LiveAnnouncer";
import { useBackgroundJobs } from "./BackgroundJobs";
import { useGlobalProgress } from "./GlobalProgress";
import { useToast } from "./Toast";

export type UseActionFeedbackOptions = {
  verb?: ActionVerb;
  labels?: Partial<ActionLabelSet>;
  /**
   * Toast + SR announcement on success. Defaults to labels.success.
   * Pass `false` to skip success toast/announce (e.g. navigation handoff).
   */
  successToast?: string | false;
  /** Toast title on error. Defaults to labels.error. */
  errorToast?: string;
  errorHint?: string;
  /** Shown in header activity / global progress for long ops. */
  progressLabel?: string;
  successDurationMs?: number;
  processingThresholdMs?: number;
  /** When true (default), long-running ops register a background job after the threshold. */
  enableBackgroundHandoff?: boolean;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

export type UseActionFeedbackResult = {
  status: ActionStatus;
  errorMessage: string | null;
  errorHint: string;
  labels: ActionLabelSet;
  isBusy: boolean;
  /** Determinate progress 0–100 for OperationProgress / global bar. */
  progressValue: number | null;
  run: <T>(action: () => Promise<T> | T) => Promise<T | undefined>;
  reset: () => void;
  setError: (message: string) => void;
  /** Report long-running progress (imports, uploads, AI). */
  reportProgress: (value: number, label?: string) => void;
};

export function useActionFeedback(options: UseActionFeedbackOptions = {}): UseActionFeedbackResult {
  const {
    verb = "save",
    labels: labelOverrides,
    successToast,
    errorToast,
    errorHint = DEFAULT_ERROR_HINT,
    progressLabel,
    successDurationMs = DEFAULT_SUCCESS_DURATION_MS,
    processingThresholdMs = DEFAULT_PROCESSING_THRESHOLD_MS,
    enableBackgroundHandoff = true,
    onSuccess,
    onError,
  } = options;

  const labels = resolveActionLabels(verb, labelOverrides);
  const [status, setStatus] = useState<ActionStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [progressValue, setProgressValue] = useState<number | null>(null);
  const announce = useAnnounce();
  const toast = useToast();
  const jobs = useBackgroundJobs();
  const progress = useGlobalProgress();

  const pendingRef = useRef(false);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const processingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const jobIdRef = useRef<string | null>(null);

  const clearTimers = useCallback(() => {
    if (successTimer.current) {
      clearTimeout(successTimer.current);
      successTimer.current = null;
    }
    if (processingTimer.current) {
      clearTimeout(processingTimer.current);
      processingTimer.current = null;
    }
  }, []);

  const reportProgress = useCallback(
    (value: number, label?: string) => {
      const pct = Math.max(0, Math.min(100, value));
      setProgressValue(pct);
      progress.setProgress(pct, label);
      if (jobIdRef.current) {
        jobs.update(jobIdRef.current, { label, progress: pct });
      }
    },
    [jobs, progress]
  );

  const reset = useCallback(() => {
    clearTimers();
    pendingRef.current = false;
    setStatus("idle");
    setErrorMessage(null);
    setProgressValue(null);
    if (jobIdRef.current) {
      jobs.complete(jobIdRef.current);
      jobIdRef.current = null;
    }
    progress.hide();
  }, [clearTimers, jobs, progress]);

  const setError = useCallback(
    (message: string) => {
      clearTimers();
      pendingRef.current = false;
      setStatus("error");
      setErrorMessage(message);
      setProgressValue(null);
      toast.error(errorToast ?? labels.error, message);
      announce(`${errorToast ?? labels.error}. ${message}`, "assertive");
      if (jobIdRef.current) {
        jobs.fail(jobIdRef.current);
        jobIdRef.current = null;
      }
      progress.hide();
    },
    [announce, clearTimers, errorToast, jobs, labels.error, progress, toast]
  );

  useEffect(() => () => clearTimers(), [clearTimers]);

  const run = useCallback(
    async <T,>(action: () => Promise<T> | T): Promise<T | undefined> => {
      if (pendingRef.current) return undefined;

      pendingRef.current = true;
      clearTimers();
      setStatus("loading");
      setErrorMessage(null);
      setProgressValue(null);
      announce(labels.loading, "polite");

      const longLabel = progressLabel ?? labels.loading;
      progress.show(longLabel);

      processingTimer.current = setTimeout(() => {
        if (!pendingRef.current) return;
        setStatus("processing");
        announce(`${labels.processing} You may continue working.`, "polite");
        if (enableBackgroundHandoff && !jobIdRef.current) {
          jobIdRef.current = jobs.start(longLabel);
        }
      }, processingThresholdMs);

      try {
        const result = await action();

        clearTimers();
        setStatus("success");
        const successMsg = successToast === false ? null : (successToast ?? labels.success);
        if (successMsg) {
          toast.success(successMsg);
          announce(successMsg, "polite");
        }
        onSuccess?.();

        if (jobIdRef.current) {
          jobs.complete(jobIdRef.current, successMsg ? { successMessage: successMsg } : undefined);
          jobIdRef.current = null;
        }
        progress.hide();
        setProgressValue(null);

        successTimer.current = setTimeout(() => {
          pendingRef.current = false;
          setStatus("idle");
        }, successDurationMs);

        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        clearTimers();
        pendingRef.current = false;
        setStatus("error");
        setErrorMessage(message || errorHint);
        setProgressValue(null);
        const title = errorToast ?? labels.error;
        toast.error(title, message || errorHint);
        announce(`${title}. ${message || errorHint}`, "assertive");
        onError?.(err instanceof Error ? err : new Error(message));

        if (jobIdRef.current) {
          jobs.fail(jobIdRef.current, { errorMessage: title });
          jobIdRef.current = null;
        }
        progress.hide();
        return undefined;
      }
    },
    [
      announce,
      clearTimers,
      enableBackgroundHandoff,
      errorHint,
      errorToast,
      jobs,
      labels.error,
      labels.loading,
      labels.processing,
      labels.success,
      onError,
      onSuccess,
      processingThresholdMs,
      progress,
      progressLabel,
      successDurationMs,
      successToast,
      toast,
    ]
  );

  return {
    status,
    errorMessage,
    errorHint,
    labels,
    isBusy: status === "loading" || status === "processing",
    progressValue,
    run,
    reset,
    setError,
    reportProgress,
  };
}
