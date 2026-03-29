---
phase: 04-web-app-core-flow
verified: 2026-03-29T13:56:31.6703007Z
status: passed
score: 4/4 must-haves verified
---

# Phase 4: Web App - Core Flow Verification Report

**Phase Goal:** Users can visit the web app, upload a document, enter their API key, select a template, and trigger extraction - producing a basic result display that confirms the pipeline works end-to-end in the browser.
**Verified:** 2026-03-29T13:56:31.6703007Z
**Status:** passed
**Re-verification:** No - initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | User can drag and drop or click-select PDF, PNG, and JPG files, and unsupported files are rejected with an inline error before extraction. | VERIFIED | `UploadDropzone` supports drag/drop, click-to-select, and inline error rendering (`apps/web/src/components/docpipe/upload-dropzone.tsx:22-107`). `DocpipeWorkspace.handleFileSelect()` rejects unsupported types before extraction and forwards the error to the dropzone (`apps/web/src/components/docpipe/docpipe-workspace.tsx:105-116`, `apps/web/src/components/docpipe/docpipe-workspace.tsx:188-193`). |
| 2 | The API key stays in browser storage only and there is no DocPipe-hosted extraction endpoint in the web flow. | VERIFIED | `useSessionStorageState()` reads/writes `window.sessionStorage` only (`apps/web/src/hooks/use-session-storage.ts:22-104`). `DocpipeWorkspace` stores provider and API key through that hook and passes the trimmed key directly to provider factories (`apps/web/src/components/docpipe/docpipe-workspace.tsx:91-96`, `apps/web/src/components/docpipe/docpipe-workspace.tsx:147-163`). Source scan found no `localStorage`, no client `fetch`/`axios`, and the only App Router API route is `apps/web/src/app/api/pdf-inspect/route.ts`. |
| 3 | Users can choose a built-in template, trigger extraction through the shared browser entrypoint, and the page renders JSON output plus overall confidence. | VERIFIED | `TemplateSelector` renders built-in choices from `BUILT_IN_TEMPLATES` (`apps/web/src/components/docpipe/template-selector.tsx:28-44`, `apps/web/src/lib/templates.ts:16-41`). `DocpipeWorkspace.handleExtract()` calls `extract()` from `@/lib/docpipe`, then stores `resultJson` and `overallConfidence` (`apps/web/src/components/docpipe/docpipe-workspace.tsx:147-166`). `ResultsPreview` renders both values in-page (`apps/web/src/components/docpipe/results-preview.tsx:22-54`). |
| 4 | The app is production-ready for this phase: it builds cleanly, exposes the PDF inspect route, and the browser extraction flow works on Vercel. | VERIFIED | Local `pnpm --filter web build` emitted `/` plus `/api/pdf-inspect`. Human production verification then confirmed `POST /api/pdf-inspect` returned `{"filename":"racun-01-2026.pdf","sizeBytes":68338,"pdfType":"text-layer","elapsedMs":315}` on Vercel, a live extraction rendered JSON plus 100% confidence in-page, and DevTools showed direct provider traffic to `https://api.openai.com/v1/responses` with no `/api/extract` or DocPipe-hosted provider-key leakage. |

