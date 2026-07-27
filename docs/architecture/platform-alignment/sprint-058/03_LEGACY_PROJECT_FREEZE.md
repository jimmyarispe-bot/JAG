# Legacy Vercel project freeze

**Goal:** No non-canonical Vercel project serves Tenant #1 (or casual “the app” bookmarks).

Canonical project remains **`academy-os`**.

---

## 1. Projects to freeze

| Project | Production URL (do not use) | Reason |
|---------|----------------------------|--------|
| `the-jag-platform-jimmy` | `https://the-jag-platform-jimmy.vercel.app` | Redeployed ancient `main` (`e7f6a66`) — Education ERP shell |
| `the-jag-platform-2026` | `https://the-jag-platform-2026.vercel.app` | Former local CLI link; duplicate of same monorepo |
| `the-jag-platform` | `https://the-jag-platform.vercel.app` | Legacy duplicate |

Out of scope: `micms-vision-presentation` (unrelated deck).

---

## 2. Operator checklist (Vercel Dashboard)

Complete **for each** frozen project:

### A. Stop Git-driven deploys

1. Open project → **Settings → Git**.  
2. **Disconnect** the Git repository (or disable automatic deployments for all branches).  
3. Confirm no new deployments appear after a test push to `JAG` (push should only build **`academy-os`**).

### B. Stop serving users

Pick one (strongest first):

1. **Password protection** — Settings → Deployment Protection → enable password (or SSO) for all deployments.  
2. **Remove Production domain / aliases** — ensure no custom domain points here.  
3. **Delete project** — only after confirming no DNS or bookmarks remain (irreversible).

### C. Communicate

1. Update internal bookmarks to `https://academy-os-lac.vercel.app`.  
2. Announce in eng/ops channel: legacy URLs are frozen.

### D. Verify

| Check | Expect |
|-------|--------|
| Open legacy Production URL | Password wall, 404, or project gone — **not** a usable AcademyOS/JAG login without gate |
| Open `academy-os-lac.vercel.app` | Tenant #1 app (RC1) still works |
| Push to `release/v1.0.0-rc1` | New deployment only under **`academy-os`** |

---

## 3. CLI notes

- Local repo is linked to `academy-os` via `.vercel/project.json`.  
- Do **not** run `vercel link` to a frozen project.  
- Password protection / Git disconnect for other projects is most reliably done in the Dashboard (plan/permission dependent in CLI).

---

## 4. Sprint 058 exit for this doc

### A. Git disconnect — verified 2026-07-26

CLI check (`vercel link` → `vercel git disconnect`) for each project returned:

**`Error: No Git repository connected.`**

| Project | Git auto-deploy |
|---------|-----------------|
| `the-jag-platform-jimmy` | ✅ None (already disconnected) |
| `the-jag-platform` | ✅ None (already disconnected) |
| `the-jag-platform-2026` | ✅ None (already disconnected) |

Local `.vercel` restored to canonical **`academy-os`**.

### Remaining optional (not required to close Sprint 058 Git freeze)

| Item | Owner |
|------|--------|
| B. Password-protect or remove public Production URLs on legacy projects | Operator (recommended) |
| C. Update bookmarks to `academy-os-lac.vercel.app` | Operator |
| D. Announce freeze | Operator |

**Sprint 058 Git-freeze criterion:** ✅ complete — legacy projects cannot automatically deploy from Git.
