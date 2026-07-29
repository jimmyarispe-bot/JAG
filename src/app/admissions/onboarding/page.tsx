import Link from "next/link";
import { AdmissionsPublicShell } from "@/components/admissions/experience/AdmissionsPublicShell";
import { PARENT_ONBOARDING_CHECKLIST } from "@/lib/admissions/experience/constants";

export default function ParentOnboardingPage() {
  return (
    <AdmissionsPublicShell
      title="Parent onboarding"
      subtitle="Activate your account, complete required forms, and join the family portal welcome sequence."
    >
      <ol className="space-y-3">
        {PARENT_ONBOARDING_CHECKLIST.map((item, index) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 hover:border-slate-300"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-medium text-white">
                {index + 1}
              </span>
              <span className="font-medium text-slate-900">{item.label}</span>
            </Link>
          </li>
        ))}
      </ol>
    </AdmissionsPublicShell>
  );
}
