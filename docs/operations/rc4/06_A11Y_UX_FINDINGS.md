# RC-4 — Accessibility & UX Findings

## Automated (static + smoke)

| Finding | Severity | Notes |
|---------|----------|-------|
| Login labels present | Pass | Playwright smoke |
| Login keyboard Tab email→password | Pass | `tests/acceptance/role-gates.spec.ts` |
| Portal skip / a11y bar | Pass (static) | `PortalShell`, `PortalAccessibilityBar` |
| Dashboard / Exec skip patterns | Pass (static) | Shell components |
| LiveAnnouncer | Pass (static) | Experience system |
| axe CI missing | **High** | E-007 / G-RC1-06 |
| Staff shells lack portal a11y bar | Low | UX observation — OS prefs |

## Manual spot-check checklist (staging)

- [ ] Keyboard-only complete login  
- [ ] Focus visible on primary CTAs  
- [ ] Screen reader announces toast/errors  
- [ ] Empty states have guidance text  
- [ ] Loading skeletons do not trap focus  
- [ ] Parent finance + teacher session usable at 390px width  

## UX observations (non-blocking)

- Portal has richer a11y controls than staff shells (intentional asymmetry).  
- Certification in-app “E2E” is table probes only — do not treat as role acceptance.  
