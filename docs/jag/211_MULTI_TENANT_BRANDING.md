# Sprint 211 — Multi-Tenant Branding & Organization Identity

**Scope:** Application layer only. Does not modify JAG Core or intelligence engines.  
**Goal:** Every subscribing organization receives its own Executive Intelligence Platform experience, clearly **Powered by The JAG™**.

---

## 1. Brand architecture

First-class package:

```
src/lib/platform/branding/
  BrandRegistry.ts      # In-memory tenant brand records (+ demo seeds)
  BrandService.ts       # Façade: resolve, update, restore, theme, footers
  BrandResolver.ts      # Host / subdomain / org-id resolution
  ThemeEngine.ts        # CSS variables, Tailwind tokens, metadata, manifest
  LogoService.ts        # Light / dark / favicon / app icon accessors
  TypographyService.ts  # Heading + body font stacks
  AssetService.ts       # Asset URL store synced into brand rows
  BrandDocuments.ts     # Email + PDF chrome builders
  BrandObservability.ts # brand_update, theme_generation, asset_change, …
  defaults.ts / types.ts / index.ts
```

Command Center adapters:

```
src/lib/jag-command-center/branding/
  load-branding.ts   # Session / host loaders + settings workspace
  actions.ts         # Save / restore / asset upload (server actions)
  documents.ts       # brandEmailForOrganization / brandPdfForOrganization
```

Persistence schema: `supabase/migrations/211_organization_branding.sql`  
(`organization_branding` table with colors, logos, fonts, backgrounds, footers, `powered_by_enabled`).

---

## 2. Theme engine

`ThemeEngine.generateTheme(brand)` (and pure `buildTheme` for live preview) produces:

| Output | Purpose |
|--------|---------|
| CSS variables | `--brand-*`, `--jag-*` applied on `/jag` layout |
| Tailwind tokens | `themeToTailwindTokens` for programmatic use |
| Metadata | Page title + description |
| Icons | Light/dark logo, favicon, app icon |
| Manifest | `themeToManifest` for install / PWA fragment |

Shell, login, and settings preview consume the same variable set — preview updates instantly via React state + `themeToStyle` (no full page refresh).

---

## 3. Asset model

Asset kinds: `light_logo`, `dark_logo`, `favicon`, `app_icon`, `login_background`, `dashboard_background`.

`AssetService.setAsset` stores the URL and syncs the matching field on the brand record. Settings UI accepts URL / data URLs (upload pipeline can replace URL inputs later without changing the brand contract).

---

## 4. Subdomain model

Every organization receives:

`{subdomain}.thejag.org`

Examples: `academy.thejag.org`, `acme.thejag.org`, `signalcenters.thejag.org`.

Resolution:

1. Host subdomain on `thejag.org`
2. Localhost helpers: `?subdomain=`, `?org=`, or `{sub}.localhost`
3. Explicit `organizationId` fallback
4. Platform default (`The JAG™`)

**Custom domains are reserved** via `BrandResolver.resolveFromCustomDomain` (returns `null` this sprint).

Demo seeds: The Academy Way (`academy`), Acme Industries (`acme`), Signal Centers (`signalcenters`).

---

## 5. Surfaces

| Surface | Behavior |
|---------|----------|
| `/jag/login` | Org logo, colors, name, background, Powered by The JAG™ |
| Executive workspace | Logo, colors, fonts, page title on shell |
| `/jag/settings/branding` | Edit + live preview + restore defaults |
| Emails | `buildBrandedEmail` / notification footer |
| PDF / print briefings | Org logo, colors, footer, Powered by The JAG™ |

Page title pattern:

`{display_name} Executive Intelligence Platform`

---

## 6. Brand standards

- Customer branding is always **primary**.
- The JAG™ is always **secondary**.
- Never display bare “JAG” as the product mark.
- Always use **The JAG™** / **Powered by The JAG™**.

---

## 7. Observability

`BrandObservability` records:

- `brand_update`
- `theme_generation`
- `asset_change`
- `logo_upload`
- `preview_generation` (opt-in)

Recent events appear on the branding settings page.

---

## 8. Success criteria

Every tenant feels like their own Executive Intelligence Platform while remaining clearly **Powered by The JAG™**.
