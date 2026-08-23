# Subscriber onboarding — blocker before subscriber #2

**Decision (2026-08-23): do not onboard a second subscriber until items 1 and 2 below are done.**

The Academy Way works today because it is a hard-coded seed. Nothing about
that path generalises.

## 1. The brand registry does not persist

`src/lib/platform/branding/BrandRegistry.ts`

```ts
const byOrganizationId = new Map<string, OrganizationBrand>();
const bySubdomain = new Map<string, OrganizationBrand>();
seedDemoBrands();   // The Academy Way, Acme, Signal Centers
```

An in-memory Map, re-seeded at module load. A brand created at runtime survives
until the next deploy or cold start, then disappears. `BrandRegistry.upsert()`
exists and works — it just writes to memory.

**Needed:** an `organization_brands` table plus read/write through it. Everything
else depends on this.

## 2. Organization provisioning does not persist

`provisionOrganization()` behind `POST /api/jag-business/provision` is a
synchronous pilot wizard with the same in-memory shape. It returns an
organizationId, founder, workspace and subscription that are not written
anywhere durable.

**Needed:** persist org, founder invite and subscription in the same migration
pass as item 1.

## 3. Then: one screen to add a subscriber

Name, subdomain, logo, colors, admin email → writes the brand row, creates the
org and its admin, sends the invite. Subscriber visits `theirname.thejag.org`
and signs in. No DNS step, no Vercel step, no deploy.

## 4. Separately: wildcard domain

Adding `*.thejag.org` in Vercel removes the per-subscriber DNS record and the
per-subscriber Vercel domain entry. `extractSubdomainFromHost()` already handles
arbitrary subdomains, so no code changes.

**Constraint:** Vercel issues wildcard certificates only when the domain's
nameservers point at Vercel. `thejag.org` currently uses GoDaddy nameservers,
and those also carry the Resend MX/SPF/DKIM records — so the move needs a
planned cutover, not an ad-hoc change.

## What works today (and why it is not a pattern)

- `academy.thejag.org` resolves because The Academy Way is one of three
  hard-coded seeds in `seedDemoBrands()`
- Its DNS is a hand-added CNAME to `cname.vercel-dns.com`
- Its Vercel domain entry was added by hand

Repeating that by hand for subscriber #2 would work once and then rot on the
next deploy, because of item 1.