**Score:** 4/4 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `packages/core/src/browser.ts` | Browser-safe public entrypoint | VERIFIED | Re-exports extraction, provider factories, and built-in schemas (`packages/core/src/browser.ts:1-25`). |
| `packages/core/package.json` | Publishes `@docpipe/core/browser` export | VERIFIED | `exports["./browser"]` is present (`packages/core/package.json:10-20`). |
| `apps/web/src/lib/docpipe.ts` | Thin web shim over `@docpipe/core/browser` | VERIFIED | Re-exports browser entry without extra logic (`apps/web/src/lib/docpipe.ts:1-20`). |
| `apps/web/next.config.ts` | Next transpiles workspace package | VERIFIED | `transpilePackages: ["@docpipe/core"]` is set (`apps/web/next.config.ts:3-5`). |
| `apps/web/src/app/globals.css` | Tailwind v4 + UI token foundation | VERIFIED | Imports Tailwind and defines Phase 4 palette/type tokens (`apps/web/src/app/globals.css:1-41`). |
| `apps/web/components.json` | shadcn new-york configuration | VERIFIED | New-york preset, CSS variables, aliases are wired (`apps/web/components.json`). |
| `apps/web/src/app/page.tsx` | One-page Phase 4 shell mounting the workspace | VERIFIED | Server page mounts `DocpipeWorkspace` and matches key UI-SPEC copy (`apps/web/src/app/page.tsx:11-29`). |
| `apps/web/src/components/docpipe/docpipe-workspace.tsx` | Client orchestration for upload, BYOK, template, extraction, results | VERIFIED | Owns the full Phase 4 interaction state and extraction call (`apps/web/src/components/docpipe/docpipe-workspace.tsx:87-270`). |
| `apps/web/src/hooks/use-session-storage.ts` | Session-only storage helper | VERIFIED | Storage reads/writes are scoped to `window.sessionStorage` (`apps/web/src/hooks/use-session-storage.ts:22-104`). |
| `apps/web/src/lib/templates.ts` | Built-in template registry | VERIFIED | Includes `invoice`, `receipt`, and `w2` definitions (`apps/web/src/lib/templates.ts:16-41`). |
| `apps/web/src/app/api/pdf-inspect/route.ts` | Diagnostic PDF inspect route | VERIFIED | POST route parses upload, calls `detectPdfType()`, returns JSON (`apps/web/src/app/api/pdf-inspect/route.ts:10-30`). |
| `apps/web/src/lib/pdf-inspect.ts` | Request parsing and response shaping for inspect route | VERIFIED | Validates PDF upload and shapes route response (`apps/web/src/lib/pdf-inspect.ts:13-53`). |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `apps/web/src/app/page.tsx` | `apps/web/src/components/docpipe/docpipe-workspace.tsx` | `<DocpipeWorkspace />` mount | WIRED | Server page mounts the client workspace (`apps/web/src/app/page.tsx:28`). |
| `apps/web/src/components/docpipe/docpipe-workspace.tsx` | `apps/web/src/lib/docpipe.ts` | `createAnthropicProvider`, `createOpenAIProvider`, `extract` imports | WIRED | Shared browser shim is used for extraction, not reimplemented locally (`apps/web/src/components/docpipe/docpipe-workspace.tsx:12-18`, `apps/web/src/components/docpipe/docpipe-workspace.tsx:149-163`). |
| `apps/web/src/lib/docpipe.ts` | `packages/core/src/browser.ts` | `@docpipe/core/browser` export | WIRED | Thin re-export link exists exactly as planned (`apps/web/src/lib/docpipe.ts:1-20`). |
| `apps/web/src/components/docpipe/docpipe-workspace.tsx` | `apps/web/src/hooks/use-session-storage.ts` | `useSessionStorageState()` for provider and API key | WIRED | Provider and key are sourced from session-only storage (`apps/web/src/components/docpipe/docpipe-workspace.tsx:24-29`, `apps/web/src/components/docpipe/docpipe-workspace.tsx:91-96`). |
| `apps/web/src/components/docpipe/template-selector.tsx` | `apps/web/src/lib/templates.ts` | `BUILT_IN_TEMPLATES.map(...)` | WIRED | Selector options are driven by the shared template registry (`apps/web/src/components/docpipe/template-selector.tsx:9-12`, `apps/web/src/components/docpipe/template-selector.tsx:37-42`). |
| `apps/web/src/components/docpipe/docpipe-workspace.tsx` | `apps/web/src/components/docpipe/results-preview.tsx` | `resultJson` and `overallConfidence` props | WIRED | Extraction results flow into the preview card (`apps/web/src/components/docpipe/docpipe-workspace.tsx:165-166`, `apps/web/src/components/docpipe/docpipe-workspace.tsx:263-267`). |
| `apps/web/src/app/api/pdf-inspect/route.ts` | `packages/core/src/pdf-router.ts` | `detectPdfType(buffer)` | WIRED | Diagnostic route delegates PDF classification to the shared core router (`apps/web/src/app/api/pdf-inspect/route.ts:12-21`, `packages/core/src/pdf-router.ts:34-37`). |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| --- | --- | --- | --- | --- |
| `apps/web/src/components/docpipe/docpipe-workspace.tsx` | `resultJson`, `overallConfidence` | User-selected file -> `readFileAsBase64()` -> `extract()` -> state setters | Yes | FLOWING |
| `apps/web/src/components/docpipe/results-preview.tsx` | `resultJson`, `overallConfidence` props | `DocpipeWorkspace` state populated from extraction result | Yes | FLOWING |
| `apps/web/src/components/docpipe/upload-dropzone.tsx` | `fileName`, `errorMessage` props | `DocpipeWorkspace` file/error state | Yes | FLOWING |
| `apps/web/src/app/api/pdf-inspect/route.ts` | `filename`, `sizeBytes`, `pdfType`, `elapsedMs` | Multipart upload + `detectPdfType()` + timer | Yes | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Core extract accepts browser `ArrayBuffer` input | `pnpm --filter @docpipe/core test -- src/extract.test.ts -t "accepts ArrayBuffer browser input and encodes it as base64"` | 1 test passed | PASS |
| Built-in template extraction path is covered in core tests | `pnpm --filter @docpipe/core test -- src/extract.test.ts -t "TMPL-02: receiptSchema works end-to-end"` | 1 test passed | PASS |
| Web app compiles with current browser flow code | `pnpm --filter web type-check` | Passed with no TypeScript errors | PASS |
| Production build emits the Phase 4 page and inspect route | `pnpm --filter web build` | Next build passed; emitted `/` and `/api/pdf-inspect` | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| `INPUT-04` | `04-02-PLAN.md`, `04-03-PLAN.md` | Web app provides drag-and-drop upload with visual feedback and file type validation | SATISFIED | Drag/drop UI and inline validation are implemented (`apps/web/src/components/docpipe/upload-dropzone.tsx:55-107`, `apps/web/src/components/docpipe/docpipe-workspace.tsx:105-116`). |
| `WEB-01` | `04-01-PLAN.md`, `04-03-PLAN.md`, `04-04-PLAN.md` | BYOK API key input stored in browser only (localStorage/sessionStorage), never sent to server | SATISFIED | Session-only storage helper plus no DocPipe-hosted extraction route in client code (`apps/web/src/hooks/use-session-storage.ts:22-104`, `apps/web/src/components/docpipe/docpipe-workspace.tsx:91-96`, `apps/web/src/app/api/pdf-inspect/route.ts`). |
| `WEB-02` | `04-01-PLAN.md`, `04-03-PLAN.md`, `04-04-PLAN.md` | Live extraction preview - results appear in-page as extraction completes | SATISFIED | `handleExtract()` stores `resultJson`/`overallConfidence`, and `ResultsPreview` renders them in-page (`apps/web/src/components/docpipe/docpipe-workspace.tsx:147-166`, `apps/web/src/components/docpipe/results-preview.tsx:35-51`). |
| `WEB-08` | `04-02-PLAN.md`, `04-03-PLAN.md` | Template selection UI - users pick from built-in templates or provide custom schema | SATISFIED | Built-in template selection is implemented for invoice/receipt/W-2 (`apps/web/src/lib/templates.ts:16-41`, `apps/web/src/components/docpipe/template-selector.tsx:28-44`). Custom schema input is separately tracked by `WEB-07` in Phase 5. |

