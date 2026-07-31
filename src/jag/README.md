# The JAG OS — Platform Namespace

**Canonical import root for The JAG OS.**

This tree is the permanent home for platform capabilities. During Sprint 002 migration, modules primarily **re-export** existing implementations under `src/lib/platform/` (and related) so behavior stays unchanged while ownership becomes visible.

```text
import { startJAG, SdkService, getJagNavigationService } from "@/jag";
```

Application packages live under `src/packages/`. JAG loads them via the package loader — it does not embed industry engines here.

See `docs/jag-os/RUNTIME_OWNERSHIP_MAP.md`.
