"use client";

import Link from "next/link";
import { useBranding } from "@/components/branding/BrandingContext";
import { OrganizationName } from "@/components/branding/OrganizationName";

export function ApplyShell({
  children,
  userEmail,
  organizationName,
  showNav = true,
}: {
  children: React.ReactNode;
  userEmail?: string | null;
  /**
   * The school network's own name, resolved server-side.
   *
   * `useBranding()` alone is not enough here: this layout loads branding with
   * the anon client, which cannot read the organization record, so it falls
   * back to the generic "School Platform" — and a parent following an
   * admissions link should land on their school's name, not a placeholder.
   * The page resolves the organization properly (service role) and passes it
   * down. Branding stays the fallback for the pages that have no organization
   * in hand, such as the thank-you screen.
   */
  organizationName?: string | null;
  /**
   * The inquiry form turns this off.
   *
   * A family filling in an enquiry has no account, so every link in this bar
   * leads either to a sign-in wall or to a part of the product that is not
   * theirs yet. Offering six of them at the top of the one page we want them
   * to finish is a way to lose them before they finish it. The portal keeps
   * its navigation, because there the links go somewhere the family can use.
   */
  showNav?: boolean;
}) {
  const branding = useBranding();
  const name = organizationName?.trim() || branding.productName;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            {showNav ? (
              <Link href="/apply" className="text-lg font-bold">
                <OrganizationName name={name} />
              </Link>
            ) : (
              <OrganizationName name={name} className="text-lg font-bold" />
            )}
            <p className="text-xs text-slate-500">Admissions Inquiry Platform</p>
          </div>
          {showNav && (
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/admissions" className="text-slate-600 hover:text-slate-900">
              Admissions
            </Link>
            <Link href="/apply" className="text-slate-600 hover:text-slate-900">
              Inquiry
            </Link>
            <Link href="/apply/portal" className="text-slate-600 hover:text-slate-900">
              My Applications
            </Link>
            <Link href="/apply/portal/finance" className="text-slate-600 hover:text-slate-900">
              Billing
            </Link>
            <Link href="/admissions/onboarding" className="text-slate-600 hover:text-slate-900">
              Onboarding
            </Link>
            <Link href="/portal" className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700">
              Family Portal
            </Link>
            {userEmail ? (
              <span className="hidden rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 sm:inline">
                {userEmail}
              </span>
            ) : (
              <Link
                href="/login"
                className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
              >
                Sign In
              </Link>
            )}
          </nav>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
