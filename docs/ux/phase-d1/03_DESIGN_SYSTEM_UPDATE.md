# Design System / Component Standardization — D.1

| Component | Before | After |
|-----------|--------|-------|
| EmptyState | ui + XES duplicates | XES re-exports `@/components/ui/EmptyState` |
| ConfirmDialog | No focus trap | Focus trap + restore |
| Loading | Ad-hoc pulse | `LoadingState` + `RouteLoadingSkeleton` + route `loading.tsx` |
| Forms | Ad-hoc labels | XES `FormField` on Lead + HR hire |
| Charts | Visual-only bars | Accessible table + `role="img"` |
| Announcements | Inline only | `LiveAnnouncerProvider` |

**Guideline:** Prefer XES forms/feedback/dialogs and WDS tables/charts. Do not introduce a third empty-state or dialog primitive.
