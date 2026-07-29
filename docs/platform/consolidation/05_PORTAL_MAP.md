# 05 — Portal Map

Portals are **Education Domain UX** on shared Identity, Notifications, Knowledge, Finance, and Workflow engines.

---

## A. Public website

| Portal | Routes | Audience | Primary engines |
|--------|--------|----------|-----------------|
| Marketing site | `/(marketing)/**` | Visitors | Branding |
| Auth | `/login/**`, `/auth/callback` | All users | Identity |
| Apply | `/apply/**` | Prospective parents / applicants | Admissions, Workflow, Knowledge, Finance |

## B. Family / parent portal

| Area | Routes | Capabilities |
|------|--------|--------------|
| Home | `/portal` | Hub, student switcher |
| Academics | `/portal/progress`, `/portfolio`, `/student/**` | Progress, goals, schedule, portfolio |
| Ops | `/portal/calendar`, `/conferences`, `/forms` | Calendar, conferences, forms |
| Comms | `/portal/messages`, `/notifications`, `/engagement` | Messaging, alerts |
| Money | `/portal/finance` | Tuition, balances, payments |
| Docs | `/portal/documents` | Evidence / documents → Knowledge |
| Thin shell | `/academyos/parent` | Pack-composed parent experience |

## C. Student portal

| Area | Routes | Capabilities |
|------|--------|--------------|
| Student home | `/portal/student` | Overview |
| Goals | `/portal/student/goals` | Goals / mastery signals |
| Schedule | `/portal/student/schedule` | Classes / sessions |
| Shared parent-visible | progress, messages, portfolio, calendar | Same engines; permission-scoped |

## D. Staff portals (dashboard shells)

Not “portals” by URL, but role workspaces:

| Workspace | Entry | Audience |
|-----------|-------|----------|
| Teacher | `/dashboard/teacher/**` | Teachers |
| School leader | `/dashboard/students`, admissions, finance, HR | Leaders |
| Admissions | `/dashboard/admissions/**`, `/academyos/admissions` | Admissions staff |
| Finance | `/dashboard/finance/**` | Finance roles |
| Executive / founder | `/dashboard/executive/**`, `/founder` | Executives |
| Platform admin | `/dashboard/admin/**`, `/platform/**` | Admins |

## E. Portal consolidation rules

1. **One parent portal** (`/portal`) — do not spawn a second family product.  
2. Document viewing/uploading consolidates on **KnowledgeEngine**.  
3. Payments consolidate on **Shared Finance / Revenue** with education family-account adapters.  
4. Messaging/notifications consolidate on Shared Notification Engine (later) — Education keeps templates.  
5. Mobile native deferred (roadmap E9); responsive web first.
