# Production Domain + Branding Reconciliation

Date: 2026-08-01
Branch: `release/ga-certification`
Canonical production origin: `https://www.thejag.org`
Apex: `https://thejag.org` (edge redirect to www)

## 1. Executive summary

DNS/HTTPS for `thejag.org` / `www.thejag.org` were already working. The public entry incorrectly routed visitors to AcademyOS `/login`, which falls back to generic "School Platform" branding when no organization context exists. This reconciliation restores The JAG product identity at the platform apex without renaming or collapsing the AcademyOS product boundary.

## 2. Root cause of incorrect login branding

| Layer | Behavior |
|---|---|
| `src/app/page.tsx` (committed) | Unconditionally `redirect("/login")` |
| `/login` | AcademyOS school-app sign-in via `loadOrganizationBranding` |
| Org resolution (anonymous) | No host passed; fallback organization name "School Platform" |
| `LoginForm` | Hard-coded subtitle "Staff dashboard and parent application portal" |
| Root `layout` metadata | Default title "School Platform" |

JAG platform login already existed at `/jag/login` with `BrandService` / `THE_JAG_MARK` ("The JAG"). Production never reached it from `/`.

## 3. Product-boundary determination

| Question | Answer |
|---|---|
| Is `/login` shared by JAG and AcademyOS? | No. `/login` = AcademyOS/Supabase school app. `/jag/login` = JAG Platform Portal (separate cookie). |
| Hostname branding? | Yes for JAG (`BrandResolver` / `*.thejag.org`). Not used by AcademyOS `loadOrganizationBranding`. |
| Tenant branding? | JAG tenants via subdomain registry; AcademyOS via org DB / OrganizationService. |
| Hard-coded? | Legacy school copy was hard-coded on AcademyOS login + root metadata. |
| Existing resolver? | Use `@/lib/platform/branding` (`THE_JAG_MARK`, `BrandService`, `DEFAULT_ROOT_DOMAIN`). |
| Routes on thejag.org | Marketing (`/`), `/jag/*` platform portal, AcademyOS surfaces under `/dashboard`, `/portal`, `/login` (non-apex / deep links). |

Boundary rule: AcademyOS remains a product on The JAG. Do not rename AcademyOS to JAG. Apex/www present The JAG; AcademyOS keeps its own login and authorization.

## 4. Files changed

- Deleted committed root redirect: `src/app/page.tsx` (marketing `(marketing)/page.tsx` serves `/`)
- `src/app/layout.tsx` — The JAG metadata + metadataBase
- `src/app/login/page.tsx` — apex host to `/jag/login`
- `src/app/login/LoginForm.tsx` — use `branding.productTagline`
- `src/lib/platform/branding/{types,BrandResolver,index}.ts` — `CANONICAL_JAG_PRODUCTION_ORIGIN`, `isJagPlatformApexHost`
- `src/lib/platform/auth-email/links.ts` — document canonical origin; `isCanonicalJagProductionAppUrl`
- `src/lib/platform/env/schema.ts` — `NEXT_PUBLIC_APP_URL` production guidance
- `tests/unit/platform/branding/production-domain.test.ts`
- `PRODUCTION_DOMAIN_BRANDING_RECONCILIATION.md`

## 5. Branding changes

| Surface | Before | After |
|---|---|---|
| `/` on production | Redirect to AcademyOS login | JAG marketing home ("The JAG") |
| `/login` on `thejag.org` / `www` | "School Platform" + school subtitle | Redirect to `/jag/login` (The JAG EIP) |
| `/login` on localhost / preview / tenants | School form | Still AcademyOS; subtitle from `productTagline` |
| Root document title | School Platform | The JAG |
| `/jag/login` | Already correct | Unchanged |

## 6. Canonical URL strategy

- Authoritative env: `NEXT_PUBLIC_APP_URL`
- Fallback: `NEXT_PUBLIC_SITE_URL` then `http://localhost:3000`
- Constant: `CANONICAL_JAG_PRODUCTION_ORIGIN = "https://www.thejag.org"` (docs/validation; not sprayed into every call site)
- Production operator setting: `NEXT_PUBLIC_APP_URL=https://www.thejag.org`

