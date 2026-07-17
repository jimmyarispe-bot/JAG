# UX Inventory — Phase D

**Surfaces:** ~266 `page.tsx` routes under `src/app/`  
**Mobile native app:** None (responsive web only)

---

## Surface map

| Surface | Path | Primary users | Shell |
|---------|------|---------------|-------|
| Public entry | `/` → `/login` | All | Root |
| Auth | `/login`, `/login/reset-required` | All | — |
| Admissions public | `/apply`, `/apply/thank-you` | Prospects | `ApplyShell` |
| Admissions portal | `/apply/portal/*` | Guardians | `ApplyShell` |
| Family portal | `/portal/*` | Parents, students | `PortalShell` |
| Staff ERP | `/dashboard/*` | Teachers, leaders, finance, HR, admin | `DashboardShell` |
| Exec / JAG | `/exec/*` | Founder/CEO (`JAG_ACCESS`) | `ExecShell` |
| Cloud console | `/cloud/*` | Cloud employees | `CloudShell` |
| Operations | `/operations/*` | Ops center | `OpsShell` |
| Org platform | `/platform`, `/organizations`, `/users`, `/settings` | Platform admin | `OrgAdminShell` |
| Presentation | `/presentation/micms-leadership/*` | Public deck | Presentation layout |
| Design showcase | `/dashboard/workspace-design-system` | Internal | Dashboard |

---

## Module inventory (staff ERP)

| Domain | Entry | User goals | Primary workflows | Pain / friction |
|--------|-------|------------|-------------------|-----------------|
| Home / founder brief | `/dashboard` | Situational awareness | Morning scan → deep links | Dense founder IA |
| Admissions CRM | `/dashboard/admissions` | Convert leads | Lead → case → decision | Tab + query-param complexity |
| SIS / students | `/dashboard/students` | Maintain student records | Search → profile → tabs | Table-heavy on mobile |
| Scheduling | `/dashboard/scheduling` | Build/maintain schedules | Grid/tabs CRUD | Density / conflict UX TBD |
| Attendance | (via students/scheduling) | Take/review attendance | Daily/period entry | Product gaps from prior epics |
| Teacher workspace | `/dashboard/teacher` | Daily instruction work | Queue → session → student | Depends on A.1 perm fix |
| SpEd | **No dedicated route tree found** | Case management | — | **Critical product/UX gap** |
| Scholarships | `/dashboard/scholarships` | Award/manage aid | List → detail | — |
| Finance | `/dashboard/finance` | Bill, collect, report | Tabs + family accounts | Sensitive surfaces; density |
| HR / workforce | `/dashboard/hr` | Hire, leave, payroll UI | Tabs + employee profile | Forms a11y weak |
| Employee self-service | `/dashboard/employee` | Self leave/onboarding | Forms | Ownership binding (security) |
| Executive intel | `/dashboard/executive/*` | Strategy KPIs | Many subpages | Overlapping with `/exec` |
| Mission control | `/dashboard/mission-control` | Ops alerts | Queue triage | — |
| Platform admin | `/dashboard/admin/*` | Configure tenants | Hub grid | High cognitive load |
| Config studio | `/dashboard/admin/configuration/*` | Org setup | Long wizard-like nav | Length / discoverability |
| Data / AI / network / integrations / cert | `/dashboard/data|intelligence|network|integrations|certification` | Platform ops | Deep trees | Founder-only cognitive load |
| Work / tasks | `/dashboard/work` | Task management | Tabs | — |
| Search / prefs | `/dashboard/search`, `/dashboard/settings/preferences` | Find / customize | — | — |

---

## Portal inventory

| Mode | Nav (evidence: `PortalShell.tsx`) | Goals | Friction |
|------|-----------------------------------|-------|----------|
| Parent | Home, Messages, Calendar, Progress, Documents, Finance, Conferences, Forms, Portfolio, Notifications, Engagement | Stay informed, pay, communicate | Many items; horizontal scroll nav |
| Student | My Day, Schedule, Goals, Messages | Self schedule/goals | Thin vs parent; messages may be limited |

Portal a11y bar: high contrast, large text, reduce motion (`PortalAccessibilityBar.tsx`) — **not** mirrored on staff dashboard.

---

## Exec inventory

Phase 1 routes exist (`/exec`, brief, health, wisdom, opportunities, risks, integrations, ask).  
Phase 2 listed in `EXEC_NAV` (`finance`, `workforce`, `customers`, `predictive`, `actions`, `timeline`; `graph` marked phase 2 but page exists as placeholder) — **dead or incomplete nav risk**.

---

## Navigation config sources

`src/lib/dashboard/navigation.ts`, `founders-navigation.ts`, `executive-director-dashboard.ts`, `src/lib/exec/navigation.ts`, cloud/ops/EDP/AIP/AIN/IHUB/CERT type navs, `PortalShell`, experience-system shells.

---

## Design system inventory

| Layer | Path |
|-------|------|
| Tokens | `globals.css`, `workspace-design-system/tokens.ts` |
| WDS | `src/components/workspace-design-system/` |
| XES | `src/components/experience-system/` |
| UI primitives | `src/components/ui/` (small set) |
| Branding | `src/lib/branding/` |

Contract note: `PLATFORM_CONTRACT.md` — **Partial (a11y primitives)**.
