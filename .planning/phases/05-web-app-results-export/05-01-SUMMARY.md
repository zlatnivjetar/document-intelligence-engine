---
phase: 05-web-app-results-export
plan: "01"
subsystem: ui
tags: [react, nextjs, zod, shadcn, pnpm]
requires:
  - phase: 04-web-app-core-flow
    provides: one-page browser extraction workspace with BYOK storage, built-in template selection, and shared extract() wiring
provides:
  - browser-side custom Zod schema compilation for the web app
  - inline custom schema editing inside the existing workspace
  - shared extract() branching for built-in and custom schema modes
affects: [05-02, 05-03, results-presentation, export-actions]
tech-stack:
  added: [zod]
  patterns:
    [
      browser-only schema compilation with the app-local z runtime,
      template selector unions for built-in and custom modes,
      single-page extraction branching through shared extract(),
    ]
key-files:
  created:
    [
      apps/web/src/components/docpipe/custom-schema-editor.tsx,
      apps/web/src/components/ui/textarea.tsx,
      apps/web/src/lib/custom-schema.ts,
    ]
  modified:
    [
      apps/web/package.json,
      apps/web/src/components/docpipe/docpipe-workspace.tsx,
      apps/web/src/components/docpipe/template-selector.tsx,
      pnpm-lock.yaml,
    ]
key-decisions:
  - "Custom schema mode stays inside the existing Phase 4 page and reuses the shared extract() call instead of introducing a second extraction path."
  - "The web UI accepts only top-level z.object({...}) pasted schemas so downstream result rows can keep predictable field-confidence mapping."
patterns-established:
  - "Browser compiler contract: compile pasted Zod source with compileCustomSchema() and return the schema metadata expected by extract()."
  - "Selector behavior: built-in and custom modes share one template control and clear inline errors on selection changes."
requirements-completed: [WEB-07]
duration: 3 min
completed: 2026-03-29
---

# Phase 05 Plan 01: Web App Results Export Summary

**Browser-side custom Zod schema selection and compilation integrated into the existing one-page extraction workspace**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-29T14:11:28Z
- **Completed:** 2026-03-29T14:14:54Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Added a reusable web `Textarea` and inline schema editor so users can paste a custom Zod object without leaving the main DocPipe page.
- Added `compileCustomSchema()` to evaluate pasted schema source in the browser, reject empty input, guard against non-`z.object(...)` values, and return shared extraction metadata.
- Integrated a `custom` template mode into the existing workspace so custom schemas and built-in templates both flow through the same `extract()` path.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add the custom schema editor surface and browser compiler helper** - `09435ec` (feat)
2. **Task 2: Integrate custom schema mode into the existing workspace flow** - `960cf6a` (feat)

**Plan metadata:** recorded in the final docs commit for summary and planning-state updates

## Files Created/Modified

- `apps/web/package.json` - adds the direct `zod` runtime dependency required by the browser compiler.
- `pnpm-lock.yaml` - records the new `apps/web` importer dependency on `zod`.
- `apps/web/src/components/ui/textarea.tsx` - shared multiline input styled to match the existing Phase 4 input language.
- `apps/web/src/lib/custom-schema.ts` - browser-only compiler that turns pasted Zod source into schema metadata for `extract()`.
- `apps/web/src/components/docpipe/custom-schema-editor.tsx` - inline custom schema UI with required helper copy, placeholder schema, and usage note.
- `apps/web/src/components/docpipe/template-selector.tsx` - widened selector typing and added the `Custom Zod schema` option.
- `apps/web/src/components/docpipe/docpipe-workspace.tsx` - stores custom schema source, renders the editor inline, and routes custom extraction through `compileCustomSchema(customSchemaSource)`.

## Decisions Made

- Added a direct `zod` dependency to `apps/web` because the browser compiler lives in the web package and should not rely on workspace hoisting from `@docpipe/core`.
- Kept custom schema extraction on the existing page and in the existing extract branch so future results/export plans work from one consistent result contract.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Escaped the helper-copy literal for `z.object({...})`**
- **Found during:** Task 1 verification
- **Issue:** JSX parsed the literal `{...}` inside the instructional copy as a spread expression, which broke type-checking and the production build.
- **Fix:** Rendered the `z.object({...})` example as a string literal inside the helper copy.
- **Files modified:** apps/web/src/components/docpipe/custom-schema-editor.tsx
- **Verification:** `pnpm --filter web type-check` and `pnpm --filter web build`
- **Committed in:** `09435ec`

**2. [Rule 3 - Blocking] Synced the workspace lockfile for the new direct `zod` dependency**
- **Found during:** Task 1 verification
- **Issue:** `apps/web` could not resolve `zod` until the importer block in `pnpm-lock.yaml` was updated.
- **Fix:** Ran `pnpm install --filter web` and committed the resulting lockfile change.
- **Files modified:** pnpm-lock.yaml
- **Verification:** `pnpm --filter web type-check` and `pnpm --filter web build`
- **Committed in:** `09435ec`

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both fixes were required for correctness and dependency resolution. No scope expansion.

## Issues Encountered

- `rg.exe` was not runnable in this environment (`Access is denied`), so acceptance checks fell back to PowerShell `Select-String`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The workspace now exposes a stable custom-schema mode that later Phase 05 plans can render and export without adding a second extraction path.
- No blockers identified for the results-table and export work.

## Self-Check: PASSED

- Summary file exists at `.planning/phases/05-web-app-results-export/05-01-SUMMARY.md`
- Task commit `09435ec` exists in git history
- Task commit `960cf6a` exists in git history

---
*Phase: 05-web-app-results-export*
*Completed: 2026-03-29*
