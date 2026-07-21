import dynamic from "next/dynamic";
import { FamilyFinancialFormsProvider } from "@/components/finance/FamilyFinancialFormsContext";
import {
  FamilyFinancialFooterLinks,
  FamilyFinancialKpiSection,
  FamilyFinancialPayersList,
  FamilyFinancialPaymentHistorySection,
  FamilyFinancialPaymentMethodsList,
  FamilyFinancialPaymentPlansCreditsSection,
  FamilyFinancialScholarshipsSection,
  FamilyFinancialStaffInvoicesSection,
  FamilyFinancialStateFundingSection,
} from "@/components/finance/FamilyFinancialSummary";
import type { FamilyFinancialCenterProps } from "@/components/finance/family-financial-types";
import { ListSkeleton } from "@/components/experience-system";

export type { FamilyFinancialCenterProps, FamilyFinancialProfile } from "@/components/finance/family-financial-types";

const FamilyFinancialAddPayerForm = dynamic(
  () =>
    import("@/components/finance/FamilyFinancialStaffFormsIsland").then((m) => ({
      default: m.FamilyFinancialAddPayerForm,
    })),
  { ssr: true }
);
const FamilyFinancialStaffPlanForms = dynamic(
  () =>
    import("@/components/finance/FamilyFinancialStaffFormsIsland").then((m) => ({
      default: m.FamilyFinancialStaffPlanForms,
    })),
  { ssr: true }
);
const FamilyFinancialAccountsReceivableForms = dynamic(
  () =>
    import("@/components/finance/FamilyFinancialStaffFormsIsland").then((m) => ({
      default: m.FamilyFinancialAccountsReceivableForms,
    })),
  { ssr: true }
);
const FamilyFinancialStaffPaymentMethodForms = dynamic(
  () =>
    import("@/components/finance/FamilyFinancialStaffFormsIsland").then((m) => ({
      default: m.FamilyFinancialPaymentMethodForms,
    })),
  { ssr: true }
);

const FamilyFinancialPortalInvoicesSection = dynamic(
  () =>
    import("@/components/finance/FamilyFinancialPortalFormsIsland").then((m) => ({
      default: m.FamilyFinancialPortalInvoicesSection,
    })),
  { ssr: true, loading: () => <ListSkeleton rows={4} label="Loading invoices…" /> }
);
const FamilyFinancialPortalAgreementForms = dynamic(
  () =>
    import("@/components/finance/FamilyFinancialPortalFormsIsland").then((m) => ({
      default: m.FamilyFinancialPortalAgreementForms,
    })),
  { ssr: true }
);
const FamilyFinancialPortalPaymentMethodForms = dynamic(
  () =>
    import("@/components/finance/FamilyFinancialPortalFormsIsland").then((m) => ({
      default: m.FamilyFinancialPaymentMethodForms,
    })),
  { ssr: true }
);

/**
 * P007/P010 — Server Component orchestrator: RSC summary + route-split form islands.
 */
export function FamilyFinancialCenter(props: FamilyFinancialCenterProps) {
  const { portalMode, profile } = props;
  const account = profile.account;

  return (
    <FamilyFinancialFormsProvider {...props}>
      <div className="space-y-8">
        <FamilyFinancialKpiSection {...props} />

        {!portalMode && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <FamilyFinancialPayersList {...props} />
            {account && <FamilyFinancialAddPayerForm />}
          </section>
        )}

        {portalMode ? (
          <FamilyFinancialPortalInvoicesSection />
        ) : (
          <FamilyFinancialStaffInvoicesSection {...props} />
        )}

        <FamilyFinancialPaymentHistorySection {...props} />
        <FamilyFinancialScholarshipsSection {...props} />
        <FamilyFinancialStateFundingSection {...props} />

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <FamilyFinancialPaymentMethodsList {...props} />
            {account &&
              (portalMode ? (
                <FamilyFinancialPortalPaymentMethodForms />
              ) : (
                <FamilyFinancialStaffPaymentMethodForms />
              ))}
          </div>
          <FamilyFinancialPaymentPlansCreditsSection {...props} />
        </section>

        {portalMode ? (
          <FamilyFinancialPortalAgreementForms />
        ) : (
          <>
            <FamilyFinancialStaffPlanForms />
            <FamilyFinancialAccountsReceivableForms />
          </>
        )}
        <FamilyFinancialFooterLinks portalMode={portalMode} />
      </div>
    </FamilyFinancialFormsProvider>
  );
}
