import Link from "next/link";

export default function MfaRequiredPage() {
  return (
    <main className="mx-auto mt-24 max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Multi-factor authentication required</h1>
      <p className="mt-3 text-sm text-slate-600">
        Your account has elevated permissions. Complete MFA (or enroll an authenticator) before
        accessing the staff dashboard.
      </p>
      <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-600">
        <li>If you already enrolled MFA, sign in again and complete the second factor.</li>
        <li>
          If you have not enrolled yet, ask your IT administrator to enable MFA for your account
          (TOTP / passkey).
        </li>
      </ul>
      <div className="mt-6 flex gap-3">
        <Link
          href="/login"
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          Return to login
        </Link>
      </div>
    </main>
  );
}
