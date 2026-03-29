---
phase: 02-extraction-pipeline-invoice-template
verified: 2026-03-29T07:04:16.6991503Z
status: passed
score: 5/5 must-haves verified
---

# Phase 02: Extraction Pipeline + Invoice Template Verification Report

**Phase Goal:** `@docpipe/core` contains a working extraction pipeline and invoice template - a developer can call `extract()` with a PDF or image and receive a validated, typed result with confidence scores, and the package can be installed from npm by an external consumer.
**Verified:** 2026-03-29T07:04:16.6991503Z
**Status:** passed

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A developer can call `extract()` with a PDF or image and receive a typed extraction result with per-field confidence scores. | VERIFIED | `packages/core/src/extract.ts` implements generic schema-driven extraction for `application/pdf`, `image/png`, and `image/jpeg`; `pnpm --filter @docpipe/core test` passed 12 `extract.test.ts` cases covering routing, typed payloads, and confidence normalization. |
| 2 | Validation failures retry up to two times and feed schema feedback back into the model call path. | VERIFIED | `extract.ts` wraps `extractCore()` with a bounded retry loop and appends validation feedback to retry prompts; `extract.test.ts` covers retry prompting and validation exhaustion. |
| 3 | The engine returns distinct actionable error states for invalid API key, rate limit, unsupported file type, extraction failure, and validation failure after retries. | VERIFIED | `extract.ts` returns `INVALID_API_KEY`, `RATE_LIMITED`, `UNSUPPORTED_FILE_TYPE`, `EXTRACTION_FAILED`, and `VALIDATION_FAILED`; tests cover 401, 429, unsupported mime types, generic provider failure, and exhausted retries. |
| 4 | `@docpipe/core` installs and runs in a fresh project outside the monorepo with no missing-module errors. | VERIFIED | `node scripts/verify-consumer.mjs` built the package, ran `npm pack --json`, audited the tarball, installed it into a temp consumer project, verified public exports, and passed 2 external smoke tests with `CONSUMER TEST PASSED`. |
| 5 | The built-in invoice template is present and publicly exported with the required invoice fields. | VERIFIED | `packages/core/src/templates/invoice.ts` exports `invoiceSchema` and `InvoiceData`; `invoice.test.ts` passed 7 cases, and the consumer verification probe confirmed the 10 expected invoice fields from the installed tarball. |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/core/src/extract.ts` | Public extraction entrypoint with routing, confidence scoring, retry logic, and error classification | VERIFIED | Exports `extract` plus `ExtractOptions`; handles PDF/PNG/JPEG routing and wraps provider failures into public error codes |
| `packages/core/src/templates/invoice.ts` | Built-in invoice template with all TMPL-01 fields | VERIFIED | Exports `invoiceSchema` and `InvoiceData`; nullable optional invoice fields are explicitly encoded |
| `packages/core/src/index.ts` | Public barrel for extract and invoice template exports | VERIFIED | Re-exports `extract`, `ExtractOptions`, `invoiceSchema`, and `InvoiceData` from `@docpipe/core` |
| `packages/core/package.json` | Publish-ready package manifest | VERIFIED | Exports map is types-first, peers are `ai` and `zod`, `files` is limited to `dist`, and Node engine is declared |
| `scripts/verify-consumer.mjs` | External consumer verification workflow | VERIFIED | Packs, audits, installs, probes exports, and runs a public-API smoke test outside the monorepo |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `packages/core/src/index.ts` | `packages/core/src/extract.ts` | Barrel re-export | VERIFIED | Public package entrypoint exposes `extract` and `ExtractOptions` |
| `packages/core/src/index.ts` | `packages/core/src/templates/invoice.ts` | Barrel re-export | VERIFIED | Public package entrypoint exposes `invoiceSchema` and `InvoiceData` |
| `scripts/verify-consumer.mjs` | `packages/core/package.json` | `npm pack --json` + tarball audit | VERIFIED | The script rejects tarballs that leak `src/`, `node_modules/`, or `*.test.*` and asserts `dist/` is present |
| `scripts/verify-consumer.mjs` | installed `@docpipe/core` tarball | `node probe.mjs` + `npx vitest run consumer.test.mjs` | VERIFIED | Installed package exports load correctly and an external `extract()` invocation reaches the wrapped `EXTRACTION_FAILED` path instead of a missing-module error |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Core test suite passes | `pnpm --filter @docpipe/core test` | 37 tests passed across `types`, `provider`, `extract`, and `invoice` suites | PASS |
| TypeScript contract holds | `pnpm --filter @docpipe/core type-check` | Exit 0 | PASS |
| External consumer install works | `node scripts/verify-consumer.mjs` | Tarball installed in temp project, export probe passed, 2 smoke tests passed, `CONSUMER TEST PASSED` printed | PASS |
| Monorepo build still succeeds | `pnpm build` | Turbo reported 3 successful builds across `@docpipe/core`, `@docpipe/cli`, and `web` | PASS |

## Requirements Coverage

| Requirement | Status | Evidence |
|-------------|--------|----------|
| INPUT-01 | SATISFIED | `extract.ts` accepts `application/pdf`; routing and tests cover PDF input |
| INPUT-02 | SATISFIED | `extract.ts` accepts PNG and JPEG inputs; routing and tests cover image input |
| EXTRACT-01 | SATISFIED | `extract()` drives `generateObject()` against a caller-provided schema |
| EXTRACT-02 | SATISFIED | `extract<T>()` is schema-driven and returns typed data from the supplied Zod schema |
| EXTRACT-03 | SATISFIED | Public results include per-field confidence plus an overall confidence score |
| EXTRACT-04 | SATISFIED | Validation failures retry up to two times with corrective feedback |
| EXTRACT-05 | SATISFIED | All five public extraction error codes are implemented and tested |
| EXTRACT-08 | SATISFIED | 401 and 429 failures do not retry; validation retries are capped at two |
| TMPL-01 | SATISFIED | `invoiceSchema` includes all required invoice fields and public typing |
| LIB-01 | SATISFIED | External `npm pack` and fresh-project install verification passed end-to-end |

## Anti-Patterns Found

None.

## Human Verification Required

None - automated checks passed, and the required 02-04 human approval checkpoint was completed on 2026-03-29.

## Gaps Summary

**No gaps found.** Phase goal achieved. Ready to proceed to Phase 03.

## Verification Metadata

**Verification approach:** Goal-backward against the Phase 02 goal and success criteria in `ROADMAP.md`
**Must-haves source:** Phase 02 success criteria plus the 02-04 consumer-verification checkpoint
**Automated checks:** 4 passed, 0 failed
**Human checks completed:** 1 approval checkpoint
**Total verification time:** 1 min

---
*Verified: 2026-03-29T07:04:16.6991503Z*
*Verifier: Codex*
