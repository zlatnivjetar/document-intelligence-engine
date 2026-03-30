---
phase: 05-web-app-results-export
verified: 2026-03-30T07:56:26.8213653+02:00
status: passed
score: 4/4 must-haves verified
re_verification:
  previous_status: gaps_found
  previous_score: 3/4
  gaps_closed:
    - "Invalid-key and rate-limit UI copy is now provider-neutral, so OpenAI users no longer receive Anthropic-specific error messaging."
  gaps_remaining: []
  regressions: []
---

# Phase 05: web-app-results-export Verification Report

**Phase Goal:** Users can paste a custom Zod schema in the web UI, extract against it or a built-in template in the existing one-page flow, see results in a table with field-level confidence color-coding, and export/copy results with clear actionable UI error states.
**Verified:** 2026-03-30T07:56:26.8213653+02:00
**Status:** passed
**Re-verification:** Yes - after provider-neutral error-copy gap closure

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Results are displayed in a table with each field color-coded by confidence level (green >= 0.85, amber 0.60-0.84, red < 0.60). | VERIFIED | `apps/web/src/components/docpipe/result-confidence-table.tsx` renders `Field / Value / Confidence`, applies the 0.85 and 0.60 thresholds, uses `--color-confidence-high`, `--color-confidence-medium`, and `--color-confidence-low`, and is mounted from `apps/web/src/components/docpipe/results-preview.tsx`. |
| 2 | User can export results as a JSON file download, a CSV file download, or copy JSON to clipboard with instant visual confirmation. | VERIFIED | `apps/web/src/lib/result-export.ts` implements JSON download, CSV download with `field,value,confidence`, and clipboard copy. `apps/web/src/components/docpipe/results-preview.tsx` renders `Download JSON`, `Download CSV`, and `Copy JSON`, and flips copy feedback to `Copied JSON` or `Copy failed` for 2000 ms. |
| 3 | User can paste a custom Zod schema in the web UI and trigger extraction using that schema instead of a built-in template. | VERIFIED | `apps/web/src/components/docpipe/custom-schema-editor.tsx` renders the inline schema editor, `apps/web/src/lib/custom-schema.ts` compiles and validates pasted `z.object(...)` input, and `apps/web/src/components/docpipe/docpipe-workspace.tsx` branches to `compileCustomSchema(customSchemaSource)` before calling the shared `extract()` path. |
| 4 | Error states are clearly displayed in the UI for invalid API key, unsupported file format, extraction failure, and validation failure after retries, each with a distinct actionable message. | VERIFIED | `apps/web/src/lib/extraction-error-state.ts` now maps `INVALID_API_KEY` and `RATE_LIMITED` with provider-neutral copy while preserving the existing unsupported-file, extraction-failure, and validation-failure states. `apps/web/src/components/docpipe/results-preview.tsx` still renders the shared error card. A local browser smoke check against the web app forced an OpenAI-style `401` response and rendered `API key rejected` with provider-neutral wording. |

