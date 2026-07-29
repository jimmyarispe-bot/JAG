import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { PARENT_SUPPORT_LINKS } from "@/lib/portal/experience/constants";
import { SupportTicketForm } from "@/components/portal/experience/SupportTicketForm";

export default async function ParentSupportPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/login?next=/portal/support");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Support</h1>
        <p className="mt-1 text-slate-600">
          Help, FAQs, tickets, and ways to contact school — orchestrated over messaging and
          conferences, not a parallel support engine.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2">
        {PARENT_SUPPORT_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 hover:border-slate-300"
          >
            {l.label}
          </Link>
        ))}
      </section>

      <section id="faqs" className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-900">FAQs</h2>
        <dl className="mt-3 space-y-3 text-sm">
          <div>
            <dt className="font-medium">Where do I pay tuition?</dt>
            <dd className="text-slate-600">
              Use <Link href="/portal/billing" className="underline">Billing</Link> — FinanceEngine.
            </dd>
          </div>
          <div>
            <dt className="font-medium">Where are IEPs and report cards?</dt>
            <dd className="text-slate-600">
              <Link href="/portal/documents" className="underline">Documents</Link> via KnowledgeEngine.
            </dd>
          </div>
          <div>
            <dt className="font-medium">How do I see mastery progress?</dt>
            <dd className="text-slate-600">
              <Link href="/portal/learning" className="underline">Learning</Link> uses Learning Intelligence.
            </dd>
          </div>
        </dl>
      </section>

      <section id="tickets">
        <SupportTicketForm
          organizationId="default"
          userId={sessionUser.id}
        />
      </section>
    </div>
  );
}
