# Mobile responsiveness

## Scope

Every primary dashboard route: layouts, overflow menus, touch targets (≥44px), tables, dialogs, forms, navigation.

## Evidence

| Signal | Location |
|--------|----------|
| Shared responsive CRUD / menus | `src/components/platform/crud` |
| Playwright mobile project | `playwright.config.ts` (`mobile`) |
| Gate | `npm run validate:mobile` |
| Device smoke | `npm run test:mobile` |
| Certification UI | `/dashboard/certification/mobile` |

## Checklist

- [ ] No horizontal scroll on 375px viewport for primary pages
- [ ] Tables scroll or stack
- [ ] Dialogs fit viewport
- [ ] Touch targets meet minimum size
- [ ] Overflow menus usable on touch
