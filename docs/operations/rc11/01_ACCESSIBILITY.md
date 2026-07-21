# Accessibility (WCAG 2.2 AA)

## Scope

Audit critical AcademyOS routes for keyboard navigation, screen readers, ARIA, focus management, contrast, and error messaging.

## Evidence

| Signal | Location |
|--------|----------|
| Axe Playwright suite | `tests/a11y/critical-routes.spec.ts` |
| Shared CRUD focus trap / ARIA | `src/components/platform/crud` |
| Gate script | `npm run validate:a11y` |
| Full suite | `npm run test:a11y` |

## Checklist

- [ ] All interactive controls reachable via keyboard
- [ ] Dialogs trap focus and restore on close
- [ ] Form errors associated with inputs (`aria-describedby` / `aria-invalid`)
- [ ] Contrast ≥ 4.5:1 for body text
- [ ] Landmarks / headings present on dashboard shells
- [ ] Decorative icons `aria-hidden`

## Production gate

`npm run validate:a11y` must pass. Run `npm run test:a11y` in CI for axe-core evidence.
