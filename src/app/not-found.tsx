import Link from "next/link";

/**
 * Sprint 210 — root 404. User-facing recovery without stack traces.
 */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium tracking-wide text-neutral-500">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-neutral-900">
        Page not found
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-neutral-600">
        This page does not exist or is no longer available. Check the address or
        return to a known workspace.
      </p>
      <div className="mt-8 flex flex-wrap gap-3 text-sm">
        <Link
          href="/login"
          className="rounded border border-neutral-300 px-3 py-1.5 text-neutral-800 hover:bg-neutral-50"
        >
          Sign in
        </Link>
        <Link
          href="/jag"
          className="rounded border border-neutral-300 px-3 py-1.5 text-neutral-800 hover:bg-neutral-50"
        >
          The JAG™
        </Link>
        <Link
          href="/dashboard"
          className="rounded border border-neutral-300 px-3 py-1.5 text-neutral-800 hover:bg-neutral-50"
        >
          Dashboard
        </Link>
      </div>
    </main>
  );
}