**Score:** 4/4 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `apps/web/src/app/page.tsx` | Mount the Phase 05 workspace in the app entry page | VERIFIED | Home page imports and renders `<DocpipeWorkspace />`, and the page-level provider guidance is now provider-neutral. |
| `apps/web/src/components/docpipe/docpipe-workspace.tsx` | Keep the one-page extraction flow, branch between built-in and custom schema extraction, and hand result state to the preview | VERIFIED | Stores `result` and `resultError`, compiles custom schemas, calls shared `extract()`, and passes `result`, `resultError`, and `sourceFileName` into `ResultsPreview`. |
| `apps/web/src/lib/custom-schema.ts` | Compile browser-pasted schemas into a usable `z.ZodObject` for extraction | VERIFIED | Rejects empty input, uses `new Function("z", ...)`, wraps parse errors, and guards for top-level `z.object(...)`. |
| `apps/web/src/components/docpipe/custom-schema-editor.tsx` | Inline UI for entering a custom Zod schema | VERIFIED | Renders the required label, helper copy, placeholder schema, and Zod usage note. |
| `apps/web/src/components/docpipe/template-selector.tsx` | Allow switching between built-in templates and custom schema mode | VERIFIED | Supports `BuiltInTemplateId | "custom" | ""` and exposes `Custom Zod schema` as a selectable option. |
| `apps/web/src/components/docpipe/result-confidence-table.tsx` | Show top-level fields, values, and confidence bands | VERIFIED | Renders a semantic table, formats scalar/null/object values, and color-bands confidence text at the roadmap thresholds. |
| `apps/web/src/components/docpipe/results-preview.tsx` | Render empty, success, and error states plus in-card export actions | VERIFIED | Shows overall confidence, optional `pdfType`, table render path, export button row, and validation detail list. |
| `apps/web/src/lib/result-export.ts` | Provide browser-only JSON, CSV, and clipboard export helpers | VERIFIED | Uses `Blob`, `URL.createObjectURL`, quoted CSV rows, and `navigator.clipboard.writeText`. |
| `apps/web/src/lib/extraction-error-state.ts` | Convert extraction failures into clear user-facing error copy | VERIFIED | The required error codes are mapped to distinct actionable states, and invalid-key/rate-limit messaging is now provider-neutral. |
| `apps/web/src/app/globals.css` | Supply semantic confidence colors used by the results table | VERIFIED | Defines the high/medium/low confidence CSS tokens consumed by `ResultConfidenceTable`. |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `apps/web/src/app/page.tsx` | `apps/web/src/components/docpipe/docpipe-workspace.tsx` | `<DocpipeWorkspace />` | WIRED | The app home route mounts the phase UI directly. |
| `apps/web/src/components/docpipe/docpipe-workspace.tsx` | `@docpipe/core/browser` | `extract({ input, schema, model, schemaName, schemaDescription })` | WIRED | Both built-in and custom schema branches converge on the shared core extract call. |
| `apps/web/src/components/docpipe/docpipe-workspace.tsx` | `apps/web/src/lib/custom-schema.ts` | `compileCustomSchema(customSchemaSource)` | WIRED | Verified by `gsd-tools verify key-links` for `05-01-PLAN.md`. |
| `apps/web/src/components/docpipe/docpipe-workspace.tsx` | `apps/web/src/lib/extraction-error-state.ts` | `toExtractionErrorState(error)` | WIRED | The shared mapper remains the single error-state translation path, and the copy is now correct for both supported providers without extra provider context. |
| `apps/web/src/components/docpipe/docpipe-workspace.tsx` | `apps/web/src/components/docpipe/results-preview.tsx` | `result`, `resultError`, and `sourceFileName` props | WIRED | Verified by `gsd-tools verify key-links` for `05-03-PLAN.md`. |
| `apps/web/src/components/docpipe/results-preview.tsx` | `apps/web/src/components/docpipe/result-confidence-table.tsx` | `data={result.data}` and `confidence={result.confidence}` | WIRED | Verified by `gsd-tools verify key-links` for `05-02-PLAN.md`. |
| `apps/web/src/components/docpipe/results-preview.tsx` | `apps/web/src/lib/result-export.ts` | `downloadResultJson`, `downloadResultCsv`, and `copyResultJson` | WIRED | Verified by `gsd-tools verify key-links` for `05-03-PLAN.md`. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| --- | --- | --- | --- | --- |
| `apps/web/src/components/docpipe/docpipe-workspace.tsx` | `result` | `await extract(...)` from `apps/web/src/lib/docpipe.ts` | `packages/core/src/extract.ts` calls `generateObject(...)` and returns `result.object.extracted` plus `result.object.confidence` | FLOWING |
| `apps/web/src/components/docpipe/results-preview.tsx` | `result` | Prop from `DocpipeWorkspace` state | Uses the live `ExtractionResult` object, not a serialized JSON shadow state | FLOWING |
| `apps/web/src/components/docpipe/result-confidence-table.tsx` | `data` and `confidence` | Props from `ResultsPreview` | Renders top-level extraction fields and confidence scores directly from the shared result object | FLOWING |
| `apps/web/src/lib/custom-schema.ts` | `schemaValue` | User-pasted source compiled with `new Function("z", ...)` | Returns a real `z.ZodObject` plus metadata for the shared extract path | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Web package type safety | `pnpm --filter web type-check` | `tsc --noEmit` passed | PASS |
| Web production build | `pnpm --filter web build` | `next build` passed; `/` prerendered static, `/api/pdf-inspect` dynamic | PASS |
| OpenAI invalid-key UI copy | Local browser smoke check against the web app with a controlled OpenAI-style `401` response | Error card rendered `API key rejected` with provider-neutral copy and no Anthropic mention | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| `WEB-03` | `05-02-PLAN.md` | Results displayed in table with field-level confidence color-coding | SATISFIED | `ResultConfidenceTable` implements the roadmap thresholds and `ResultsPreview` renders it from `result.data` and `result.confidence`. |
| `WEB-04` | `05-03-PLAN.md` | Export results as JSON (file download) | SATISFIED | `Download JSON` triggers `downloadResultJson(fileStem, result.data)`. |
| `WEB-05` | `05-03-PLAN.md` | Export results as CSV (file download) | SATISFIED | `Download CSV` triggers `downloadResultCsv(fileStem, result)` and writes the required `field,value,confidence` header. |
| `WEB-06` | `05-03-PLAN.md` | Copy JSON to clipboard with instant visual feedback | SATISFIED | `copyResultJson()` writes formatted JSON and the button label flips for 2000 ms. |
| `WEB-07` | `05-01-PLAN.md` | Custom Zod schema input in the web UI | SATISFIED | Inline editor plus `compileCustomSchema(customSchemaSource)` route custom extraction through the shared extract call. |

No orphaned Phase 05 requirement IDs were found. Plan frontmatter accounts for `WEB-03`, `WEB-04`, `WEB-05`, `WEB-06`, and `WEB-07`.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| N/A | N/A | No blocker TODO/FIXME/not-implemented markers found in the Phase 05 source files | INFO | Broad placeholder/null-guard matches were legitimate UI placeholders and state guards, not stubs or hollow implementations. |

### Human Verification Required

None. The earlier verification already covered the remaining Phase 05 surface area, and the gap-closing re-verification added a browser invalid-key smoke check for the OpenAI path.

### Gaps Summary

**No gaps found.** The previous Phase 05 verification gap is closed:

- Invalid-key and rate-limit UI messaging no longer hardcodes Anthropic, so both Anthropic and OpenAI users see accurate actionable copy.

Phase 05 goal is fully achieved.

---

_Verified: 2026-03-30T07:56:26.8213653+02:00_
_Verifier: Codex_
