"use client";

import { useCallback, useEffect, useId, useState, type FormEvent, type ReactNode } from "react";
import type { XesFormState } from "../types";
import { cn } from "@/components/workspace-design-system/utils";
import { InlineHelp } from "./InlineHelp";
import { DraftBanner } from "./DraftBanner";
import { ErrorBanner } from "../feedback";

export function useFormDraft<T extends Record<string, unknown>>(storageKey: string, initial: T) {
  const [draft, setDraft] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? { ...initial, ...JSON.parse(raw) } : initial;
    } catch {
      return initial;
    }
  });

  const saveDraft = useCallback(
    (next: T) => {
      setDraft(next);
      if (typeof window !== "undefined") localStorage.setItem(storageKey, JSON.stringify(next));
    },
    [storageKey]
  );

  const clearDraft = useCallback(() => {
    setDraft(initial);
    if (typeof window !== "undefined") localStorage.removeItem(storageKey);
  }, [initial, storageKey]);

  return { draft, saveDraft, clearDraft, hasDraft: typeof window !== "undefined" && Boolean(localStorage.getItem(storageKey)) };
}

export function useAutosave<T>(
  value: T,
  onSave: (value: T) => Promise<void> | void,
  delayMs = 1200
) {
  const [state, setState] = useState<XesFormState>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        setState("saving");
        await onSave(value);
        setState("saved");
        setError(null);
      } catch (e) {
        setState("error");
        setError(e instanceof Error ? e.message : "Save failed");
      }
    }, delayMs);
    return () => clearTimeout(timer);
  }, [value, onSave, delayMs]);

  return { state, error };
}

export interface ExperienceFormProps {
  children: ReactNode;
  onSubmit?: (e: FormEvent<HTMLFormElement>) => void | Promise<void>;
  draftBanner?: { onDiscard: () => void; onRestore?: () => void };
  autosaveState?: XesFormState;
  error?: string | null;
  className?: string;
  ariaLabel?: string;
}

export function ExperienceForm({
  children,
  onSubmit,
  draftBanner,
  autosaveState,
  error,
  className,
  ariaLabel,
}: ExperienceFormProps) {
  return (
    <form
      className={cn("space-y-4", className)}
      onSubmit={onSubmit}
      aria-label={ariaLabel}
      noValidate
    >
      {draftBanner && <DraftBanner onDiscard={draftBanner.onDiscard} onRestore={draftBanner.onRestore} />}
      {autosaveState === "saved" && (
        <p className="text-xs text-emerald-600" role="status">Draft saved automatically</p>
      )}
      {error && <ErrorBanner message={error} />}
      {children}
    </form>
  );
}

export function FormField({
  label,
  htmlFor,
  required,
  error,
  help,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  help?: string;
  children: ReactNode;
}) {
  const autoId = useId();
  const id = htmlFor ?? autoId;
  const helpId = help ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-rose-600"> *</span>}
      </label>
      <div aria-describedby={[helpId, errorId].filter(Boolean).join(" ") || undefined}>{children}</div>
      {help && <InlineHelp id={helpId}>{help}</InlineHelp>}
      {error && (
        <p id={errorId} className="text-xs text-rose-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function AttachmentField({
  label = "Attachments",
  accept,
  multiple,
  onChange,
}: {
  label?: string;
  accept?: string;
  multiple?: boolean;
  onChange?: (files: FileList | null) => void;
}) {
  const id = useId();
  return (
    <FormField label={label} htmlFor={id} help="Files attach when the form is submitted.">
      <input
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-700"
        onChange={(e) => onChange?.(e.target.files)}
      />
    </FormField>
  );
}

export { InlineHelp } from "./InlineHelp";
export { DraftBanner } from "./DraftBanner";
