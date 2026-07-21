# UX-003 — Global CTA Standardization

| Field | Value |
|-------|-------|
| **Sprint** | UX-003 |
| **Status** | Complete (platform standard established) |

## Shared components

| Component | Path | Role |
|-----------|------|------|
| `ActionChip` / `CTAButton` | `src/components/experience-system/feedback/ActionChip.tsx` | Navigation + command CTAs (pill) |
| `ActionChipGroup` | same | Consistent multi-chip layout |
| `ActionButton` | `src/components/experience-system/feedback/ActionButton.tsx` | Mutation lifecycle CTAs (shares chip tokens) |
| Tokens | `action-chip-styles.ts` | Variants, sizes, `inferActionChipVariant` |
| Re-export | `@/components/ui/cta` | Thin import path for WDS / cards |

## Variants

`primary` · `secondary` · `outline` · `ghost` · `success` · `warning` · `danger` · `info`

## Sizes

`xs` · `sm` (default) · `md` · `lg` — all enforce **min 44×44** touch target (`min-h-11 min-w-11`), `rounded-full`, focus ring, pointer cursor.

## Modules audited / migrated

Executive · Mission Control · Founder brief/cards · Admissions · Teacher · Work · Finance / FI · HR · Portal · Scheduling · Compliance · Admin config · AI recommendation cards · WDS `RecommendationCard` · XES Alert/Priority/Module/Session/Family/Employee cards

## Replacement volume (approximate)

| Wave | ~Count |
|------|-------:|
| Design-system cards + ModuleCard | ~12 |
| Batch 1 (MC / founder / work / teacher) | ~36 |
| Batch 2 (exec / admissions / portal / AI / scheduling / FI) | ~18 |
| Batch 3 (finance / HR / portal / admin / apply / AIP) | ~50 |
| Residual cleanup (school config, growth plan, briefings, meet joins) | ~12 |
| Text-link ActionButton hacks → real variants | ~21 |
| **Total plain-text / hacked actions → CTA** | **~149** |

Plus every existing `ActionButton` now renders with shared pill chrome (platform-wide visual alignment). Zero `!border-0 !bg-transparent` ActionButton hacks remain.

## Accessibility

- Focus-visible ring on all chips
- `aria-busy` / disabled states on buttons
- External `http(s)` CTAs open with `rel="noopener noreferrer"`
- Unit tests: `tests/unit/action-chip-variant.test.ts`
- Login axe gate (RC-5) unchanged

## Remaining exceptions (justified)

| Exception | Justification |
|-----------|---------------|
| Inline prose references on teacher executive page (“…sync to Mission Control”) | Content/documentation-style cross-reference inside sentences, not workflow CTAs |
| Privacy / Terms / help article links (if any) | Genuine content / legal hyperlinks |
| Whole-row keyboard targets that already wrap a card with an explicit ActionChip sibling | Prefer chip as the labeled action; avoid duplicate competing affordances |

## Screenshots

Capture after deploy against staging:

1. Mission Control event row — `[ View ]` chip  
2. Founder morning brief — `[ Review ]` / `[ Open ]`  
3. Recommendation / AI card — pill CTA  
4. Scheduling table — `[ Join meeting ]`  
5. Module dashboard card — `[ Open ]`

Place under `docs/operations/ux003/artifacts/` when available.
