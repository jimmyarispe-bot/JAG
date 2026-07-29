import Link from "next/link";
import { PublicContentPage } from "@/components/admissions/experience/PublicContentPage";

export default function AdmissionsContactPage() {
  return (
    <PublicContentPage
      title="Contact"
      subtitle="Reach admissions or start the formal inquiry workflow."
    >
      <p>
        For the fastest response, submit the Interest Form so your request lands in the
        CRM pipeline with confirmation email and internal notification.
      </p>
      <p>
        <Link href="/apply">Interest form</Link>
        {" · "}
        <Link href="/admissions/discovery-call">Discovery call</Link>
        {" · "}
        <Link href="/contact">General contact</Link>
      </p>
    </PublicContentPage>
  );
}
