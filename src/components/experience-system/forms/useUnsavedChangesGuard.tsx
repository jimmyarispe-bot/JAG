"use client";

import { useCallback, useEffect, useState } from "react";
import { ConfirmDialog } from "../interaction";

type GuardOptions = {
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

/**
 * Protects against losing unsaved form work.
 * - Browser close / refresh via beforeunload
 * - In-app link navigation via capture-phase click interception + confirm dialog
 */
export function useUnsavedChangesGuard(isDirty: boolean, options: GuardOptions = {}) {
  const {
    title = "You have unsaved changes.",
    message = "Leave anyway?",
    confirmLabel = "Leave anyway",
    cancelLabel = "Stay",
  } = options;

  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    if (!isDirty) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (!isDirty) return;

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      // Same-page hash / javascript: ignore
      try {
        const url = new URL(href, window.location.href);
        if (url.origin === window.location.origin && url.pathname === window.location.pathname && url.search === window.location.search) {
          return;
        }
      } catch {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      setPendingHref(href);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [isDirty]);

  const confirmLeave = useCallback(() => {
    if (!pendingHref) return;
    const href = pendingHref;
    setPendingHref(null);
    window.location.assign(href);
  }, [pendingHref]);

  const cancelLeave = useCallback(() => {
    setPendingHref(null);
  }, []);

  const guardDialog = (
    <ConfirmDialog
      open={Boolean(pendingHref)}
      title={title}
      message={message}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      tone="default"
      onConfirm={confirmLeave}
      onCancel={cancelLeave}
    />
  );

  return { guardDialog, isPromptOpen: Boolean(pendingHref) };
}

/** Form-level dirty tracking helper. */
export function useDirtyForm(initialSnapshot: string) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [current, setCurrent] = useState(initialSnapshot);

  const markClean = useCallback((next?: string) => {
    const value = next ?? current;
    setSnapshot(value);
    setCurrent(value);
  }, [current]);

  return {
    isDirty: current !== snapshot,
    setCurrent,
    markClean,
  };
}
