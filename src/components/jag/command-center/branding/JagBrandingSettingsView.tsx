"use client";

import { useDeferredValue, useMemo, useState, useTransition } from "react";
import {
  restoreOrganizationBrandDefaultsAction,
  saveOrganizationBrandAction,
  uploadBrandAssetAction,
} from "@/lib/jag-command-center/branding";
import type { JagBrandingSettingsWorkspace } from "@/lib/jag-command-center/branding";
import {
  BrandService,
  POWERED_BY_LINE,
  themeToStyle,
  type OrganizationBrand,
} from "@/lib/platform/branding";
import { JagBrandLogoMark, JagBrandPoweredBy } from "./JagBrandChrome";

const FONT_OPTIONS = [
  "Source Serif 4",
  "Fraunces",
  "IBM Plex Sans",
  "DM Sans",
  "Georgia",
] as const;

type Draft = Pick<
  OrganizationBrand,
  | "display_name"
  | "organization_name"
  | "primary_color"
  | "secondary_color"
  | "accent_color"
  | "success_color"
  | "warning_color"
  | "danger_color"
  | "light_logo_url"
  | "dark_logo_url"
  | "favicon_url"
  | "heading_font"
  | "body_font"
  | "login_background_url"
  | "powered_by_enabled"
>;

function toDraft(brand: OrganizationBrand): Draft {
  return {
    display_name: brand.display_name,
    organization_name: brand.organization_name,
    primary_color: brand.primary_color,
    secondary_color: brand.secondary_color,
    accent_color: brand.accent_color,
    success_color: brand.success_color,
    warning_color: brand.warning_color,
    danger_color: brand.danger_color,
    light_logo_url: brand.light_logo_url,
    dark_logo_url: brand.dark_logo_url,
    favicon_url: brand.favicon_url,
    heading_font: brand.heading_font,
    body_font: brand.body_font,
    login_background_url: brand.login_background_url,
    powered_by_enabled: brand.powered_by_enabled,
  };
}

