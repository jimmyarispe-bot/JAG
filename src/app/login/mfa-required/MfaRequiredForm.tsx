"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Mode = "loading" | "enroll" | "challenge" | "error";

function safeNextPath(raw: string | null): string {
  if (!raw) return "/dashboard";
  return raw.startsWith("/") && !raw.startsWith("//") ? raw : "/dashboard";
}

function loginPathForNext(nextPath: string): string {
  return nextPath.startsWith("/jag") ? "/jag/login" : "/login";
}

export default function MfaRequiredForm() {
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));

  const [mode, setMode] = useState<Mode>("loading");
  const [factorId, setFactorId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        const login = loginPathForNext(nextPath);
        window.location.href = `${login}?next=${encodeURIComponent(nextPath)}`;
        return;
      }

      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal?.currentLevel === "aal2") {
        window.location.href = nextPath;
        return;
      }

      const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
      if (cancelled) return;

      if (listError) {
        setMode("error");
        setMessage(listError.message);
        return;
      }

      const verifiedTotp = factors?.totp?.[0];
      if (verifiedTotp) {
        setFactorId(verifiedTotp.id);
        setMode("challenge");
        return;
      }

      // Clear unfinished enrollments so enroll() can succeed
      const unverified = (factors?.all ?? []).filter(
        (f) => f.factor_type === "totp" && f.status !== "verified"
      );
      for (const factor of unverified) {
        await supabase.auth.mfa.unenroll({ factorId: factor.id });
      }

      const { data: enrolled, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Authenticator app",
      });

      if (cancelled) return;

      if (enrollError || !enrolled) {
        setMode("error");
        setMessage(enrollError?.message ?? "Unable to start MFA enrollment.");
        return;
      }

      setFactorId(enrolled.id);
      setQrCode(enrolled.totp.qr_code);
      setSecret(enrolled.totp.secret);
      setMode("enroll");
    })();

    return () => {
      cancelled = true;
    };
  }, [nextPath]);

  const completeAndRedirect = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase.from("user_mfa_settings").upsert({
        user_id: user.id,
        totp_enabled: true,
        preferred_method: "totp",
        updated_at: new Date().toISOString(),
      });
    }

    window.location.href = nextPath;
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    const trimmed = code.replace(/\s/g, "");
    if (!/^\d{6}$/.test(trimmed)) {
      setMessage("Enter the 6-digit code from your authenticator app.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: trimmed,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    await completeAndRedirect();
  };

  if (mode === "loading") {
    return (
      <main className="mx-auto mt-24 max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm text-slate-500">Preparing multi-factor authentication…</p>
      </main>
    );
  }

  if (mode === "error") {
    return (
      <main className="mx-auto mt-24 max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Multi-factor authentication</h1>
        <p className="mt-3 text-sm text-red-600" role="alert" aria-live="polite">
          {message || "Something went wrong."}
        </p>
        <div className="mt-6">
          <Link
            href={loginPathForNext(nextPath)}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            Return to login
          </Link>
        </div>
      </main>
    );
  }

  const isEnroll = mode === "enroll";

  return (
    <main className="mx-auto mt-24 max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">
        {isEnroll ? "Set up multi-factor authentication" : "Verify your identity"}
      </h1>
      <p className="mt-3 text-sm text-slate-600">
        {isEnroll
          ? "Your account has elevated permissions. Scan the QR code with an authenticator app, then enter the 6-digit code to finish setup."
          : "Enter the 6-digit code from your authenticator app to continue."}
      </p>

      {isEnroll && qrCode && (
        <div className="mt-6 flex flex-col items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- Supabase returns an SVG data URL */}
          <img
            src={qrCode}
            alt="Authenticator QR code"
            className="h-48 w-48 rounded-xl border border-slate-200 bg-white p-2"
          />
          {secret && (
            <p className="max-w-full break-all text-center text-xs text-slate-500">
              Can&apos;t scan? Enter this secret manually:{" "}
              <span className="font-mono text-slate-700">{secret}</span>
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleVerify} className="mt-6 space-y-4" aria-label="MFA verification form">
        <div>
          <label htmlFor="mfa-code" className="block text-sm font-medium text-slate-700">
            Authenticator code
          </label>
          <input
            id="mfa-code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9 ]{6,8}"
            maxLength={8}
            required
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm tracking-widest"
            aria-required="true"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !factorId}
          className="w-full rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading
            ? isEnroll
              ? "Verifying…"
              : "Checking…"
            : isEnroll
              ? "Enable and continue"
              : "Verify and continue"}
        </button>
      </form>

      {message && (
        <p className="mt-4 text-sm text-red-600" role="alert" aria-live="polite">
          {message}
        </p>
      )}

      <div className="mt-6">
        <Link
          href={loginPathForNext(nextPath)}
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          Return to login
        </Link>
      </div>
    </main>
  );
}
