# QA Runbooks

## R1 — Pre-release automated pack

1. Clean install: `npm ci`  
2. `npm run lint` — must have **zero errors**  
3. `npm run typecheck`  
4. `npm run test`  
5. `npm run test:integration`  
6. Start app with placeholder or real env; `npm run test:smoke`  
7. Record results in release checklist  

## R2 — Manual smoke (minimum)

For each of Teacher, Parent, Finance, Admissions (staging):

1. Login  
2. Land on expected home  
3. Open one primary list/detail  
4. Attempt a forbidden deep link — expect denial  
5. Logout  

## R3 — Multi-tenant manual

1. Create/use Org A and Org B users  
2. Confirm Org A cannot open Org B student/finance URLs  
3. Confirm school-scoped user cannot access other school records  

## R4 — Incident regression

When a production defect lands: add a failing unit/integration test first, then fix, then re-run R1.
