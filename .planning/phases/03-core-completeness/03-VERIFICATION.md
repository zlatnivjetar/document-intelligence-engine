---
phase: 03-core-completeness
verified: 2026-03-29T11:35:54.4277037+02:00
status: passed
score: 5/5 must-haves verified
re_verification:
  previous_status: "gaps_found"
  previous_score: 3/5
  gaps_closed:
    - "Receipt and W-2 now have committed known-answer PDF fixtures with exact confidence-backed extraction tests."
    - "Text-layer and image-only PDFs now take distinct processing paths proven by real fixtures and integration tests."
  gaps_remaining: []
  regressions: []
---

# Phase 03: Core Completeness Verification Report

**Phase Goal:** `@docpipe/core` is feature-complete - all three built-in templates are present and fixture-tested, the PDF routing layer handles text-layer and image-only documents correctly, business-rule validators catch anomalies, and custom schemas work end-to-end.
**Verified:** 2026-03-29T11:35:54.4277037+02:00
**Status:** passed
**Re-verification:** Yes - after gap closure plans 03-05 and 03-06

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Receipt and W-2 templates each extract correct values from a known-answer fixture document and return matching confidence labels. | VERIFIED | `packages/core/test/fixtures/receipt/known-answer.pdf`, `packages/core/test/fixtures/w2/known-answer.pdf`, and the paired `expected.json` manifests are committed; `packages/core/src/template-fixtures.test.ts` passed 2 fixture-backed cases asserting exact data, exact confidence labels, `overallConfidence`, `pdfType`, and no warnings. |
| 2 | Text-layer and image-only PDFs are handled correctly for routing behavior. | VERIFIED | `packages/core/src/pdf-router.ts` now exposes `analyzePdfRouting()` and `packages/core/src/extract.ts` branches on real routing analysis; `packages/core/src/pdf-routing.integration.test.ts` passed against committed `text-layer-routing.pdf` and `image-only-routing.pdf`, proving the text-layer branch contains extracted text and no file part while the image-only branch keeps the PDF file part path. |
| 3 | Business-rule validators flag anomalies as warnings without failing extraction. | VERIFIED | `packages/core/src/validators/invoice-validators.ts` still implements `ZERO_TOTAL`, `FUTURE_DATE`, and `LINE_ITEMS_SUBTOTAL_MISMATCH`; the validator suite and `extract.test.ts` continue to pass with warnings attached post-extraction. |
| 4 | A custom Zod schema passed to `extract()` works end-to-end. | VERIFIED | `packages/core/src/extract.test.ts` still includes the TMPL-04 custom-schema integration case and the full core test suite passes. |
| 5 | Web and CLI packages are thin consumers of `@docpipe/core` with no logic duplication. | VERIFIED | `apps/web/src/lib/docpipe.ts` remains a pure re-export shim; `packages/cli/src/index.ts` imports shared core values/types; the monorepo build and prior 03-04 verification remain intact with no local extraction logic added under web or CLI. |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/core/src/templates/receipt.ts` | Built-in receipt template | VERIFIED | Public schema/export still present and fixture-backed extraction coverage now exists |
| `packages/core/src/templates/w2.ts` | Built-in W-2 template | VERIFIED | Public schema/export still present and fixture-backed extraction coverage now exists |
| `packages/core/test/fixtures/receipt/known-answer.pdf` | Receipt known-answer document | VERIFIED | Text-layer fixture text matches receipt expectation manifest |
| `packages/core/test/fixtures/w2/known-answer.pdf` | W-2 known-answer document | VERIFIED | Text-layer fixture text matches W-2 expectation manifest |
| `packages/core/src/template-fixtures.test.ts` | Fixture-backed TMPL-02/TMPL-03 coverage | VERIFIED | Both template fixtures assert exact values and exact confidence labels |
| `packages/core/test/fixtures/pdf/text-layer-routing.pdf` | Real text-layer routing fixture | VERIFIED | `unpdf` extracts >50 non-whitespace characters including `Routing Sample Invoice` |
| `packages/core/test/fixtures/pdf/image-only-routing.pdf` | Real image-only routing fixture | VERIFIED | `unpdf` extracts fewer than 50 non-whitespace characters |
| `packages/core/src/pdf-router.ts` | Routing analysis and classifier | VERIFIED | Exports `analyzePdfRouting()` and `detectPdfType()`; returns extracted text only for true text-layer PDFs |
| `packages/core/src/extract.ts` | Distinct routing behavior before model call | VERIFIED | Text-layer PDFs use text-only prompt parts; image-only PDFs retain the PDF file part path |
| `packages/core/src/pdf-routing.integration.test.ts` | Fixture-backed routing proof | VERIFIED | Asserts request-shape divergence against real PDFs on disk |
| `packages/core/src/validators/invoice-validators.ts` | Invoice validator implementation | VERIFIED | Existing validator behavior remains intact under the expanded test suite |
| `apps/web/src/lib/docpipe.ts` | Thin web consumer shim | VERIFIED | Unchanged pure re-export shim over `@docpipe/core` |
| `packages/cli/src/index.ts` | Thin CLI consumer entry | VERIFIED | Unchanged shared-core import boundary |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Fixture PDFs classify correctly under `unpdf` | `pnpm --filter @docpipe/core exec node --input-type=module -e "<fixture verification>"` | Receipt, W-2, and text-layer routing PDFs exceed the threshold; image-only routing PDF stays below it | PASS |
| Core test suite passes | `pnpm --filter @docpipe/core test` | 77 tests passed across templates, routing, validators, extract, provider, and types | PASS |
| Core types still compile | `pnpm --filter @docpipe/core type-check` | Exit 0 | PASS |
| Monorepo build succeeds | `pnpm exec turbo build` | 3 successful builds (`@docpipe/core`, `@docpipe/cli`, `web`) | PASS |
| External consumer install still works | `node scripts/verify-consumer.mjs` | Tarball built, installed in a temp project, export probe passed, and 2 external smoke tests passed with `CONSUMER TEST PASSED` | PASS |

## Requirements Coverage

| Requirement | Status | Evidence |
|-------------|--------|----------|
| TMPL-02 | SATISFIED | Receipt schema now has a committed known-answer fixture and exact confidence-backed extraction assertions |
| TMPL-03 | SATISFIED | W-2 schema now has a committed known-answer fixture and exact confidence-backed extraction assertions |
| TMPL-04 | SATISFIED | Custom Zod schema extract() integration test still passes |
| EXTRACT-07 | SATISFIED | Validators continue returning warnings through `extract()` without failing extraction |
| INPUT-03 | SATISFIED | Real text-layer PDFs route through extracted text while image-only PDFs keep the PDF file path, proven by fixture-backed integration tests |
| LIB-03 | SATISFIED | Web and CLI remain thin consumers of the shared core package |

## Anti-Patterns Found

None.

## Human Verification Required

None. The prior 03-04 consumer-boundary approval remains valid, and all former automated gaps are now covered by committed fixtures, integration tests, package tests, and the external consumer smoke test.

## Gaps Summary

**No gaps found.** The previous verification gaps are closed:

- Receipt and W-2 coverage now includes committed known-answer fixtures plus exact confidence assertions.
- PDF routing now performs real branch divergence instead of metadata-only annotation and is proven against real text-layer and image-only PDFs.

Phase 03 goal is fully achieved.

## Verification Metadata

**Verification approach:** Goal-backward against the Phase 03 goal and success criteria in `ROADMAP.md`
**Must-haves source:** Phase 03 success criteria plus the 03-04 consumer-boundary checkpoint
**Automated checks:** 5 passed, 0 failed
**Human checks completed:** 1 prior approval checkpoint
**Total verification time:** 3 min

---
*Verified: 2026-03-29T11:35:54.4277037+02:00*
*Verifier: Codex*
