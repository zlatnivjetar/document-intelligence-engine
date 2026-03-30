# Roadmap: DocPipe - Document Intelligence Engine

## Overview

DocPipe is built in six sequential phases that follow the dependency chain mandated by the architecture. Phase 1 locks the monorepo scaffold, core TypeScript types, and provider abstraction before anything else is built on them. Phase 2 delivers the extraction pipeline end-to-end with the invoice template and npm publish pipeline - the first working artifact. Phase 3 completes the library with remaining templates, PDF routing, and validators. Phases 4 and 5 build the web app in two passes: core upload and extraction flow first, then results display and export polish. Phase 6 delivers the CLI last, when the core API is fully stable. The project is done when a visitor can hit the web app, upload an invoice, and get validated structured JSON/CSV back.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Monorepo + Types + Provider** - Monorepo scaffold (Turborepo + pnpm), core TypeScript types/interfaces, provider abstraction layer with Anthropic implementation
- [x] **Phase 2: Extraction Pipeline + Invoice Template** - Extraction pipeline (extract function, Zod validation, retry logic, error handling, confidence scoring), invoice template, npm publish pipeline
- [x] **Phase 3: Core Completeness** - Receipt and W-2 templates, PDF routing (text vs image), business-rule validators, custom schema support, fixture tests, thin consumer verification
- [x] **Phase 4: Web App - Core Flow** - Upload UI (drag-and-drop), BYOK key management, template selection, trigger extraction, basic results display
- [x] **Phase 5: Web App - Results & Export** - Confidence color-coded results table, JSON/CSV export, clipboard copy, custom schema input in web UI, error state display
- [ ] **Phase 6: CLI** - Command-line interface wrapping core

## Phase Details

### Phase 1: Monorepo + Types + Provider
**Goal**: The monorepo exists with all workspace packages, core TypeScript types and interfaces are locked, and the Anthropic provider implements the `LLMProvider` abstraction - giving every downstream phase a stable foundation to build on
**Depends on**: Nothing (first phase)
**Requirements**: LIB-02, EXTRACT-06
**Success Criteria** (what must be TRUE):
  1. `turbo build` runs cleanly with `packages/core`, `packages/web`, and `packages/cli` as separate workspaces - each package builds independently without error
  2. `ExtractionInput`, `ExtractionResult`, `LLMProvider`, and `ExtractionError` are defined in `packages/core` and importable by both `packages/web` and `packages/cli` via workspace reference
  3. `AnthropicProvider` implements the `LLMProvider` interface and is the sole implementation - swapping to a different provider requires only adding one new file
  4. The provider abstraction compiles with no `any` types in the public interface - TypeScript strict mode is enforced across the monorepo
**Plans**: 2/2 plans complete

Plans:
- [x] 01-01-PLAN.md - Monorepo root config + all three workspace package scaffolds
- [x] 01-02-PLAN.md - Core types (ExtractionInput, ExtractionResult, ExtractionError) + Anthropic provider + vitest + full turbo build

### Phase 2: Extraction Pipeline + Invoice Template
**Goal**: `@docpipe/core` contains a working extraction pipeline and invoice template - a developer can call `extract()` with a PDF or image and receive a validated, typed result with confidence scores, and the package can be installed from npm by an external consumer
**Depends on**: Phase 1
**Requirements**: LIB-01, EXTRACT-01, EXTRACT-02, EXTRACT-03, EXTRACT-04, EXTRACT-05, EXTRACT-08, TMPL-01, INPUT-01, INPUT-02
**Success Criteria** (what must be TRUE):
  1. A developer can call `extract({ input, schema, provider })` with an invoice PDF or image and receive a typed `ExtractionResult` with per-field confidence scores
  2. When extracted output fails Zod validation, the engine automatically retries up to 2 times, feeding the validation error back to the model - and returns a clean failure if retries are exhausted
  3. Engine returns distinct, actionable error states for: invalid API key (401 - no retry), rate limit (429 - no retry), unsupported file type, extraction failure, and validation failure after retries
  4. `@docpipe/core` can be installed in a fresh project outside the monorepo and the `extract()` function works with no missing-module errors - the publish pipeline is validated end-to-end
  5. PDF files and image files (PNG, JPG) are both accepted as valid input to the extraction pipeline
**Plans**: 4/4 plans complete

Plans:
- [x] 02-01-PLAN.md - Core extract() function with document routing and per-field confidence scoring
- [x] 02-02-PLAN.md - Retry loop and error classification (all 5 ExtractionError codes)
- [x] 02-03-PLAN.md - Invoice Zod schema (TMPL-01) with all 10 required fields
- [x] 02-04-PLAN.md - npm publish pipeline audit and consumer install verification

### Phase 3: Core Completeness
**Goal**: `@docpipe/core` is feature-complete - all three built-in templates are present and fixture-tested, the PDF routing layer handles text-layer and image-only documents correctly, business-rule validators catch anomalies, and custom schemas work end-to-end
**Depends on**: Phase 2
**Requirements**: TMPL-02, TMPL-03, TMPL-04, EXTRACT-07, LIB-03, INPUT-03
**Success Criteria** (what must be TRUE):
  1. Receipt and W-2 templates each extract correct values from a known-answer fixture document and return matching confidence labels
  2. When given an image-only scanned PDF, the engine routes to the image processing path; when given a text-layer PDF, it routes to the text extraction path - both return correct results
  3. Business-rule validators flag anomalies (zero total, future date, line items not summing to total) as warnings alongside the extraction result without failing the extraction
  4. A custom Zod schema passed to `extract()` works end-to-end - the engine uses it as the output schema and returns a validated, typed result
  5. Web and CLI packages import `@docpipe/core` via workspace reference with no logic duplication - both are thin consumers of the same pipeline
