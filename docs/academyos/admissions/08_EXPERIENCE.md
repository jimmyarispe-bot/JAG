# Admissions Experience (Wave 1.1)

**Product implementation** — orchestration over canonical platform services.  
**Does not** create platform engines or duplicate CRM / document / finance models.

## Surfaces

| Area | Routes |
|------|--------|
| Public website | `/admissions/**` |
| Interest form | `/apply` |
| Discovery / tour / assessment | `/admissions/discovery-call`, `/schedule-tour`, `/assessment` |
| Application wizard | `/apply/portal/[id]/wizard` |
| Application dashboard | `/apply/portal`, `/apply/portal/[id]` |
| Staff CRM | `/dashboard/admissions/**` |
| Experience hub | `/dashboard/admissions/experience` |
| Parent onboarding | `/admissions/onboarding` |
| Tuition | `/apply/portal/finance`, `/portal/finance` |

## Orchestration

`src/lib/admissions/experience/`

- Delegates to existing portal actions, enrollment packets, schedule interview/tour, scholarships, Identity invites
- Documents mirror to **KnowledgeEngine**
- Events → Digital Twin, Evidence Ledger, Organizational Memory (+ platform bus)

## Engines consumed

Organization · Identity · Knowledge · Learning Intelligence · Finance · Workflow · Notifications · Twin · Evidence · Memory

## Tests

`tests/unit/admissions/wave11-admissions-experience.test.ts`
