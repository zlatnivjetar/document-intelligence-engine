---
phase: 03-core-completeness
verified: 2026-03-29T10:36:06.0148172+02:00
status: gaps_found
score: 3/5 must-haves verified
---

# Phase 03: Core Completeness Verification Report

**Phase Goal:** `@docpipe/core` is feature-complete - all three built-in templates are present and fixture-tested, the PDF routing layer handles text-layer and image-only documents correctly, business-rule validators catch anomalies, and custom schemas work end-to-end.
**Verified:** 2026-03-29T10:36:06.0148172+02:00
**Status:** gaps_found

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Receipt and W-2 templates each extract correct values from a known-answer fixture document and return matching confidence labels. | GAP | `packages/core/src/templates/receipt.ts` and `packages/core/src/templates/w2.ts` are implemented and covered by schema tests; `packages/core/src/extract.test.ts` adds mocked extract() tests for both templates. However, no known-answer fixture documents or fixture-based confidence assertions were added in Phase 03. |
| 2 | Text-layer and image-only PDFs are handled correctly for routing behavior. | GAP | `packages/core/src/pdf-router.ts` classifies PDFs as `text-layer` or `image-only`, and `extract()` annotates results with `pdfType`. The current implementation does not branch into distinct processing paths, and no real scanned/text-layer PDF fixtures were added to verify end-to-end behavior. |
| 3 | Business-rule validators flag anomalies as warnings without failing extraction. | VERIFIED | `packages/core/src/validators/invoice-validators.ts` implements `ZERO_TOTAL`, `FUTURE_DATE`, and `LINE_ITEMS_SUBTOTAL_MISMATCH`; `packages/core/src/extract.ts` runs validators after successful extraction and attaches optional `warnings`; tests cover both validator rules and extract() integration. |
| 4 | A custom Zod schema passed to `extract()` works end-to-end. | VERIFIED | `packages/core/src/extract.test.ts` includes a TMPL-04 custom-schema integration test proving a non-built-in schema returns typed data, confidence values, and no warnings by default. |
| 5 | Web and CLI packages are thin consumers of `@docpipe/core` with no logic duplication. | VERIFIED | `apps/web/src/lib/docpipe.ts` is a pure re-export shim over `@docpipe/core`; `packages/cli/src/index.ts` imports shared core values and types; no `extract` or `z.object` definitions were found under `apps/web/src/` or `packages/cli/src/`. |

**Score:** 3/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/core/src/templates/receipt.ts` | Built-in receipt template | VERIFIED | Exports `receiptSchema` and `ReceiptData`; schema tests pass |
| `packages/core/src/templates/w2.ts` | Built-in W-2 template | VERIFIED | Exports `w2Schema` and `W2Data`; schema tests pass |
| `packages/core/src/pdf-router.ts` | PDF type detector | VERIFIED | Exports `detectPdfType` and `PdfType`; threshold and fallback tests pass |
| `packages/core/src/validators/invoice-validators.ts` | Invoice validator implementation | VERIFIED | Exports `validateInvoice` with all three warning rules |
| `apps/web/src/lib/docpipe.ts` | Thin web consumer shim | VERIFIED | Re-exports core values/types only |
| `packages/cli/src/index.ts` | Thin CLI consumer entry | VERIFIED | Imports shared core values/types only |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Core test suite passes | `pnpm --filter @docpipe/core test` | 71 tests passed across templates, routing, validators, extract, provider, and types | PASS |
| Core types still compile | `pnpm --filter @docpipe/core type-check` | Exit 0 | PASS |
| Monorepo build succeeds | `pnpm exec turbo build` | 3 successful package builds (`@docpipe/core`, `@docpipe/cli`, `web`) | PASS |
| No consumer logic duplication | `Select-String` / source search in `apps/web/src` and `packages/cli/src` | No local `extract` or `z.object` definitions found in consumer code | PASS |

## Requirements Coverage

| Requirement | Status | Evidence |
|-------------|--------|----------|
| TMPL-02 | PARTIAL | Receipt schema exists and extract() can consume it via mocked integration tests, but no known-answer receipt fixture was verified |
| TMPL-03 | PARTIAL | W-2 schema exists and extract() can consume it via mocked integration tests, but no known-answer W-2 fixture was verified |
| TMPL-04 | SATISFIED | Custom Zod schema extract() integration test passes |
| EXTRACT-07 | SATISFIED | Validators return warnings through extract() without failing extraction |
| INPUT-03 | PARTIAL | PDF type detection and annotation are implemented, but distinct processing-path behavior is not verified against real PDFs |
| LIB-03 | SATISFIED | Web and CLI remain thin consumers of the shared core package |

## Anti-Patterns Found

None.

## Human Verification Required

No additional manual setup is required. The 03-04 consumer checkpoint was satisfied by the executed build/test commands and direct source inspection, but the phase still has implementation gaps relative to the roadmap goal.

## Gaps Summary

### 1. Missing fixture-based validation for receipt and W-2 templates

- The roadmap requires known-answer fixture documents and confidence validation for the new built-in templates.
- Current coverage proves schema correctness and mocked extract() typing, but not behavior against real documents.

### 2. Routing semantics are weaker than the roadmap promise

- The roadmap still says text-layer and image-only PDFs route through distinct handling paths.
- Current implementation classifies and annotates PDFs with `pdfType`, but both continue through the same extraction flow.
- This can be closed either by implementing real path divergence or by explicitly updating the roadmap/requirements to the chosen annotation-based design.

## Verification Metadata

**Verification approach:** Goal-backward against the Phase 03 goal and success criteria in `ROADMAP.md`
**Automated checks:** 4 passed, 0 failed
**Human checks completed:** 1 consumer-boundary approval
**Total verification time:** 2 min

---
*Verified: 2026-03-29T10:36:06.0148172+02:00*
*Verifier: Codex*
