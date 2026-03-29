---
phase: 04-web-app-core-flow
plan: "04"
subsystem: api
tags: [nextjs, vercel, diagnostics, pdf, openai, browser]
requires:
  - phase: 04-03
    provides: browser-side extraction workspace and provider-key path validation target
provides:
  - Node runtime PDF inspect diagnostics route for hosted timing checks
  - Production verification of the Phase 4 extraction flow on Vercel
  - Confirmed browser-only provider-key path with no DocPipe-hosted extraction endpoint
affects: [05-results-and-export, vercel, production-readiness]
tech-stack:
  added: []
  patterns:
    - Lightweight hosted diagnostics stay separate from the browser extraction path.
    - Provider keys remain browser-only while optional hosted routes handle non-secret diagnostics.
key-files:
  created:
    - apps/web/src/app/api/pdf-inspect/route.ts
    - apps/web/src/lib/pdf-inspect.ts
  modified: []
key-decisions:
  - "Kept /api/pdf-inspect diagnostic-only so hosted requests never need the provider key or extraction payload beyond a temporary PDF upload."
  - "Generalized the production checkpoint wording to a provider-neutral browser-only key path after validating the live deployment with OpenAI."
patterns-established:
  - "Production checks for browser LLM flows should verify both the hosted diagnostic route and the direct provider network path in DevTools."
  - "App Router route handlers can expose bounded PDF analysis without undermining the BYOK browser architecture."
requirements-completed: [WEB-02]
duration: 2h 52m
completed: 2026-03-29
---

# Phase 04 Plan 04: Production Verification Summary

**Vercel-hosted PDF diagnostics route plus production proof that extraction runs through the browser with the provider key staying off DocPipe-hosted requests**

## Performance

- **Duration:** 2h 52m
- **Started:** 2026-03-29T12:56:55+02:00
- **Completed:** 2026-03-29T15:49:10+02:00
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Added a Node runtime `POST /api/pdf-inspect` route that validates multipart PDF uploads, classifies them through `detectPdfType()`, and returns `filename`, `sizeBytes`, `pdfType`, and `elapsedMs`.
- Confirmed the deployed route on Vercel with a real PDF upload returning `{"filename":"racun-01-2026.pdf","sizeBytes":68338,"pdfType":"text-layer","elapsedMs":315}`.
- Verified the production extraction flow end-to-end in the browser and confirmed the provider key stayed on direct provider requests rather than any DocPipe-hosted extraction endpoint.

## Task Commits

Each task was completed atomically:

1. **Task 1: Add a lightweight PDF inspect API route for hosted timing checks** - `db8f062` (`feat`)
2. **Task 2: Human verification of the deployed Vercel flow** - approved after live deployment checks (no code commit)

**Plan metadata:** created in the follow-up docs commit for summary/state updates

## Files Created/Modified

- `apps/web/src/app/api/pdf-inspect/route.ts` - Node runtime route handler that parses the upload, calls `detectPdfType()`, times the operation, and returns JSON.
- `apps/web/src/lib/pdf-inspect.ts` - Multipart request parsing, PDF validation, 5 MB size guard, buffer conversion, and response shaping for the diagnostics route.

## Decisions Made

- Kept `/api/pdf-inspect` strictly diagnostic so hosted infrastructure measures PDF analysis timing without ever becoming an extraction proxy.
- Updated the checkpoint contract to provider-neutral wording after the live production check used OpenAI credits rather than Anthropic.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added an explicit numeric annotation for the inspect-size constant**
- **Found during:** Task 1 (Add a lightweight PDF inspect API route for hosted timing checks)
- **Issue:** `isolatedDeclarations` required an explicit exported type for `MAX_PDF_INSPECT_SIZE_BYTES`.
- **Fix:** Annotated the constant as `number` in the shared PDF inspect helper.
- **Files modified:** `apps/web/src/lib/pdf-inspect.ts`
- **Verification:** `pnpm --filter web build`
- **Committed in:** `db8f062`

---

**Total deviations:** 1 auto-fixed (Rule 3: 1)
**Impact on plan:** The fix was required for declaration-safe builds and did not change route behavior or checkpoint scope.

## Issues Encountered

- The first deployed check returned `404`, which showed Vercel had not yet picked up `db8f062`; redeploying resolved that.
- Opening `/api/pdf-inspect` directly returned `405`, which was expected because the route is `POST`-only; the successful verification used a multipart `POST`.

## User Setup Required

Vercel deployment remains the manual production step for this workflow, but the required production verification is now complete.

## Next Phase Readiness

Phase 4 production behavior is verified: the hosted PDF diagnostic route works on Vercel, and extraction itself still runs in the browser with the provider key going only to the selected model provider. Phase 5 can focus on result presentation and export polish without reopening the core network boundary.

## Self-Check

PASSED - summary file exists, task commit `db8f062` is present in git history, the deployed `/api/pdf-inspect` route returned a valid JSON response, and DevTools verification confirmed no `/api/extract` request or DocPipe-hosted provider-key leakage during extraction.

---
*Phase: 04-web-app-core-flow*
*Completed: 2026-03-29*
