import { Suspense } from "react";
import ForgotPasswordForm from "./ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto mt-24 max-w-md p-8 text-center text-slate-500">Loading…</main>
      }
    >
      <ForgotPasswordForm />
    </Suspense>
  );
}
