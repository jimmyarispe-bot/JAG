import Link from "next/link";
import { PublicContentPage } from "@/components/admissions/experience/PublicContentPage";

export default function AdmissionsScholarshipsPage() {
  return (
    <PublicContentPage
      title="Scholarship information"
      subtitle="Apply for aid inside the application portal. Awards and funding sources track through Finance and Admissions CRM."
    >
      <ol>
        <li>Indicate scholarship interest on the Interest Form or wizard.</li>
        <li>Complete the financial aid section in your application dashboard.</li>
        <li>Upload supporting documents (KnowledgeEngine storage).</li>
        <li>Track status and awards with admissions staff.</li>
      </ol>
      <p>
        <Link href="/apply/portal">Open application dashboard</Link>
        {" · "}
        <Link href="/dashboard/scholarships">Staff scholarship review</Link>
      </p>
    </PublicContentPage>
  );
}
