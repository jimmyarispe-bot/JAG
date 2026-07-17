"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type Politeness = "polite" | "assertive";

type AnnounceFn = (message: string, politeness?: Politeness) => void;

const AnnounceContext = createContext<AnnounceFn>(() => undefined);

/**
 * D.1 — App-level live region for async success/error announcements (A11Y-07).
 */
export function LiveAnnouncerProvider({ children }: { children: ReactNode }) {
  const [polite, setPolite] = useState("");
  const [assertive, setAssertive] = useState("");

  const announce = useCallback<AnnounceFn>((message, politeness = "polite") => {
    if (politeness === "assertive") {
      setAssertive("");
      requestAnimationFrame(() => setAssertive(message));
    } else {
      setPolite("");
      requestAnimationFrame(() => setPolite(message));
    }
  }, []);

  const value = useMemo(() => announce, [announce]);

  return (
    <AnnounceContext.Provider value={value}>
      {children}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {polite}
      </div>
      <div className="sr-only" aria-live="assertive" aria-atomic="true">
        {assertive}
      </div>
    </AnnounceContext.Provider>
  );
}

export function useAnnounce(): AnnounceFn {
  return useContext(AnnounceContext);
}
