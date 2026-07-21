"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/components/workspace-design-system/utils";
import { useToast } from "./Toast";

export type BackgroundJob = {
  id: string;
  label: string;
  progress?: number;
  startedAt: number;
};

type BackgroundJobsMutators = {
  start: (label: string, progress?: number) => string;
  update: (id: string, patch: { label?: string; progress?: number }) => void;
  complete: (id: string, options?: { successMessage?: string }) => void;
  fail: (id: string, options?: { errorMessage?: string }) => void;
};

type BackgroundJobsApi = BackgroundJobsMutators & {
  jobs: BackgroundJob[];
  activeCount: number;
};

/** Stable mutators — action feedback should not re-render when job list changes. */
const BackgroundJobsApiContext = createContext<BackgroundJobsMutators | null>(null);

/** Job list — only indicators / panels that display jobs subscribe here. */
const BackgroundJobsStateContext = createContext<BackgroundJob[]>([]);

export function BackgroundJobsProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<BackgroundJob[]>([]);
  const toast = useToast();

  const start = useCallback((label: string, progress?: number) => {
    const id = `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setJobs((prev) => [...prev, { id, label, progress, startedAt: Date.now() }]);
    return id;
  }, []);

  const update = useCallback((id: string, patch: { label?: string; progress?: number }) => {
    setJobs((prev) =>
      prev.map((job) => (job.id === id ? { ...job, ...patch } : job))
    );
  }, []);

  const complete = useCallback(
    (id: string, options?: { successMessage?: string }) => {
      setJobs((prev) => prev.filter((job) => job.id !== id));
      if (options?.successMessage) {
        toast.success(options.successMessage);
      }
    },
    [toast]
  );

  const fail = useCallback(
    (id: string, options?: { errorMessage?: string }) => {
      setJobs((prev) => prev.filter((job) => job.id !== id));
      if (options?.errorMessage) {
        toast.error(options.errorMessage);
      }
    },
    [toast]
  );

  // P006: mutators stay stable; jobs live in a separate context.
  const api = useMemo(
    () => ({ start, update, complete, fail }),
    [start, update, complete, fail]
  );

  return (
    <BackgroundJobsApiContext.Provider value={api}>
      <BackgroundJobsStateContext.Provider value={jobs}>
        {children}
      </BackgroundJobsStateContext.Provider>
    </BackgroundJobsApiContext.Provider>
  );
}

export function useBackgroundJobs(): BackgroundJobsApi {
  const api = useContext(BackgroundJobsApiContext);
  // Default: API-only subscription (no re-render on job list ticks).
  if (!api) {
    return {
      jobs: [],
      activeCount: 0,
      start: () => "",
      update: () => undefined,
      complete: () => undefined,
      fail: () => undefined,
    };
  }
  return {
    ...api,
    jobs: [],
    activeCount: 0,
  };
}

/** Subscribe to live job list — use only in UI that displays background activity. */
export function useBackgroundJobsState(): BackgroundJob[] {
  return useContext(BackgroundJobsStateContext);
}

/** Compact header indicator for in-flight background work. */
export function ShellActivityIndicator({ className }: { className?: string }) {
  const jobs = useBackgroundJobsState();
  const activeCount = jobs.length;
  const [open, setOpen] = useState(false);

  if (activeCount === 0) return null;

  const primary = jobs[0];

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-medium text-brand-800"
        aria-live="polite"
        aria-expanded={open}
        aria-label={`${activeCount} background ${activeCount === 1 ? "job" : "jobs"} running`}
      >
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-brand-500" aria-hidden />
        <span className="max-w-[10rem] truncate">{primary?.label ?? "Processing…"}</span>
        {activeCount > 1 ? (
          <span className="rounded-md bg-brand-100 px-1.5 py-0.5 text-[10px]">{activeCount}</span>
        ) : null}
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            aria-label="Close activity panel"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg">
            <p className="mb-2 text-sm font-semibold text-slate-900">In progress</p>
            <ul className="space-y-3">
              {jobs.map((job) => (
                <li key={job.id} className="space-y-1.5">
                  <p className="text-xs text-slate-700">{job.label}</p>
                  <p className="text-[11px] text-slate-500">You may continue working.</p>
                  {typeof job.progress === "number" ? (
                    <div
                      className="h-1.5 overflow-hidden rounded-full bg-slate-100"
                      role="progressbar"
                      aria-valuenow={job.progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className="h-full bg-brand-500 transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(0, job.progress))}%` }}
                      />
                    </div>
                  ) : (
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full w-1/3 animate-pulse rounded-full bg-brand-400" />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : null}
    </div>
  );
}
