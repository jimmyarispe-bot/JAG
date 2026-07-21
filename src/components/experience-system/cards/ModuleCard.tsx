"use client";

import { useCallback, useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CardShell } from "@/components/workspace-design-system";
import { cn } from "@/components/workspace-design-system/utils";
import {
  ActionButton,
  useActionFeedback,
  type UseActionFeedbackResult,
} from "@/components/experience-system/feedback";

const CARD_STATUS_MESSAGES = [
  "Preparing workspace…",
  "Loading data…",
  "Checking permissions…",
  "Connecting…",
] as const;

const LABEL_OPENING = "Opening…";
const LABEL_LOADING = "Loading…";
const LABEL_NAVIGATING = "Navigating…";

/** Button label steps while the open action is in flight. */
const OPENING_TO_LOADING_MS = 450;
const LOADING_TO_NAVIGATING_MS = 900;
/** In-card status message threshold (sprint UX-001). */
const CARD_MESSAGE_THRESHOLD_MS = 1500;
const CARD_MESSAGE_ROTATE_MS = 1200;
/** Fallback if soft navigation does not unmount the card. */
const NAVIGATION_FEEDBACK_TIMEOUT_MS = 8000;

export type ModuleCardProps = {
  title: string;
  description?: ReactNode;
  href: string;
  className?: string;
  padding?: "sm" | "md" | "lg";
  /** Optional title element class overrides for existing dashboard surfaces. */
  titleClassName?: string;
  descriptionClassName?: string;
};

export function ModuleCard({
  title,
  description,
  href,
  className,
  padding = "md",
  titleClassName,
  descriptionClassName,
}: ModuleCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busyLabel, setBusyLabel] = useState(LABEL_OPENING);
  const [cardMessage, setCardMessage] = useState<string | null>(null);
  const labelTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const messageInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const actionRef = useRef<UseActionFeedbackResult | null>(null);

  const clearLabelTimers = useCallback(() => {
    for (const timer of labelTimers.current) clearTimeout(timer);
    labelTimers.current = [];
  }, []);

  const clearMessageInterval = useCallback(() => {
    if (messageInterval.current) {
      clearInterval(messageInterval.current);
      messageInterval.current = null;
    }
  }, []);

  const action = useActionFeedback({
    verb: "custom",
    labels: {
      idle: "Open",
      loading: busyLabel,
      processing: busyLabel,
      success: "Open",
      error: "Unable to open",
    },
    processingThresholdMs: CARD_MESSAGE_THRESHOLD_MS,
    enableBackgroundHandoff: false,
    successToast: false,
    successDurationMs: 0,
    progressLabel: `Opening ${title}`,
  });

  actionRef.current = action;

  // Prefetch destination so shell can paint immediately on click (UX-002).
  useEffect(() => {
    router.prefetch(href);
  }, [href, router]);

  useEffect(() => {
    return () => {
      clearLabelTimers();
      clearMessageInterval();
      actionRef.current?.reset();
    };
  }, [clearLabelTimers, clearMessageInterval]);

  useEffect(() => {
    if (action.status === "processing") {
      setCardMessage(CARD_STATUS_MESSAGES[0]);
      let index = 0;
      clearMessageInterval();
      messageInterval.current = setInterval(() => {
        index = (index + 1) % CARD_STATUS_MESSAGES.length;
        setCardMessage(CARD_STATUS_MESSAGES[index]);
      }, CARD_MESSAGE_ROTATE_MS);
      return () => clearMessageInterval();
    }

    setCardMessage(null);
    clearMessageInterval();
  }, [action.status, clearMessageInterval]);

  const startLabelProgression = useCallback(() => {
    clearLabelTimers();
    setBusyLabel(LABEL_OPENING);
    setCardMessage(null);
    labelTimers.current.push(
      setTimeout(() => setBusyLabel(LABEL_LOADING), OPENING_TO_LOADING_MS),
      setTimeout(() => setBusyLabel(LABEL_NAVIGATING), LOADING_TO_NAVIGATING_MS)
    );
  }, [clearLabelTimers]);

  const open = useCallback(() => {
    if (action.isBusy || isPending) return;
    startLabelProgression();

    // UX-002: navigate immediately — destination shell + skeletons render without waiting for data.
    startTransition(() => {
      router.push(href);
    });

    // Keep source-card feedback until unmount; never gate navigation on data.
    void action.run(async () => {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, NAVIGATION_FEEDBACK_TIMEOUT_MS);
      });
    });
  }, [action, href, isPending, router, startLabelProgression]);

  const busy = action.isBusy || isPending;

  return (
    <CardShell
      interactive
      padding={padding}
      className={cn(
        "transition-opacity duration-300",
        busy && "pointer-events-none opacity-70",
        className
      )}
    >
      <div aria-busy={busy || undefined}>
        <h3 className={cn("text-sm font-semibold text-slate-900", titleClassName)}>{title}</h3>
        {description ? (
          <div className={cn("mt-1 text-xs text-slate-500", descriptionClassName)}>{description}</div>
        ) : null}

        {cardMessage ? (
          <p className="mt-2 text-xs text-slate-500" role="status" aria-live="polite">
            {cardMessage}
          </p>
        ) : null}

        <div className="mt-3">
          <ActionButton
            status={action.status === "success" ? "idle" : action.status}
            verb="open"
            labels={{
              idle: "Open",
              loading: busyLabel,
              processing: busyLabel,
              success: "✓ Open",
              error: "Unable to open",
            }}
            variant="primary"
            size="sm"
            onClick={open}
            errorMessage={action.errorMessage}
          >
            Open
          </ActionButton>
        </div>
      </div>
    </CardShell>
  );
}
