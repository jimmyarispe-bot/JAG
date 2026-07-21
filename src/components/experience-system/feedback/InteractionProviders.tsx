"use client";

import type { ReactNode } from "react";
import { LiveAnnouncerProvider } from "./LiveAnnouncer";
import { ToastProvider } from "./Toast";
import { BackgroundJobsProvider } from "./BackgroundJobs";
import { GlobalProgressProvider } from "./GlobalProgress";

/**
 * Root interaction stack for The JAG:
 * live announcements → toasts → background jobs → global progress.
 */
export function InteractionProviders({ children }: { children: ReactNode }) {
  return (
    <LiveAnnouncerProvider>
      <ToastProvider>
        <BackgroundJobsProvider>
          <GlobalProgressProvider>{children}</GlobalProgressProvider>
        </BackgroundJobsProvider>
      </ToastProvider>
    </LiveAnnouncerProvider>
  );
}