export function JagBrandingSettingsView({
  model,
}: {
  readonly model: JagBrandingSettingsWorkspace;
}) {
  const [organizationId, setOrganizationId] = useState(model.brand.organization_id);
  const [draft, setDraft] = useState<Draft>(() => toDraft(model.brand));
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const deferredDraft = useDeferredValue(draft);

  const previewBrand = useMemo(
    (): OrganizationBrand => ({
      ...model.brand,
      ...deferredDraft,
      organization_id: organizationId,
    }),
    [deferredDraft, model.brand, organizationId]
  );

  const previewTheme = useMemo(
    () => BrandService.previewTheme(previewBrand),
    [previewBrand]
  );

  const patch = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
  };

  const onSave = () => {
    setMessage("");
    startTransition(async () => {
      const result = await saveOrganizationBrandAction(organizationId, draft);
      setMessage(result.ok ? "Brand saved." : result.error);
    });
  };

  const onRestore = () => {
    setMessage("");
    startTransition(async () => {
      const result = await restoreOrganizationBrandDefaultsAction(organizationId);
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setDraft(toDraft(result.brand));
      setMessage("Defaults restored.");
    });
  };

  const onAssetUrl = (
    kind: "light_logo" | "dark_logo" | "favicon" | "login_background",
    url: string
  ) => {
    const field =
      kind === "light_logo"
        ? "light_logo_url"
        : kind === "dark_logo"
          ? "dark_logo_url"
          : kind === "favicon"
            ? "favicon_url"
            : "login_background_url";
    patch(field, url);
    startTransition(async () => {
      await uploadBrandAssetAction({ organizationId, kind, url });
    });
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-[family-name:var(--font-jag-display)] text-2xl font-semibold tracking-tight text-[var(--jag-text)]">
          Branding
        </h1>
        <p className="max-w-2xl text-sm text-[var(--jag-muted)]">
          Customer branding is primary. {POWERED_BY_LINE} remains secondary on
          every tenant experience.
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)]">
        <section className="space-y-5 rounded border border-[var(--jag-border)] bg-[var(--jag-panel)] p-4 md:p-5">
          <label className="block text-xs">
            <span className="text-[var(--jag-muted)]">Organization</span>
            <select
              className="mt-1 w-full rounded border border-[var(--jag-border)] bg-[var(--jag-bg)] px-2 py-1.5 text-sm text-[var(--jag-text)]"
              value={organizationId}
              onChange={(e) => {
                const id = e.target.value;
                setOrganizationId(id);
                const existing = model.brandsByOrganizationId[id];
                if (existing) {
                  setDraft(toDraft(existing));
                  return;
                }
                const match = model.organizations.find((o) => o.id === id);
                if (match) {
                  setDraft((d) => ({
                    ...d,
                    display_name: match.label,
                    organization_name: match.label,
                  }));
                }
              }}
            >
              {model.organizations.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
              {!model.organizations.some((o) => o.id === organizationId) ? (
                <option value={organizationId}>{draft.display_name}</option>
              ) : null}
            </select>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Display name">
              <input
                value={draft.display_name}
                onChange={(e) => patch("display_name", e.target.value)}
                className={fieldClass}
              />
            </Field>
            <Field label="Organization name">
              <input
                value={draft.organization_name}
                onChange={(e) => patch("organization_name", e.target.value)}
                className={fieldClass}
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {(
              [
                ["primary_color", "Primary"],
                ["secondary_color", "Secondary"],
                ["accent_color", "Accent"],
              ] as const
            ).map(([key, label]) => (
              <Field key={key} label={label}>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={normalizeHex(draft[key])}
                    onChange={(e) => patch(key, e.target.value.toUpperCase())}
                    className="h-9 w-10 cursor-pointer rounded border border-[var(--jag-border)] bg-transparent"
                  />
                  <input
                    value={draft[key]}
                    onChange={(e) => patch(key, e.target.value)}
                    className={`${fieldClass} font-mono text-xs`}
                  />
                </div>
              </Field>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Heading font">
              <select
                className={fieldClass}
                value={draft.heading_font}
                onChange={(e) => patch("heading_font", e.target.value)}
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Body font">
              <select
                className={fieldClass}
                value={draft.body_font}
                onChange={(e) => patch("body_font", e.target.value)}
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid gap-3">
            <Field label="Light logo URL">
              <input
                value={draft.light_logo_url}
                onChange={(e) => onAssetUrl("light_logo", e.target.value)}
                placeholder="https://… or data:"
                className={fieldClass}
              />
            </Field>
            <Field label="Dark logo URL">
              <input
                value={draft.dark_logo_url}
                onChange={(e) => onAssetUrl("dark_logo", e.target.value)}
                placeholder="https://… or data:"
                className={fieldClass}
              />
            </Field>
            <Field label="Favicon URL">
              <input
                value={draft.favicon_url}
                onChange={(e) => onAssetUrl("favicon", e.target.value)}
                className={fieldClass}
              />
            </Field>
            <Field label="Login background URL">
              <input
                value={draft.login_background_url}
                onChange={(e) => onAssetUrl("login_background", e.target.value)}
                className={fieldClass}
              />
            </Field>
          </div>

          <label className="flex items-center gap-2 text-sm text-[var(--jag-text)]">
            <input
              type="checkbox"
              checked={draft.powered_by_enabled}
              onChange={(e) => patch("powered_by_enabled", e.target.checked)}
            />
            Show “{POWERED_BY_LINE}”
          </label>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              disabled={pending}
              onClick={onSave}
              className="rounded bg-[var(--brand-accent,#0D9488)] px-3 py-2 text-xs font-medium text-white disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save brand"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={onRestore}
              className="rounded border border-[var(--jag-border)] px-3 py-2 text-xs text-[var(--jag-text)] disabled:opacity-60"
            >
              Restore defaults
            </button>
          </div>
          {message ? (
            <p className="text-xs text-[var(--jag-muted)]" role="status">
              {message}
            </p>
          ) : null}
        </section>

        <aside
          className="space-y-3 rounded border border-[var(--jag-border)] p-4"
          style={themeToStyle(previewTheme)}
        >
          <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--jag-muted)]">
            Live preview
          </p>
          <div
            className="overflow-hidden rounded border border-[var(--jag-border)]"
            style={{
              background: previewBrand.login_background_url
                ? `center/cover no-repeat url("${previewBrand.login_background_url}")`
                : "var(--jag-bg)",
            }}
          >
            <div className="bg-[color-mix(in_srgb,var(--jag-bg)_88%,transparent)] p-5">
              <JagBrandLogoMark brand={previewBrand} dark />
              <h2
                className="mt-3 text-lg font-semibold text-[var(--jag-text)]"
                style={{ fontFamily: "var(--brand-heading-font)" }}
              >
                {previewBrand.display_name}
              </h2>
              <p
                className="mt-1 text-xs text-[var(--jag-muted)]"
                style={{ fontFamily: "var(--brand-body-font)" }}
              >
                {previewTheme.metadata.title}
              </p>
              <button
                type="button"
                className="mt-4 w-full rounded px-3 py-2 text-xs font-medium text-white"
                style={{ background: "var(--brand-accent)" }}
              >
                Sign in
              </button>
              <div className="mt-4">
                <JagBrandPoweredBy brand={previewBrand} />
              </div>
            </div>
          </div>

          <div className="rounded border border-[var(--jag-border)] bg-[var(--jag-bg)] p-3">
            <p className="text-xs font-medium text-[var(--jag-text)]">
              Workspace chrome
            </p>
            <div className="mt-2 flex items-center gap-2 border-b border-[var(--jag-border)] pb-2">
              <JagBrandLogoMark brand={previewBrand} dark className="h-6 max-w-[8rem] object-contain" />
              <span className="text-[10px] text-[var(--jag-muted)]">/</span>
              <span className="truncate text-[11px] text-[var(--jag-muted)]">
                Executive Intelligence
              </span>
            </div>
            <p className="mt-2 text-[11px] text-[var(--jag-muted)]">
              {previewTheme.metadata.title}
            </p>
          </div>

          {model.observations.length > 0 ? (
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--jag-muted)]">
                Recent brand events
              </p>
              <ul className="max-h-40 space-y-1 overflow-y-auto text-[11px] text-[var(--jag-muted)]">
                {model.observations.slice(0, 8).map((o) => (
                  <li key={o.id}>
                    <span className="text-[var(--jag-text)]">{o.kind}</span>
                    {" · "}
                    {o.detail}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

const fieldClass =
  "mt-1 w-full rounded border border-[var(--jag-border)] bg-[var(--jag-bg)] px-2 py-1.5 text-[13px] text-[var(--jag-text)]";

function Field({
  label,
  children,
}: {
  readonly label: string;
  readonly children: React.ReactNode;
}) {
  return (
    <label className="block text-xs">
      <span className="text-[var(--jag-muted)]">{label}</span>
      {children}
    </label>
  );
}

function normalizeHex(value: string): string {
  const v = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(v)) return v;
  return "#0F172A";
}
