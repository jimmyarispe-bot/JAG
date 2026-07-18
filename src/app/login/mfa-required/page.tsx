import { Suspense } from "react";
import MfaRequiredForm from "./MfaRequiredForm";

export default function MfaRequiredPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto mt-24 max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm text-slate-500">Loading…</p>
        </main>
      }
    >
      <MfaRequiredForm />
    </Suspense>
  );
}
