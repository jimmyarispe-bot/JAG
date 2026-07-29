import Link from "next/link";
import { PublicContentPage } from "@/components/admissions/experience/PublicContentPage";

export default function AdmissionsSuccessStoriesPage() {
  return (
    <PublicContentPage
      title="Success stories"
      subtitle="Families who moved from inquiry to confident enrollment."
    >
      <blockquote>
        “The application dashboard made every step clear — documents, assessment, and
        offer acceptance in one place.”
      </blockquote>
      <p>
        <Link href="/apply">Begin your story →</Link>
      </p>
    </PublicContentPage>
  );
}