**Plans**: 6/6 plans complete

Plans:
- [x] 03-01-PLAN.md - Receipt template (TMPL-02) and W-2 template (TMPL-03) with unit tests, wired into barrel
- [x] 03-02-PLAN.md - PDF type detection with unpdf (INPUT-03): detectPdfType(), pdfType annotation on ExtractionResult
- [x] 03-03-PLAN.md - Business-rule validators (EXTRACT-07) + custom schema end-to-end test (TMPL-04)
- [x] 03-04-PLAN.md - Thin consumer verification: web and CLI import from @docpipe/core (LIB-03), human checkpoint
- [x] 03-05-PLAN.md - Receipt and W-2 known-answer PDF fixtures with exact confidence-backed integration tests
- [x] 03-06-PLAN.md - Real text-layer vs image-only PDF routing paths with committed routing fixtures

### Phase 4: Web App - Core Flow
**Goal**: Users can visit the web app, upload a document, enter their API key, select a template, and trigger extraction - producing a basic result display that confirms the pipeline works end-to-end in the browser
**Depends on**: Phase 3
**Requirements**: INPUT-04, WEB-01, WEB-02, WEB-08
**Success Criteria** (what must be TRUE):
  1. User can drag and drop (or click-to-select) a PDF, PNG, or JPG file; unsupported file types are rejected with a visible error message before any extraction attempt
  2. User enters a supported provider API key in the web app; the key is stored in sessionStorage only and never appears in network requests to DocPipe servers
  3. User selects a built-in template from the template selector, triggers extraction, and sees a result appear in-page - confirming extraction runs end-to-end through the browser
  4. The web app deploys to Vercel and the extraction flow works in production - Vercel timeout behavior is confirmed with the PDF parse API route before full polish is added
**Plans**: 4/4 plans complete
**UI hint**: yes

Plans:
- [x] 04-01-PLAN.md - Browser-safe core/browser entrypoint and thin web shim
- [x] 04-02-PLAN.md - Tailwind/shadcn shell and Phase 4 visual foundation
- [x] 04-03-PLAN.md - Interactive browser extraction workspace with session-only BYOK
- [x] 04-04-PLAN.md - Vercel PDF inspect diagnostics route and production verification

### Phase 5: Web App - Results & Export
**Goal**: Users get a polished results experience - fields are color-coded by confidence, results can be exported or copied, custom schemas can be entered in the UI, and all error states are clearly communicated
**Depends on**: Phase 4
**Requirements**: WEB-03, WEB-04, WEB-05, WEB-06, WEB-07
**Success Criteria** (what must be TRUE):
  1. Results are displayed in a table with each field color-coded by confidence level (green >= 0.85, amber 0.60-0.84, red < 0.60)
  2. User can export results as a JSON file download, a CSV file download, or copy JSON to clipboard with instant visual confirmation
  3. User can paste a custom Zod schema in the web UI and trigger extraction using that schema instead of a built-in template
  4. Error states are clearly displayed in the UI for all failure modes: invalid API key, unsupported file format, extraction failure, and validation failure after retries - each with a distinct, actionable message
**Plans**: 3/3 plans complete
**Verification**: passed - see `.planning/phases/05-web-app-results-export/05-VERIFICATION.md`
**UI hint**: yes

Plans:
- [x] 05-01-PLAN.md
- [x] 05-02-PLAN.md
- [x] 05-03-PLAN.md

### Phase 6: CLI
**Goal**: Developers can use `docpipe extract` from the terminal to extract structured data from a local file and pipe the result into other tools
**Depends on**: Phase 3
**Requirements**: CLI-01, CLI-02, CLI-03, CLI-04
**Success Criteria** (what must be TRUE):
  1. `docpipe extract invoice.pdf --template invoice --key $ANTHROPIC_API_KEY` prints valid JSON to stdout and exits 0 on success
  2. `docpipe extract receipt.jpg --schema ./my-schema.ts --format csv` applies a custom schema and outputs CSV to stdout
  3. JSON output can be piped into `jq` or redirected to a file without encoding issues; exit code is non-zero on extraction failure
  4. `docpipe extract --help` displays clear usage documentation including all flags, supported templates, and environment variable support for the API key
**Plans**: 2 plans

Plans:
- [x] 06-01-PLAN.md - Commander extract command, local file/MIME validation, JSON/CSV stdout, and executable build alignment
- [ ] 06-02-PLAN.md - Local custom schema module loading plus installed CLI consumer verification

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Monorepo + Types + Provider | 2/2 | Complete | 2026-03-28 |
| 2. Extraction Pipeline + Invoice Template | 4/4 | Complete | 2026-03-29 |
| 3. Core Completeness | 6/6 | Complete | 2026-03-29 |
| 4. Web App - Core Flow | 4/4 | Complete | 2026-03-29 |
| 5. Web App - Results & Export | 3/3 | Complete | 2026-03-30 |
| 6. CLI | 0/? | Not started | - |
