import Link from "next/link";
import { PublicContentPage } from "@/components/admissions/experience/PublicContentPage";

export default function AdmissionsTuitionPage() {
  return (
    <PublicContentPage
      title="Tuition information"
      subtitle="Billing profiles, payment methods, and recurring payments are owned by FinanceEngine — education UI adapts family accounts."
    >
      <p>
        After an enrollment offer is accepted, families set up tuition on the apply
        finance surface and continue in the family portal.
      </p>
      <p>
        <Link href="/apply/portal/finance">Tuition setup</Link>
        {" · "}
        <Link href="/portal/finance">Family portal billing</Link>
      </p>
    </PublicContentPage>
  );
}
