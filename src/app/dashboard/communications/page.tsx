import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { CommunicationsDashboard } from "@/components/communications/CommunicationsDashboard";
import { getIdentityContext } from "@/lib/platform/identity/context";
import {
  canComposeCommunications,
  canViewCommunications,
  listCommunications,
  normalizeCommunicationFilter,
} from "@/lib/communications";
import type { CommunicationType } from "@/lib/communications/types";

interface PageProps {
  searchParams: Promise<{
    filter?: string;
    search?: string;
    type?: string;
    page?: string;
    studentId?: string;
    familyId?: string;
  }>;
}

export default async function CommunicationsPage({ searchParams }: PageProps) {
  const identity = await getIdentityContext();
  if (!canViewCommunications(identity)) {
    redirect("/dashboard");
  }

  const sp = await searchParams;
  const filter = normalizeCommunicationFilter(sp.filter);
  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const type =
    sp.type &&
    ["email", "sms", "portal", "call", "meeting", "announcement", "notification", "reminder"].includes(
      sp.type
    )
      ? (sp.type as CommunicationType)
      : "all";

  const result = await listCommunications({
    filter,
    search: sp.search ?? "",
    type,
    page,
    pageSize: 25,
    studentId: sp.studentId,
    familyId: sp.familyId,
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <PageHeader
        title="Communications"
        subtitle="Centralized email, SMS, portal, calls, meetings, and announcements"
        actions={
          canComposeCommunications(identity) ? (
            <div className="flex flex-wrap gap-2">
              <Link
                href="/dashboard/communications/compose"
                className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                Compose
              </Link>
              <Link
                href="/dashboard/communications/templates"
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Templates
              </Link>
            </div>
          ) : undefined
        }
      />
      <Suspense fallback={<p className="text-sm text-slate-500">Loading communications…</p>}>
        <CommunicationsDashboard
          rows={result.rows}
          total={result.total}
          page={result.page}
          pageSize={result.pageSize}
          filter={filter}
          search={sp.search ?? ""}
          typeFilter={type}
          canCompose={canComposeCommunications(identity)}
        />
      </Suspense>
    </div>
  );
}
