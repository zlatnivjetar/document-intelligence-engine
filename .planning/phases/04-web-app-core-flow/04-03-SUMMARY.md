---
phase: 04-web-app-core-flow
plan: "03"
subsystem: ui
tags: [nextjs, react, browser, sessionStorage, anthropic, zod]
requires:
  - phase: 04-01
    provides: Browser-safe DocPipe extraction entrypoint and thin web shim
  - phase: 04-02
    provides: Single-page DocPipe shell and shared UI primitives
provides:
  - Interactive one-page browser extraction workspace
  - Session-only Anthropic API key handling
  - Built-in invoice, receipt, and W-2 template selection
  - In-page JSON result preview with overall confidence
affects: [04-04, 05-results-and-export, web-ui]
tech-stack:
  added: []
  patterns: [sessionStorage-backed BYOK state, client-side shared extract orchestration, componentized DocPipe workspace]
key-files:
  created:
    - apps/web/src/components/docpipe/api-key-field.tsx
    - apps/web/src/components/docpipe/docpipe-workspace.tsx
    - apps/web/src/components/docpipe/results-preview.tsx
    - apps/web/src/components/docpipe/template-selector.tsx
    - apps/web/src/components/docpipe/upload-dropzone.tsx
    - apps/web/src/hooks/use-session-storage.ts
    - apps/web/src/lib/file-input.ts
    - apps/web/src/lib/templates.ts
  modified:
    - apps/web/src/app/page.tsx
key-decisions:
  - "Kept extraction entirely in the browser by calling createAnthropicProvider() and extract() from the shared DocPipe browser shim instead of adding a DocPipe-hosted API route."
  - "Stored the Anthropic API key only in sessionStorage through useSessionStorageState('docpipe.anthropicApiKey', '')."
  - "Widened the UI extraction call-site schema typing to Record<string, unknown> so all built-in template schemas stay compatible with isolatedDeclarations."
patterns-established:
  - "Interactive DocPipe flows live in apps/web/src/components/docpipe while app/page.tsx stays a server-rendered page frame."
  - "Unsupported file types are rejected at selection time before any extraction call starts."
requirements-completed: [INPUT-04, WEB-01, WEB-02, WEB-08]
duration: 5 min
completed: 2026-03-29
---

# Phase 04 Plan 03: Browser Extraction Workspace Summary

**Client-side DocPipe extraction with session-only Anthropic key storage, built-in templates, drag-and-drop upload, and in-page JSON confidence preview**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-29T12:45:05+02:00
- **Completed:** 2026-03-29T12:50:23+02:00
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- Added browser utilities for session-only API key state, supported document validation, base64 file reading, and the built-in invoice/receipt/W-2 template registry.
- Replaced the static shell with a client `DocpipeWorkspace` that validates uploads, builds the Anthropic model in-browser, calls the shared `extract()` path, and renders loading/error/result state inline.
- Split the page into focused DocPipe UI components for upload, API key entry, template selection, and result preview while keeping `apps/web/src/app/page.tsx` as a server-rendered frame.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add browser-side upload, template, and session-state utilities** - `e6bacae` (`feat`)
2. **Task 2: Build the interactive one-page extraction workspace** - `346e65c` (`feat`)

## Files Created/Modified

- `apps/web/src/hooks/use-session-storage.ts` - Added the reusable `useSessionStorageState()` hook and the DocPipe session storage key constant.
- `apps/web/src/lib/file-input.ts` - Added supported MIME type checks, the exact file input accept string, and browser base64 file reading.
- `apps/web/src/lib/templates.ts` - Added the built-in template registry for invoice, receipt, and W-2 extraction flows.
- `apps/web/src/components/docpipe/docpipe-workspace.tsx` - Added the client orchestration layer for upload validation, session key state, shared extraction, and result handling.
- `apps/web/src/components/docpipe/upload-dropzone.tsx` - Added drag-and-drop and click-to-select document input with inline error rendering.
- `apps/web/src/components/docpipe/api-key-field.tsx` - Added the Anthropic BYOK field with session-only helper copy.
- `apps/web/src/components/docpipe/template-selector.tsx` - Added the built-in template selector wired from the shared template registry.
- `apps/web/src/components/docpipe/results-preview.tsx` - Added the JSON preview panel and overall confidence display.
- `apps/web/src/app/page.tsx` - Reduced the page to a server-rendered frame that mounts the client workspace.

## Decisions Made

- Kept the extraction path fully in-browser and reused the shared `@docpipe/core/browser` surface instead of adding any `/api/extract` route.
- Drove the Anthropic key from `sessionStorage` only, which preserves the BYOK/privacy constraint and avoids any localStorage persistence.
- Serialized extraction output as formatted JSON immediately in the UI layer, which keeps the preview component simple and leaves export behavior to later plans.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Widened the shared extract call-site schema type for template unions**
- **Found during:** Task 2 (Build the interactive one-page extraction workspace)
- **Issue:** `pnpm --filter web type-check` and `pnpm --filter web build` failed because the union of built-in template schemas caused `extract()` to infer an overly narrow schema output under the repo's `isolatedDeclarations` setting.
- **Fix:** Called `extract<Record<string, unknown>>()` and cast the selected template schema to `ExtractOptions<Record<string, unknown>>['schema']` in the UI layer.
- **Files modified:** `apps/web/src/components/docpipe/docpipe-workspace.tsx`
- **Verification:** `pnpm --filter web type-check` and `pnpm --filter web build`
- **Committed in:** `346e65c`

---

**Total deviations:** 1 auto-fixed (Rule 3: 1)
**Impact on plan:** The fix was required for build correctness and did not change the planned browser-only product behavior.

## Issues Encountered

- `rg.exe` was not runnable in this workspace, so grep-style acceptance checks were executed with PowerShell `Select-String` instead.
- Shared planning-state updates were intentionally skipped because this executor only owns the listed web files plus `04-03-SUMMARY.md`, and touching shared planning files would risk conflicting with parallel work.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

The web app now satisfies the Phase 4 browser flow: supported uploads are validated before extraction, the Anthropic key stays in sessionStorage, built-in templates drive the shared extraction engine, and results render in-page with confidence. Follow-on plans can focus on richer result handling, exports, or polish without reworking the browser extraction path.

## Self-Check: PASSED

- Verified `.planning/phases/04-web-app-core-flow/04-03-SUMMARY.md` exists on disk.
- Verified task commits `e6bacae` and `346e65c` exist in git history.
- Stub-pattern scan only matched legitimate form placeholder attributes in the API key and template controls; no blocking TODO/FIXME or empty-data stubs were introduced for this plan goal.
