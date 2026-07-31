"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { JAG_INDUSTRIES } from "@/lib/jag-business/industries";
import { JAG_SUBSCRIPTION_PLANS } from "@/lib/jag-business/plans";

type FormState = {
  organizationName: string;
  industry: string;
  country: string;
  timeZone: string;
  planId: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  passwordConfirmation: string;
};

const INITIAL: FormState = {
  organizationName: "",
  industry: "education",
  country: "United States",
  timeZone: "America/New_York",
  planId: "starter",
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  passwordConfirmation: "",
};

export function StartPilotWizard({
  initialPlanId,
}: {
  readonly initialPlanId?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(() => ({
    ...INITIAL,
    planId:
      initialPlanId && JAG_SUBSCRIPTION_PLANS.some((p) => p.id === initialPlanId)
        ? initialPlanId
        : INITIAL.planId,
  }));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const plan = useMemo(
    () => JAG_SUBSCRIPTION_PLANS.find((p) => p.id === form.planId),
    [form.planId]
  );
  const industry = useMemo(
    () => JAG_INDUSTRIES.find((i) => i.id === form.industry),
    [form.industry]
  );

  const update = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async () => {
    setLoading(true);
    setError("");
    setFieldErrors({});
    const response = await fetch("/api/jag-business/provision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const payload = (await response.json()) as {
      ok?: boolean;
      error?: string;
      fieldErrors?: Record<string, string>;
      organizationId?: string;
    };
    setLoading(false);
    if (!response.ok || !payload.ok || !payload.organizationId) {
      setError(payload.error ?? "Provisioning failed.");
      setFieldErrors(payload.fieldErrors ?? {});
      return;
    }
    router.push(`/start/success?org=${encodeURIComponent(payload.organizationId)}`);
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
        Start Your Pilot
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Create your organization and founder account. No payment required for
        the pilot.
      </p>

      <ol className="mt-8 flex gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
        {["Organization", "Founder", "Plan", "Review"].map((label, index) => (
          <li
            key={label}
            className={
              index === step ? "text-slate-900" : index < step ? "text-slate-600" : ""
            }
          >
            {label}
            {index < 3 ? <span className="mx-2 text-slate-300">/</span> : null}
          </li>
        ))}
      </ol>

      <div className="mt-8 space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {step === 0 ? (
          <>
            <Field
              label="Organization Name"
              error={fieldErrors.organizationName}
              value={form.organizationName}
              onChange={(v) => update("organizationName", v)}
            />
            <label className="block text-sm">
              <span className="text-slate-700">Industry</span>
              <select
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                value={form.industry}
                onChange={(e) => update("industry", e.target.value)}
              >
                {JAG_INDUSTRIES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                    {!item.available ? " (product coming soon)" : ""}
                  </option>
                ))}
              </select>
              {fieldErrors.industry ? (
                <span className="mt-1 block text-xs text-red-600">
                  {fieldErrors.industry}
                </span>
              ) : null}
            </label>
            <Field
              label="Country"
              error={fieldErrors.country}
              value={form.country}
              onChange={(v) => update("country", v)}
            />
            <Field
              label="Time Zone"
              error={fieldErrors.timeZone}
              value={form.timeZone}
              onChange={(v) => update("timeZone", v)}
            />
          </>
        ) : null}

        {step === 1 ? (
          <>
            <Field
              label="First Name"
              error={fieldErrors.firstName}
              value={form.firstName}
              onChange={(v) => update("firstName", v)}
            />
            <Field
              label="Last Name"
              error={fieldErrors.lastName}
              value={form.lastName}
              onChange={(v) => update("lastName", v)}
            />
            <Field
              label="Email"
              type="email"
              error={fieldErrors.email}
              value={form.email}
              onChange={(v) => update("email", v)}
            />
            <Field
              label="Password"
              type="password"
              error={fieldErrors.password}
              value={form.password}
              onChange={(v) => update("password", v)}
            />
            <Field
              label="Confirmation"
              type="password"
              error={fieldErrors.passwordConfirmation}
              value={form.passwordConfirmation}
              onChange={(v) => update("passwordConfirmation", v)}
            />
          </>
        ) : null}

        {step === 2 ? (
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-slate-700">
              Subscription
            </legend>
            {JAG_SUBSCRIPTION_PLANS.map((item) => (
              <label
                key={item.id}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 px-4 py-3 hover:bg-slate-50"
              >
                <input
                  type="radio"
                  name="planId"
                  value={item.id}
                  checked={form.planId === item.id}
                  onChange={() => update("planId", item.id)}
                  className="mt-1"
                />
                <span>
                  <span className="block font-medium text-slate-900">
                    {item.name}
                  </span>
                  <span className="block text-sm text-slate-500">
                    {item.tagline} · {item.priceLabel}
                  </span>
                </span>
              </label>
            ))}
            {fieldErrors.planId ? (
              <p className="text-xs text-red-600">{fieldErrors.planId}</p>
            ) : null}
          </fieldset>
        ) : null}

        {step === 3 ? (
          <dl className="space-y-3 text-sm">
            <Row label="Organization" value={form.organizationName || "—"} />
            <Row label="Industry" value={industry?.name ?? form.industry} />
            <Row label="Country" value={form.country} />
            <Row label="Time Zone" value={form.timeZone} />
            <Row
              label="Founder"
              value={`${form.firstName} ${form.lastName}`.trim() || "—"}
            />
            <Row label="Email" value={form.email || "—"} />
            <Row
              label="Subscription"
              value={plan ? `${plan.name} (${plan.priceLabel})` : form.planId}
            />
          </dl>
        ) : null}

        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex justify-between pt-4">
          <button
            type="button"
            disabled={step === 0 || loading}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm disabled:opacity-40"
          >
            Back
          </button>
          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(3, s + 1))}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={onSubmit}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {loading ? "Provisioning…" : "Create organization"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
      />
      {error ? (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      ) : null}
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">{value}</dd>
    </div>
  );
}