## 7. Authentication URL audit

| Flow | Construction | Notes |
|---|---|---|
| Auth email callbacks | `resolveAuthAppUrl()` + `/auth/callback` | Env-driven |
| Invites / recovery | Same | Must allow-list www origin in Supabase |
| AcademyOS login link | `{appUrl}/login` | On apex, `/login` now redirects to `/jag/login`; school deep-links under `/login/*` remain |
| JAG platform login | `/jag/login` + platform cookie | Separate from Supabase school session |
| OAuth connectors | `NEXT_PUBLIC_APP_URL` | Unchanged |

No secrets modified.

## 8. Supabase configuration requirements (manual)

In Supabase Auth URL configuration, ensure:

Site URL:

- `https://www.thejag.org`

Redirect URLs (add as needed by this app):

- `https://www.thejag.org/auth/callback`
- `https://www.thejag.org/**` (if project uses wildcard allow-list)
- Optionally apex equivalents if any client still hits apex before redirect:
  - `https://thejag.org/auth/callback`
  - `https://thejag.org/**`

Critical app paths: `/auth/callback`, `/login`, `/login/mfa-required`, `/login/reset-required`, `/login/activate`, `/login/forgot`.

Do not remove existing preview/localhost allow-list entries required for development.

## 9. Vercel configuration requirements (manual)

1. Production domain: `www.thejag.org` (apex redirect already confirmed).
2. Env Production: `NEXT_PUBLIC_APP_URL=https://www.thejag.org`
3. Preview: keep preview-specific `NEXT_PUBLIC_APP_URL` so auth links stay on the preview host.
4. Redeploy after env change.

This reconciliation does not mutate Vercel remotely.

## 10. Access-control verification

| Control | Status |
|---|---|
| Middleware `/jag/*` to JAG platform cookie to `/jag/login` | Unchanged |
| Middleware AcademyOS protected routes to Supabase to `/login` | Unchanged (non-apex still serves AcademyOS login) |
| RLS / IAM / role guards | Not weakened |
| Branding is not authorization | Apex redirect is identity routing only |

No auth bypasses introduced.

## 11. Tests added/updated

- `tests/unit/platform/branding/production-domain.test.ts`
  - Apex host detection
  - Tenant/localhost exclusion
  - Platform brand is not School Platform
  - AcademyOS tagline is not legacy school subtitle
  - `NEXT_PUBLIC_APP_URL` / localhost resolution

## 12. Validation results

Recorded at commit time:

- Focused vitest: production-domain + related branding/auth tests
- `npx tsc --noEmit`
- `npm run build` (must exit 0)

## 13. Remaining intentional AcademyOS / legacy references

| Occurrence | Classification | Why retained |
|---|---|---|
| `School Platform` in org resolver / `buildFallbackBranding` / `BrandingContext` | B/C — AcademyOS org fallback | Unconfigured school tenant label; not JAG apex path |
| CloudNav / OpsNav "School Platform" back-links | B — AcademyOS ops chrome | Back-link into school dashboard |
| Docs mentioning School Platform fallback | E — documentation | Historical / architecture notes |
| `AcademyOS` product strings / packages | B — correct | Legitimate product boundary |
| `Education Operating System` tagline | B — AcademyOS default tagline | Used when AcademyOS login renders |

## 14. Manual production steps still required

1. Set Vercel Production `NEXT_PUBLIC_APP_URL=https://www.thejag.org` if not already.
2. Update Supabase Site URL + Redirect URLs (section 8).
3. Redeploy current release branch.
4. Smoke: `https://thejag.org` to www marketing; Sign in to `/jag/login` shows The JAG; AcademyOS `/dashboard` auth still gated.

## 15. Final production readiness verdict

Code readiness: YES for product-identity entry on thejag.org, provided Vercel + Supabase URL settings match sections 8-9.

Not claimed: full GA of every AcademyOS module, or remote dashboard configuration already applied.
