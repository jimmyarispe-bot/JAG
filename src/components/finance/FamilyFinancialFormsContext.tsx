"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { useActionFeedback } from "@/components/experience-system/feedback";
import { assertActionResult } from "@/components/experience-system/feedback/runMutation";
import type { FamilyFinancialCenterProps } from "@/components/finance/family-financial-types";

type FamilyFinancialFormsContextValue = {
  familyId: string;
  profile: FamilyFinancialCenterProps["profile"];
  portalMode: boolean;
  account: FamilyFinancialCenterProps["profile"]["account"];
  action: ReturnType<typeof useActionFeedback>;
  runForm: (
    e: React.FormEvent<HTMLFormElement>,
    mutate: (fd: FormData) => Promise<unknown>
  ) => void;
};

const FamilyFinancialFormsContext = createContext<FamilyFinancialFormsContextValue | null>(null);

export function useFamilyFinancialForms() {
  const ctx = useContext(FamilyFinancialFormsContext);
  if (!ctx) {
    throw new Error("Family financial form sections must render inside FamilyFinancialFormsProvider.");
  }
  return ctx;
}

/** P007/P010 — lightweight client context (kept separate from heavy form modules). */
export function FamilyFinancialFormsProvider({
  familyId,
  profile,
  portalMode = false,
  children,
}: FamilyFinancialCenterProps & { children: React.ReactNode }) {
  const action = useActionFeedback({
    verb: "save",
    successToast: "✓ Changes saved.",
    errorToast: "Unable to save.",
    progressLabel: "Saving family financial changes…",
  });
  const account = profile.account;

  const runForm = useCallback(
    (
      e: React.FormEvent<HTMLFormElement>,
      mutate: (fd: FormData) => Promise<unknown>
    ) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      void action.run(async () => {
        const result = await mutate(fd);
        assertActionResult(result);
        return result;
      });
    },
    [action]
  );

  const value = useMemo(
    () => ({ familyId, profile, portalMode, account, action, runForm }),
    [familyId, profile, portalMode, account, action, runForm]
  );

  return (
    <FamilyFinancialFormsContext.Provider value={value}>
      {children}
    </FamilyFinancialFormsContext.Provider>
  );
}
