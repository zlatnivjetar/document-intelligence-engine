---
phase: 05-web-app-results-export
plan: "02"
subsystem: ui
tags: [react, nextjs, typescript, shadcn, extraction-results]
requires:
  - phase: 04-web-app-core-flow
    provides: one-page extraction workspace, BYOK form flow, and the Phase 4 card layout
  - phase: 05-web-app-results-export
    provides: custom schema mode that reuses the shared browser extract() path
provides:
  - typed extraction error-state mapping for the web results panel
  - confidence-banded table rendering for top-level extracted fields
  - empty, error, and success result preview states backed by ExtractionResult
affects: [05-03, export-actions, result-copy, result-downloads]
tech-stack:
  added: []
  patterns:
    [
      workspace stores the shared ExtractionResult object instead of parallel JSON state,
      result preview copy is centralized in toExtractionErrorState(),
      confidence rendering uses fixed roadmap thresholds for top-level fields,
    ]
key-files:
  created:
    [
      apps/web/src/lib/extraction-error-state.ts,
      apps/web/src/components/docpipe/result-confidence-table.tsx,
    ]
  modified:
    [
      apps/web/src/components/docpipe/docpipe-workspace.tsx,
      apps/web/src/components/docpipe/results-preview.tsx,
      apps/web/src/app/globals.css,
    ]
key-decisions:
  - "The workspace now treats the shared ExtractionResult object as the only result source of truth and derives preview formatting from it."
  - "Preview failure UI flows through a shared error-state mapper so extraction codes and browser-side failures produce consistent, actionable copy."
patterns-established:
  - "ResultsPreview contract: pass result plus resultError and let the card own empty/error/success rendering."
  - "Confidence table contract: render top-level fields in a semantic table with high/medium/low bands at 0.85 and 0.60 thresholds."
requirements-completed: [WEB-03]
duration: 8 min
completed: 2026-03-29
---

# Phase 05 Plan 02: Web App Results Export Summary

**Structured results preview with typed failure states and roadmap-threshold confidence bands in the existing web extraction workspace**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-29T14:18:38Z
- **Completed:** 2026-03-29T14:26:47Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Replaced the workspace's duplicated JSON/confidence state with a single shared `ExtractionResult` object plus a typed `ResultErrorState`.
- Added `toExtractionErrorState()` so invalid API key, unsupported file format, extraction failure, validation failure, rate limiting, and browser-side failures map to explicit preview copy.
- Replaced the raw JSON preview with a semantic result table that shows field values and high/medium/low confidence bands using the roadmap thresholds.

## Task Commits

Each task was committed atomically:

1. **Task 1: Refactor the workspace to hold structured results and typed error states** - `4003cf0` (feat)
2. **Task 2: Replace the plain JSON preview with a confidence-banded result table and actionable error states** - `6785387` (feat)

**Plan metadata:** recorded in the final docs commit for summary and planning-state updates

## Files Created/Modified

- `apps/web/src/lib/extraction-error-state.ts` - shared mapper from extraction failures to actionable preview titles, messages, and validation details.
- `apps/web/src/components/docpipe/docpipe-workspace.tsx` - stores structured results, clears stale preview errors on relevant input changes, and routes unsupported-file failures into the preview state.
- `apps/web/src/components/docpipe/results-preview.tsx` - renders empty, error, and success card states from `result` and `resultError`.
- `apps/web/src/components/docpipe/result-confidence-table.tsx` - semantic table for top-level extracted fields, JSON-formatted complex values, and color-coded confidence labels.
- `apps/web/src/app/globals.css` - adds semantic confidence color tokens for high, medium, and low result bands.

## Decisions Made

- Kept the Phase 4 card layout intact and concentrated the richer behavior inside `ResultsPreview` so the one-page flow stays stable while the result area becomes more informative.
- Used a shared error-to-copy mapper instead of embedding copy in the workspace or preview, which keeps later export/copy actions free to reuse the same failure vocabulary.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated `ResultsPreview` props during Task 1 so the workspace refactor still type-checked**
- **Found during:** Task 1 (Refactor the workspace to hold structured results and typed error states)
- **Issue:** Switching `docpipe-workspace.tsx` to `result` and `resultError` state would not compile against the old `ResultsPreview` prop contract.
- **Fix:** Changed `ResultsPreview` to accept the structured result/error props immediately, while keeping the JSON-based rendering until Task 2 completed the full UI rewrite.
- **Files modified:** apps/web/src/components/docpipe/results-preview.tsx
- **Verification:** `pnpm --filter web type-check` and `pnpm --filter web build`
- **Committed in:** `4003cf0`

**2. [Rule 1 - Bug] Cleared stale file/result state when an unsupported document is selected**
- **Found during:** Task 1 (Refactor the workspace to hold structured results and typed error states)
- **Issue:** The existing workspace would otherwise keep the previously selected valid file after rejecting a new unsupported file, which could lead to extracting the wrong document.
- **Fix:** Clear `selectedFile` and the current `result` when unsupported input is selected, then map that failure into the typed preview error state.
- **Files modified:** apps/web/src/components/docpipe/docpipe-workspace.tsx
- **Verification:** `pnpm --filter web type-check` and `pnpm --filter web build`
- **Committed in:** `4003cf0`

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes were required for a correct structured-preview flow and did not expand scope beyond the plan intent.

## Issues Encountered

- `rg.exe` was not runnable in this environment (`Access is denied`), so acceptance checks used PowerShell `Select-String`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The export plan can now reuse `result.data`, `result.confidence`, and the shared preview error contract without introducing another result model.
- No blockers identified for JSON/CSV export and clipboard actions.

## Self-Check: PASSED

- Summary file exists at `.planning/phases/05-web-app-results-export/05-02-SUMMARY.md`
- Task commit `4003cf0` exists in git history
- Task commit `6785387` exists in git history

---
*Phase: 05-web-app-results-export*
*Completed: 2026-03-29*
