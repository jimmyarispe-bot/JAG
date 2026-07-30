# Sprint 212 — Organization Provisioning & Executive Onboarding

**Scope:** Application layer only. Does not modify JAG Core.  
**Goal:** A new customer can go from signup → organization → brand → systems → first executive brief in under 30 minutes, creating a branded Executive Intelligence Platform **Powered by The JAG™**.

---

## 1. Package architecture

```
src/lib/platform/onboarding/
  OrganizationProvisioningService.ts  # Create tenant org record
  TenantProvisioner.ts                # Apply brand + capability selection
  ExecutiveOnboardingService.ts       # Façade (resume, steps, generate)
  OnboardingStateMachine.ts           # Step transitions, pause/resume
  ProgressTracker.ts                  # Progress %, ETA, readiness score
  ChecklistService.ts                 # First-inbox onboarding tasks
  WelcomeService.ts                   # Welcome copy + brief payload
  OnboardingObservability.ts          # Telemetry + drop-off summary
  welcome-brief.ts                    # Persist Welcome Executive Brief
  session-store.ts / steps.ts / types.ts / defaults.ts / index.ts
```

Command Center adapters:

```
src/lib/jag-command-center/onboarding/
  load-onboarding.ts
  actions.ts
  index.ts
```

UI: `/jag/onboarding` → `JagOnboardingView`

---

## 2. Provisioning flow

1. **Welcome** — Introduce The JAG™ and the guided path.  
2. **Organization** — Name, subdomain (`*.thejag.org`), industry, timezone, logo.  
3. **Brand** — Colors, fonts, live theme preview (Sprint 211 ThemeEngine).  
4. **Executive profile** — Founder / CEO / team.  
5. **Mission & strategy** — Mission, vision, values, pillars, goals.  
6. **Capabilities** — Enable modules discovered via Capability SDK.  
7. **Connect systems** — Google Workspace, Microsoft 365, calendar, email, CRM, finance, HR, SIS, and catalog connectors.  
8. **Review** — Validate configuration; show readiness score.  
9. **Generate workspace** — Persist organization, apply brand, mark connectors, seed checklist, generate Welcome Executive Brief.

---

## 3. State machine

Statuses: `not_started` → `in_progress` ↔ `paused` → `completed` (or `failed`).

- Steps advance only when validation passes.  
- Users may navigate back to completed / current steps.  
- **Pause / resume** persists the full session in the onboarding session store.

---

## 4. Lifecycle

| Event | Result |
|-------|--------|
| Session created | Owner-scoped session; welcome step |
| Step completed | Validation + observability `step_completed` |
| Workspace generated | Org provisioned, brand applied, brief + inbox tasks |
| Completed | Status `completed`; ETA 0; readiness ≥ 95 |

---

## 5. Readiness model

`ProgressTracker.scoreReadiness` (0–100) weights:

- Organization identity (name, subdomain, industry)  
- Brand colors  
- Executives  
- Mission / goals  
- Capabilities (≥3)  
- Selected / connected systems  
- Review + workspace generation  

Dashboard shows **progress %**, **completed / remaining steps**, **estimated minutes**, and **readiness score**.

---

## 6. First brief & first inbox

**Welcome Executive Brief** (stored as `morning_brief` with kind label “Welcome Executive Brief”) includes:

- Configured organization  
- Capabilities enabled  
- Connected / selected systems  
- Mission and strategic goals  
- Recommended next steps  

**First inbox tasks:**

- Complete integrations  
- Invite executives  
- Configure branding  
- Review strategy  
- Generate first decision  

---

## 7. Observability

Tracked kinds: `provisioning`, `step_entered`, `step_completed`, `paused`, `resumed`, `validation_failure`, `connector_success`, `connector_failure`, `workspace_generated`, `brief_generated`, `completed`, `drop_off` (derived).

---

## 8. Success

A new customer can create a fully branded Executive Intelligence Platform without engineering assistance — clearly **Powered by The JAG™**.