No orphaned Phase 4 requirements were found in `REQUIREMENTS.md`; the Phase 4 mapping table contains exactly `INPUT-04`, `WEB-01`, `WEB-02`, and `WEB-08`. The tracking rows in `REQUIREMENTS.md` still mark `INPUT-04` and `WEB-08` as pending, but the current codebase implements both.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| None | - | No blocker anti-patterns in Phase 04 code | INFO | Regex sweep only matched benign placeholder labels, null guards, and test-fixture values; no TODO/FIXME, stub handlers, or empty user-visible implementations were found. |

### Human Verification Completed

### 1. Live Browser Extraction

**Completed:** Approved by the user on 2026-03-29 after uploading a real document, selecting a template, and running extraction with a real OpenAI key.
**Observed result:** The deployed app rendered structured invoice JSON in-page with `Confidence score 100%`.

### 2. Browser Network Boundary

**Completed:** Approved by the user on 2026-03-29 with DevTools Network open.
**Observed result:** The extraction request went directly to `https://api.openai.com/v1/responses`; no `/api/extract` request was present, and no DocPipe-hosted request carried the provider key.

### 3. Vercel Production Check

**Completed:** Approved by the user on 2026-03-29 against the deployed Vercel app.
**Observed result:** `POST /api/pdf-inspect` returned a successful JSON response with `filename`, `sizeBytes`, `pdfType`, and `elapsedMs`, and the extraction flow completed in production.

### Gaps Summary

No code gaps blocking the Phase 4 goal were found in the current repository. The browser upload, BYOK storage, template selection, extraction wiring, result preview, and PDF inspect route all exist, are substantive, are wired, pass build-level checks, and are now confirmed by human production verification.

---

_Verified: 2026-03-29T13:56:31.6703007Z_
_Verifier: Claude (gsd-verifier)_
