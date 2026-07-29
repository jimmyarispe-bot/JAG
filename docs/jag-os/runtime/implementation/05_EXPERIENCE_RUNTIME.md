# 05 — Experience Runtime Implementation

**Phase Ω-5** · Package: `src/lib/jag/runtime/experience`  
**Authority:** [05_EXPERIENCE_RUNTIME.md](../05_EXPERIENCE_RUNTIME.md) · Pipeline: [07_RUNTIME_PIPELINE.md](../07_RUNTIME_PIPELINE.md)

---

## Constitutional gate

| Question | Answer |
|----------|--------|
| Domain knowledge? | **No** |
| Duplicate UI / business logic? | **No** — composition model only |
| Bypass Runtime? | **No** — Experience pipeline stage |
| Fixed dashboards / portals? | **No** |
| Education-specific? | **No** |

---

## Architecture

```text
Identity + Context + Intent + Cognition(opaque)
    ↓
ExperienceProvider contributors + widget registry
    ↓
ExperienceComposer
    ↓
ExperienceModel  →  RuntimeExperience (pipeline bag)
    ↓
Renderer clients (out of scope)
```

Experience Runtime **composes**; clients **render**. No React, routes, CSS, or domain widgets in this package.

---

## Composition lifecycle

1. Collect widgets (registry + contributors), filter by permissions / context family / intent  
2. Apply personalization (pin / hide / density)  
3. Build briefing from cognition (or unknown gaps) — never invent recommendations  
4. Merge next actions, notifications, navigation, command affordances  
5. Build layout regions by slot  
6. Emit events; bind `RuntimeExperience` on pipeline state  

---

## Widget model

Generic kinds only:

`summary` · `list` · `timeline` · `alert` · `action` · `metric` · `chart` · `document` · `conversation` · `custom`

Slots: `briefing` · `primary` · `secondary` · `utility` · `nav` · `command` · `notification`

Descriptors carry opaque `dataBindings` and `actions` (Action Runtime ids).

---

## Briefing model

```text
ExperienceBriefing {
  briefingId, summary?, priorities[], unknownGaps[], nextActions[]
}
```

Sourced from opaque cognition bag or contributor `briefing()`.  
Empty cognition → honest `unknownGaps`.

---

## Public APIs

```ts
import {
  createExperienceRuntime,
  installExperienceRuntime,
  EXPERIENCE_EVENT_TYPES,
  type ExperienceProvider,
} from "@/lib/jag/runtime";

jag.registry.registerExperienceContributor(provider);
installExperienceRuntime(jag);

await jag.run({
  composeOnly: true,
  stopAfter: "experience",
  initialData: { sessionRef: "…", contextId: "ops.home", renderTarget: "web" },
});
// result.experience: RuntimeExperience
// result.data.experienceModel: ExperienceModel
```

| Method | Purpose |
|--------|---------|
| `compose` / `composeOrThrow` | Build `ExperienceModel` |
| `registerWidget` | Static widget catalog |
| `registerProvider` | Local contributor |
| `toRuntimeExperience` | Map to kernel contract |

Registry:

- `registerExperienceContributor` — fragment providers for this runtime  
- `registerExperienceProvider` — legacy simple `RuntimeExperienceProvider` (fallback if Experience Runtime not installed)

---

## Extension model

Domain packs contribute via contracts only. Core never imports domain modules.

```ts
runtime.registry.registerExperienceContributor({
  id: "pack.ui.fragments",
  widgets(request) { return [/* ExperienceWidget */]; },
  navigation(request) { return [/* ExperienceNavHint */]; },
});
```

---

## Rendering contract

Any client may render `ExperienceModel`:

- Honor `layout.regions` and widget `slot` / `order`  
- Use `a11y` metadata for landmarks / live regions  
- Dispatch `nextActions` / widget `actions` through Action Runtime  
- Do not treat `contextId` as a branded portal product  

Targets: `web` · `mobile` · `desktop` · `headless` · `unknown`

---

## Events

| Event | When |
|-------|------|
| `jag.runtime.experience.composed` | Composition success |
| `jag.runtime.experience.widget_registered` | Widget catalog add |
| `jag.runtime.experience.briefing_generated` | Briefing built |
| `jag.runtime.experience.next_actions_generated` | Actions listed |
| `jag.runtime.experience.composition_failed` | Hard failure |

---

## Tests

`tests/unit/jag/runtime/experience.test.ts`

---

## Out of scope

React · routes · pages · CSS · Tailwind · dashboards · Education widgets · business logic · Cognition engines
