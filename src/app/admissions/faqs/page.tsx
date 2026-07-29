import Link from "next/link";
import { PublicContentPage } from "@/components/admissions/experience/PublicContentPage";

const FAQS = [
  {
    q: "How do I start?",
    a: "Submit the Interest Form. A CRM lead is created automatically with confirmation and staff notification.",
  },
  {
    q: "Can I save an application draft?",
    a: "Yes. The online application wizard autosaves drafts before you submit.",
  },
  {
    q: "Where do documents go?",
    a: "Uploads register in Admissions and store content in KnowledgeEngine with Evidence Ledger linkage.",
  },
  {
    q: "How do scholarships work?",
    a: "Complete the scholarship section in your application and track status from the dashboard.",
  },
];

export default function AdmissionsFaqsPage() {
  return (
    <PublicContentPage
      title="FAQs"
      subtitle="Common questions about the admissions journey."
    >
      <dl className="not-prose space-y-6">
        {FAQS.map((item) => (
          <div key={item.q}>
            <dt className="font-semibold text-slate-900">{item.q}</dt>
            <dd className="mt-1 text-slate-600">{item.a}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-8">
        <Link href="/admissions/contact">Still need help? Contact admissions →</Link>
      </p>
    </PublicContentPage>
  );
}
