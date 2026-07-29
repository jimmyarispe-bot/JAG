import Link from "next/link";
import { PublicContentPage } from "@/components/admissions/experience/PublicContentPage";

export default function AdmissionsVirtualPage() {
  return (
    <PublicContentPage
      title="Virtual programs"
      subtitle="Participate online with the same admissions journey — discovery calls, assessments, and enrollment offers."
    >
      <p>
        Virtual options use the same Interest Form, CRM pipeline, Knowledge document
        center, and Finance tuition setup as campus programs.
      </p>
      <p>
        <Link href="/admissions/discovery-call">Book a virtual discovery call</Link>
        {" · "}
        <Link href="/apply">Submit an interest form</Link>
      </p>
    </PublicContentPage>
  );
}
