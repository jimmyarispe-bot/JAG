import { SignOutButton } from "@/components/dashboard/SignOutButton";
import { ImpersonationBanner } from "@/components/platform/ImpersonationBanner";

/**
 * The whole of The JAG, for a teacher.
 *
 * No sidebar, no module list, no tab row, no guide chooser, no notification
 * bell, no search. Their name, a way out, and their week.
 *
 * THE IMPERSONATION BANNER IS NOT OPTIONAL HERE, and it is the one piece
 * somebody would be tempted to strip. If an admin views as a teacher and the
 * banner is gone with the rest of the chrome, they are a teacher with no way
 * back to themselves - and the way back is a server action, so there is no
 * URL to type either. It stays, at the top, above everything.
 *
 * SIGN OUT STAYS TOO. "No option to go anywhere else" is about the product,
 * not about the door. Somebody who cannot leave is not secured, they are
 * trapped, and a shared machine in a staff room makes that somebody else's
 * problem by the afternoon.
 */
export function TeacherOnlyShell({
  fullName,
  impersonation,
  children,
}: {
  fullName: string;
  impersonation: { targetName: string } | null;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      {impersonation ? <ImpersonationBanner targetName={impersonation.targetName} /> : null}

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="m-0 text-sm font-semibold text-slate-900">
              The Academy Way Network of Schools
            </p>
            <p className="m-0 text-xs text-slate-500">{fullName}</p>
          </div>
          <SignOutButton productName="The JAG" />
        </div>
      </header>

      <main className="px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
