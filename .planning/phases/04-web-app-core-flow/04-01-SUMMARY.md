---
phase: 04-web-app-core-flow
plan: "01"
subsystem: web
tags: [nextjs, browser, core, extract, typescript]
requires:
  - phase: 03-core-completeness
    provides: shared extract(), built-in templates, and PDF routing in @docpipe/core
provides:
  - browser-safe @docpipe/core/browser entrypoint
  - browser-native document normalization for shared extract()
  - thin web shim re-exporting only browser-safe DocPipe APIs
  - Next.js workspace transpilation for @docpipe/core
affects: [phase-04, phase-05, web]
tech-stack:
  added: []
  patterns:
    - Browser consumers import DocPipe through @docpipe/core/browser and a local shim instead of the root package.
    - Shared extraction normalizes browser-native binary inputs without unconditional Buffer access.
key-files:
  created:
    - packages/core/src/browser.ts
  modified:
    - packages/core/package.json
    - packages/core/src/extract.ts
    - packages/core/src/extract.test.ts
    - packages/core/src/types.ts
    - apps/web/src/lib/docpipe.ts
    - apps/web/next.config.ts
key-decisions:
  - "Web code imports a dedicated @docpipe/core/browser surface so the client path excludes root-package extras like detectPdfType and validators."
  - "PDF routing decodes base64 strings back to bytes for analysis while all outbound file parts normalize through a shared browser-safe base64 encoder."
patterns-established:
  - "Create browser-facing entrypoints as narrow barrels that expose only the runtime-safe API surface."
  - "Keep the app shim logic-free so Phase 4 and 5 UI code stays a thin consumer of the shared core package."
requirements-completed: [WEB-01, WEB-02]
duration: 6 min
completed: 2026-03-29
---

# Phase 04 Plan 01: Browser-Safe Core Surface Summary

**Browser-safe DocPipe imports now flow through a dedicated core entrypoint with binary input normalization and a thin Next.js web shim**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-29T10:31:48Z
- **Completed:** 2026-03-29T10:38:04Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Added `@docpipe/core/browser` so web code can import extraction, provider creation, templates, and shared types without reaching through the root package.
- Updated `extract()` to accept browser-native `Uint8Array` and `ArrayBuffer` document inputs while preserving PDF routing and base64 file-part generation.
- Replaced the web app shim with browser-entry re-exports only and enabled `transpilePackages` for `@docpipe/core` in Next.js.

## Task Commits

Each task was committed atomically:

1. **Task 1: Make extract() browser-safe and add a dedicated browser entrypoint** - `1cad3e6` (test), `f52ac86` (feat)
2. **Task 2: Wire the web app to the browser entrypoint with a thin shim** - `eaeafb1` (feat)

**Plan metadata:** included in the follow-up docs commit for summary/state updates

## Files Created/Modified
- `packages/core/src/browser.ts` - browser-only public barrel for extraction, provider factory, templates, and shared types.
- `packages/core/src/extract.ts` - runtime-safe base64 normalization and PDF byte decoding for browser-native inputs.
- `packages/core/src/extract.test.ts` - RED/GREEN coverage for `Uint8Array` and `ArrayBuffer` upload paths.
- `packages/core/src/types.ts` - widened `ExtractionInput.document` to include browser-native binary types.
- `packages/core/package.json` - browser subpath export plus dual-entry build command.
- `apps/web/src/lib/docpipe.ts` - thin browser-entry shim with re-exports only.
- `apps/web/next.config.ts` - `transpilePackages` configuration for `@docpipe/core`.

## Decisions Made
- Exposed the web app to a dedicated browser barrel instead of the root `@docpipe/core` entry so future client code cannot accidentally import server-only helpers from the broader package surface.
- Kept PDF routing inside the shared extractor by decoding base64 strings back to bytes before analysis rather than moving routing logic into the web app.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Reordered Buffer narrowing ahead of Uint8Array in helper branches**
- **Found during:** Task 1 (Make extract() browser-safe and add a dedicated browser entrypoint)
- **Issue:** The plan's sample helper checked `Uint8Array` before `Buffer`, but in strict TypeScript `Buffer` extends `Uint8Array`, so the final `Buffer` branch narrowed to `never` and failed `pnpm --filter "@docpipe/core" type-check`.
- **Fix:** Moved the `isNodeBuffer()` checks ahead of the generic `Uint8Array` branches in the runtime helpers while keeping the same browser-safe behavior.
- **Files modified:** `packages/core/src/extract.ts`
- **Verification:** `pnpm --filter "@docpipe/core" type-check`
- **Committed in:** `f52ac86`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The adjustment preserved the intended behavior and was required to satisfy the repo's strict TypeScript constraints. No scope creep.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 04 UI work can now consume shared extraction APIs from a browser-safe shim without duplicating core logic.
- No blockers remain for the next plan in Phase 04.

## Self-Check
PASSED - summary file exists, key created files are present, and task commits `1cad3e6`, `f52ac86`, and `eaeafb1` are present in git history.

---
*Phase: 04-web-app-core-flow*
*Completed: 2026-03-29*
