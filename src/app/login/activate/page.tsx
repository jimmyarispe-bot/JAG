import { Suspense } from "react";
import ActivateAccountForm from "./ActivateAccountForm";

export default function ActivateAccountPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto mt-24 max-w-md p-8 text-center text-slate-500">Loading…</main>
      }
    >
      <ActivateAccountForm />
    </Suspense>
  );
}
