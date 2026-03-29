---
phase: 05-web-app-results-export
plan: "03"
subsystem: ui
tags: [react, nextjs, typescript, csv, clipboard, browser-downloads]
requires:
  - phase: 04-web-app-core-flow
    provides: one-page extraction workspace, selected upload state, and the existing result card layout
  - phase: 05-web-app-results-export
    provides: structured result preview and confidence-banded result rendering
provides:
  - browser-only JSON export for extraction results
  - browser-only CSV export for top-level extraction fields
  - in-card JSON clipboard copy with transient success and failure feedback
affects: [phase-06-cli, export-patterns, result-downloads, clipboard-feedback]
tech-stack:
  added: []
  patterns:
    [
      browser-only result export helpers built on Blob, URL.createObjectURL, and navigator.clipboard,
      results preview derives export filenames from the selected upload name,
      copy feedback stays local to the preview card with a 2000 ms reset,
    ]
key-files:
  created:
    [apps/web/src/lib/result-export.ts]
  modified:
    [
      apps/web/src/components/docpipe/docpipe-workspace.tsx,
      apps/web/src/components/docpipe/results-preview.tsx,
    ]
key-decisions:
  - "Export actions stay inside the existing results card instead of adding a separate page, modal, or toast flow."
  - "CSV export writes one quoted row per top-level field from result.data using the shared ExtractionResult confidence map."
patterns-established:
  - "Result export contract: derive fileStem from sourceFileName and reuse result.data/result.confidence for all browser actions."
  - "Transient preview feedback: keep copy success or failure in component-local state and reset it after 2000 ms."
requirements-completed: [WEB-04, WEB-05, WEB-06]
duration: 6 min
completed: 2026-03-29
---

# Phase 05 Plan 03: Web App Results Export Summary

**In-card JSON download, CSV export, and clipboard copy for extraction results with browser-only helpers and 2-second copy feedback**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-29T16:27:18+02:00
- **Completed:** 2026-03-29T16:33:18+02:00
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Added `result-export.ts` with browser-only JSON download, CSV download, and clipboard copy helpers for `ExtractionResult` data.
- Passed the selected upload filename into `ResultsPreview` so exports use a stable `{fileStem}-extraction.*` naming pattern.
- Added `Download JSON`, `Download CSV`, and `Copy JSON` actions to the existing result card with immediate in-place copy feedback.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add browser-only JSON, CSV, and clipboard helpers for extraction results** - `f919166` (feat)
2. **Task 2: Wire export actions and instant copy feedback into the results card** - `3def0ce` (feat)

**Plan metadata:** recorded in the final docs commit for summary and planning-state updates

## Files Created/Modified

- `apps/web/src/lib/result-export.ts` - browser-only helpers for JSON download, CSV download, CSV escaping, and clipboard copy.
- `apps/web/src/components/docpipe/docpipe-workspace.tsx` - passes the selected upload name through to the preview so export filenames match the current document.
- `apps/web/src/components/docpipe/results-preview.tsx` - renders the export action row and manages local copied/error feedback with a 2000 ms reset.

## Decisions Made

- Kept all export behavior inside the existing `ResultsPreview` card so the Phase 4 one-page workflow remains intact.
- Used top-level field rows for CSV export to match the roadmap requirement and the existing top-level confidence table model from Plan 05-02.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Reset transient copy feedback when the displayed result changes**
- **Found during:** Task 2 (Wire export actions and instant copy feedback into the results card)
- **Issue:** The `Copied JSON` or `Copy failed` state could persist into a fresh extraction result if the result card updated before the 2000 ms timer elapsed.
- **Fix:** Cleared the pending timeout and reset `copyState` whenever `result`, `resultError`, or `sourceFileName` changes.
- **Files modified:** apps/web/src/components/docpipe/results-preview.tsx
- **Verification:** `pnpm --filter web type-check` and `pnpm --filter web build`
- **Committed in:** `3def0ce`

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** The fix kept the copy-feedback behavior tied to the currently displayed result without expanding scope.

## Issues Encountered

- `rg.exe` was not runnable in this environment (`Access is denied`), so acceptance checks used PowerShell `Select-String`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 05 now covers the full polished web result flow: structured preview, custom schema mode, and export/copy actions.
- The remaining roadmap work is ready to shift to the CLI phase with no blockers identified in the web app.

## Self-Check: PASSED

- Summary file exists at `.planning/phases/05-web-app-results-export/05-03-SUMMARY.md`
- Task commit `f919166` exists in git history
- Task commit `3def0ce` exists in git history

---
*Phase: 05-web-app-results-export*
*Completed: 2026-03-29*
