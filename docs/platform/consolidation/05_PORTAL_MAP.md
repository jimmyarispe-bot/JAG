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
| Home | `/portal` | Hub, schedule, announcements, tasks, student switcher (Wave 1.2) |
| My Children | `/portal/children`, `/portal/students/[id]` | Multi-student profiles |
| Academics | `/portal/learning`, `/progress`, `/portfolio`, `/student/**` | Learning Intelligence + progress |
| Attendance | `/portal/attendance` | Daily history, excuses |
| Ops | `/portal/calendar`, `/conferences`, `/forms` | Calendar, conferences, forms |
| Comms | `/portal/messages`, `/notifications`, `/support` | Messaging, alerts, help |
| Money | `/portal/billing`, `/portal/finance` | Tuition, balances, payments (FinanceEngine) |
| Contracts | `/portal/contracts` | Agreements → Knowledge |
| Profile | `/portal/profile` | Guardian prefs (Identity) |
| Docs | `/portal/documents` | Evidence / documents → Knowledge |
| Thin shell | `/academyos/parent` | Pack-composed parent experience |

## C. Student portal (Wave 1.3)

| Area | Routes | Capabilities |
|------|--------|--------------|
| Student home | `/portal/student` | Schedule, announcements, tasks, quick actions |
| My Learning | `/portal/student/learning` | Mastery / LI summaries |
| Assignments / assessments | `/portal/student/assignments`, `/assessments` | Deadlines + results |
| Attendance / calendar | `/portal/student/attendance`, `/calendar` | SIS + scheduling |
| Goals / achievements / coach | `/portal/student/goals`, `/achievements`, `/coach` | Evidence-backed LI coach |
| Documents / profile | `/portal/student/documents`, `/profile` | Knowledge + Identity |
| Schedule (legacy) | `/portal/student/schedule` | Classes / sessions |
| Shared | messages, portfolio, notifications | Same engines; permission-scoped |

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
