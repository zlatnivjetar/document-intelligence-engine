# Project Research Summary

**Project:** DocPipe — Document Intelligence Engine
**Domain:** LLM-powered structured data extraction from PDFs and images (TypeScript monorepo)
**Researched:** 2026-03-28
**Confidence:** HIGH

## Executive Summary

DocPipe is a document intelligence engine that extracts structured JSON data from PDFs and images using vision LLMs. The dominant pattern among production document intelligence tools is schema-driven extraction with per-field confidence scoring, but all existing solutions are either heavyweight cloud SaaS (Nanonets, Rossum, Textract) or low-level building blocks with no TypeScript-native API. The recommended approach is to build a clean core npm library (`@docpipe/core`) as the primary artifact — a four-stage extraction pipeline (ingest, preprocess, LLM call, Zod validate) that accepts any `LanguageModelV1`-compatible provider and returns strongly-typed results with per-field confidence. The web app and CLI are thin consumers of this core, not the product itself.

The stack decision is largely constrained by the project brief: Next.js 16.1 + Turborepo + Zod v4. The critical free choices are Claude as the default LLM (native PDF `document` block, 100% JSON consistency in benchmarks, 200k context window), `unpdf` over abandoned `pdf-parse` for text extraction, and `tsdown` over unmaintained `tsup` for library bundling. The Vercel AI SDK (`ai` v6) provides the `LanguageModelV1` interface that makes provider-swapping a one-line change — use it for the abstraction, not for direct LLM calls.

The dominant risks fall into two categories: LLM reliability (hallucinated plausible values, uncalibrated confidence scores, schema validation passing while extraction is semantically wrong) and infrastructure gotchas (Vercel free-tier 10s timeout on API routes, client-side PDF rendering broken in Safari, monorepo hoisting masking missing `package.json` declarations). The mitigation strategy is build-order discipline: core library and types first, Vercel deployment early (before full feature set), and fixture-based tests with known-answer documents for every template before declaring it done.

---

## Key Findings

### Recommended Stack

The monorepo is structured as `packages/core` (the publishable library), `packages/web` (Next.js app), and `packages/cli` (Commander.js wrapper). Build tooling is Turborepo 2.8.20 with pnpm 10.x workspaces, `tsdown` for bundling the library and CLI, and Vitest 3.x for all tests. Version compatibility is strict: Next.js 16.1 requires React 19; shadcn/ui requires Tailwind v4; AI SDK v6 requires the v3 provider packages; `tsdown` requires TypeScript 5.5+.

The most important non-obvious stack decision is where LLM calls happen: call Anthropic directly from the browser using the user's BYOK key. This eliminates the Vercel API route timeout problem and aligns with the privacy-first positioning (document never touches DocPipe servers). The only server-side API route needed is PDF-to-image conversion via `unpdf`/pdfjs-dist, which requires Node.js and cannot run in browser or edge runtime reliably.

**Core technologies:**
- TypeScript 5.8+: language throughout — strict mode catches extraction schema mismatches at compile time
- Next.js 16.1 (App Router): web app shell — native streaming for LLM responses, file-based API routes
- Turborepo 2.8.20 + pnpm 10.x: monorepo orchestration — remote caching, topological build order
- Zod 4.3.6: schema definition + runtime validation — 57% smaller than v3, accepted natively by Anthropic and AI SDKs
- `@anthropic-ai/sdk` 0.80.0 + `@ai-sdk/anthropic` 3.0.64: Claude as default LLM — native PDF support, 100% JSON consistency
- `ai` (Vercel AI SDK) 6.0.140: provider abstraction — `LanguageModelV1` interface makes swapping providers a one-line change
- `unpdf` 1.4.0: PDF text extraction — ESM-first, edge-compatible, maintained replacement for abandoned `pdf-parse`
- `tsdown`: library bundling — Rolldown-powered tsup successor, 2x faster builds, 8x faster type declarations
- `commander` 13.x: CLI argument parsing — zero dependencies, 61 KB, git-style subcommand model
- `vitest` 3.x: test runner — zero-config TypeScript + ESM, native monorepo workspace support

### Expected Features

The commercial document intelligence market has converged on a standard feature set: per-field confidence scores (not just overall document confidence), schema-driven extraction where the user defines what fields to extract, drag-and-drop upload, live preview, and export to JSON/CSV. These are table stakes — shipping without them makes the product feel incomplete versus any commercial tool.

DocPipe's genuine differentiators are: Zod as the schema language (TypeScript-native, type-inferred, no other open-source tool does this), explicit validation-with-retry (the retry loop feeds Zod error messages back to the LLM for self-correction), and a privacy-first BYOK model where documents never reach DocPipe's servers. The CLI is also a differentiator — no commercial extraction tool offers a local CLI that integrates into shell pipelines.

**Must have (table stakes):**
- PDF + PNG + JPG input via drag-and-drop — universal document formats, no exceptions
- Schema-driven extraction with Zod — core value proposition, drives prompt quality and type safety
- Per-field confidence scores with color-coded UI (green/amber/red) — industry standard, every serious tool has it
- Invoice and receipt templates (built-in) — the canonical demo documents for any extraction tool
- Export as JSON and CSV — expected by developers and non-technical users respectively
- BYOK API key in sessionStorage — privacy positioning, never transmitted to server
- Validation + retry loop (max 2 retries, error fed back to model) — reliability differentiator
- Core npm package publishable as `@docpipe/core` — the portfolio artifact
- CLI: `docpipe extract <file> --template <name>` — developer-first, no commercial competitor has this
- Error states for bad key, unsupported file type, extraction failure — non-negotiable UX

**Should have (competitive):**
- Zod schema validation + automatic retry with error feedback — makes the retry loop explicit and user-controlled
- Provider abstraction layer (`LanguageModelV1`) — enables community extensions; demonstrates design quality
- W-2 or bank statement as third template — broader demo surface
- Custom Zod schema input in web app — unlocks non-invoice use cases for technical users
- Granular extraction status steps in UI — "Reading document... Extracting fields... Validating..." prevents abandonment

**Defer (v2+):**
- Batch document processing — queue/progress complexity conflicts with privacy-first single-doc flow
- Second LLM provider (OpenAI/Gemini) — prove the abstraction works first, then demonstrate it with a second provider
- OAuth and user accounts — BYOK eliminates the need; auth adds weeks of unrelated work
- Human-in-the-loop review queue — a product category of its own (Rossum's entire value proposition)
- Webhook/async delivery mode — not needed for synchronous BYOK client-side model

### Architecture Approach

The system is a four-stage linear pipeline: Stage 1 (ingest — validate and normalize input), Stage 2 (preprocess — convert PDF to base64 images), Stage 3 (LLM call — send to provider), Stage 4 (validate and score — Zod parse, confidence assignment, retry on failure). Each stage returns a `Result<T, ExtractionError>` discriminated union; the pipeline short-circuits on failure and reports the failing stage. The LLM provider is injected at call time (not stored on a class instance) — this is the critical design choice that enables BYOK with a stateless provider. Core accepts `Base64Image[]` as its canonical input; PDF-to-image conversion is the consumer's responsibility, keeping environment-specific code out of the library.

**Major components:**
1. `packages/core` — all extraction logic, provider abstraction, templates; pure TypeScript, no framework deps; the publishable npm package
2. `packages/web` — Next.js shell, drag-and-drop upload, results display, BYOK key management; one API route for PDF parsing (Node.js runtime); all LLM calls client-side
3. `packages/cli` — Commander.js arg parsing, Node.js file I/O, calls `@docpipe/core`; thin wrapper, built after core is stable
4. Extraction pipeline — four discrete stage files, each independently testable; retry logic in the Stage 4 / orchestrator boundary
5. Provider abstraction — `LLMProvider` interface defined first; `AnthropicProvider` is the first implementation; adding OpenAI is one new file
6. Template registry — each template is `{ name, schema: ZodSchema, systemPrompt }` co-located in one file; schema and prompt cannot drift independently

### Critical Pitfalls

1. **LLM confidence scores are systematically overconfident** — LLMs return >0.9 confidence even for hallucinated values. Use categorical confidence (`'high' | 'medium' | 'low'`) assigned by the LLM rather than numeric, and design the UI to signal "review this field" rather than "trust this value." Add format-based secondary validation (date patterns, numeric sanity checks) to downgrade confidence on obviously wrong values.

2. **Hallucinated values that pass Zod validation** — Zod validates shape, not truth. A hallucinated invoice total of $1,243.56 passes `.number()` validation. Add a second layer of business rule validators per template: totals that are 0, dates in the future, line item counts that don't match visible rows. These produce "warning" flags alongside the extraction result, not hard failures.

3. **PDF parsing is not a single problem** — Text-layer PDFs, image-only scanned PDFs, and password-protected PDFs need different handling. Build a routing layer that detects whether a PDF has an extractable text layer (check character count per page) and routes to the correct path. Test both types in fixture sets before declaring the pipeline done.

4. **Vercel free-tier API route timeout** — LLM calls from a Next.js API route hit the 10-second serverless limit on complex PDFs. The mitigation is architectural: call Anthropic directly from the browser with the user's key. This eliminates the timeout risk entirely and aligns with BYOK privacy. The only API route needed is PDF rendering (deterministically fast for 1-2 page documents). Deploy to Vercel in the first web app iteration — do not discover timeout issues after building the full feature set.

5. **Monorepo hoisting masks missing `package.json` declarations** — `@docpipe/core` works inside the monorepo because dependencies are hoisted to root `node_modules`. When published to npm, consumers get "Cannot find module 'zod'" errors. Test the published package by installing it in a fresh project outside the monorepo before building any feature that depends on the package being consumable. Set up the publish pipeline in Phase 1.

---

## Implications for Roadmap

Based on research, the build order is mandated by dependency direction: core types and interfaces must exist before providers, pipeline stages, templates, web app, or CLI can be built. The web app and CLI are parallel consumers of a stable core. Vercel deployment should happen early in the web app phase — not at the end — to surface timeout and bundle size issues before they are expensive to fix.

### Phase 1: Core Foundation — Types, Provider, and One Working Extraction

**Rationale:** Every downstream component depends on `ExtractionInput`, `ExtractionResult`, and `LLMProvider`. Locking these interfaces before building consumers prevents costly refactors. The Anthropic provider and one template (invoice) are needed to prove the pipeline end-to-end. The npm publish pipeline must be set up here — the monorepo hoisting pitfall is fatal if discovered late.

**Delivers:** A working `extract()` function in `packages/core` that accepts a PDF/image, runs it through Claude with the invoice Zod schema, and returns structured JSON with per-field confidence. Publishable to npm with correct `exports`, `types`, `dependencies`, and `files` fields. Vitest test suite with invoice fixture (known-answer document).

**Addresses:**
- Core types and interfaces (unblocks all parallel work)
- `AnthropicProvider` implementing `LLMProvider` interface
- Invoice template (Zod schema + system prompt co-located)
- Four-stage pipeline with Result discriminated union
- Retry logic (max 2 retries, error fed back to model, no retry on 429/401)
- Confidence scoring as schema wrapper (`fieldWithConfidence` helper)
- npm publish pipeline test (install in fresh project outside monorepo)

**Avoids:**
- Pitfall 9 (monorepo breaks npm consumers) — set up publish pipeline in Phase 1, not as afterthought
- Pitfall 7 (retry logic hammers API) — design retry budget and error-type discrimination from the start
- Pitfall 1 (uncalibrated confidence) — use categorical confidence enum, not LLM-assigned numeric scores

**Research flag:** Standard patterns. The four-stage pipeline, provider interface, and Zod schema wrapper patterns are well-documented in the architecture research. No additional research needed.

---

### Phase 2: Core Completeness — Templates, PDF Routing, and Fixture Tests

**Rationale:** The receipt template is required for MVP. The W-2 template demonstrates the template system scales beyond invoices. The PDF routing layer (text-layer detection) must be built before the web app so both consumers get correct behavior. Fixture-based tests for each template before marking them done is a hard rule from pitfall research.

**Delivers:** `@docpipe/core` feature-complete with receipt template, W-2 template, PDF routing layer (text-layer vs. image-path detection), business rule validators per template (zero-total flags, future-date flags, line-item count checks), and fixture test suites for all three templates against known-answer documents.

**Addresses:**
- Receipt template (7 fields, simpler than invoice — good regression test for template system)
- W-2 template (third template for demo breadth)
- PDF routing layer (detect text layer vs. image-only, route to correct processing path)
- Business rule validators (second validation layer beyond Zod schema shape)
- Fixture test corpus (known-answer documents for each template)

**Avoids:**
- Pitfall 3 (PDF parsing fragmentation) — routing layer built here, before web app depends on it
- Pitfall 6 (schema validates shape but not semantics) — business rule validators per template
- Pitfall 2 (hallucinated plausible values) — fixture tests catch regressions, prompt engineering ("return null if uncertain") embedded in system prompts

**Research flag:** PDF routing layer may benefit from brief research during planning — specifically whether `unpdf`'s text extraction reliably reports empty pages for image-only PDFs, or whether a character-count heuristic needs calibration.

---

### Phase 3: Web App — Upload, Extraction, and Results UI

**Rationale:** The web app is the primary demo surface for hiring managers and public users. It consumes `@docpipe/core` directly (TypeScript import, no HTTP). The critical architectural decision — call Anthropic from the browser, not from an API route — must be made here and is the mitigation for the Vercel timeout pitfall. Deploy to Vercel in the first iteration of this phase, not at the end.

**Delivers:** Full web app with drag-and-drop upload (react-dropzone), BYOK API key management (sessionStorage, not localStorage, with key validation feedback), template selector, live extraction with granular status steps, results table with color-coded confidence (green/amber/red), JSON and CSV export, copy to clipboard, document thumbnail preview alongside results, and proper error states.

**Addresses:**
- Drag-and-drop upload with file type and size validation
- BYOK API key in sessionStorage with trim + validation on input
- Template selection with field preview (user sees what will be extracted before committing)
- Live extraction status ("Reading document... Extracting fields... Validating...")
- Results table with per-field confidence color coding
- JSON download, CSV download (PapaParse), clipboard copy
- Document thumbnail preview for cross-referencing
- Error states: bad key, unsupported format, extraction failure, validation failure after retries
- Export warning when required fields are null or low-confidence
- Content-Security-Policy headers configured before any user-facing shipping
- `/api/parse-pdf` route (Node.js runtime, PDF-to-images via pdfjs-dist, returns base64 array)

**Avoids:**
- Pitfall 8 (Vercel timeout) — LLM calls go browser → Anthropic directly, API route only for PDF rendering; deploy early
- Pitfall 5 (API key XSS) — sessionStorage instead of localStorage, CSP headers, key never in logs or error messages
- UX pitfalls — granular status steps, document preview, confidence color coding, export warnings all addressed here
- Pitfall 4 (Safari PDF rendering) — API route handles PDF rendering server-side, not client-side canvas

**Research flag:** Standard patterns for Next.js App Router, shadcn/ui, react-dropzone, and react-hook-form. The `dangerouslyAllowBrowser: true` Anthropic SDK pattern is documented. No additional research needed beyond stack research already completed.

---

### Phase 4: CLI — Command-Line Interface

**Rationale:** The CLI is the lowest-risk phase — it is a thin Commander.js wrapper over `@docpipe/core`. Build it last so the core library API is stable before the CLI surface is locked. The CLI's Node.js environment means PDF handling is simpler (no browser canvas complications). The CLI is a genuine differentiator from commercial tools and demonstrates the library's usability.

**Delivers:** `docpipe extract <file> --template <name> --key <api-key>` producing JSON to stdout; `--output <file>` flag for file output; `--format json|csv` flag; `DOCPIPE_API_KEY` env var support; `docpipe extract --help` with clear field documentation; error messages that match web app error taxonomy; `tsdown`-bundled single-file executable; npm publish with correct bin field.

**Addresses:**
- CLI: `docpipe extract <file> --template invoice --key $KEY`
- Node.js PDF handling (Buffer-based, no canvas polyfills needed)
- JSON and CSV output formatters
- BYOK via env var or flag (key never logged)
- `--schema <file>` flag for custom Zod schema (v1.x feature, low cost once CLI exists)

**Avoids:**
- Building CLI before core API is stable (dependency order from architecture research)
- Pitfall 9 variant: CLI `package.json` needs correct `bin` field and `files` exclusions, same as core

**Research flag:** Standard patterns. Commander.js subcommand model and tsdown executable bundling are well-documented. No additional research needed.

---

### Phase Ordering Rationale

- **Core before consumers:** `packages/web` and `packages/cli` both import `@docpipe/core` via TypeScript workspace references. The core interface (`ExtractionInput`, `ExtractionResult`, `LLMProvider`) must be locked before consumer code is written, or consumer code becomes the de facto API spec — a fragile reversal.
- **Template fixtures before web app:** The web app's demo quality depends on templates returning correct results. Building fixture tests in Phase 2 before the web app means regressions are caught during template development, not discovered by hiring managers using the demo.
- **Deploy Vercel in Phase 3, iteration 1:** The Vercel timeout pitfall and cold-start behavior of the PDF parse route are only observable in production. Discovering them at the end of Phase 3 means late rework. A staging deploy in the first iteration of Phase 3 validates the deployment constraints before they block completion.
- **CLI last:** The CLI is low-risk and low-dependency. Its build order is mandated: core API must be stable, but the CLI itself has no consumers that depend on it.

### Research Flags

Phases needing deeper research during planning:
- **Phase 2 (PDF routing layer):** Confirm `unpdf`'s per-page text extraction behavior on image-only PDFs to calibrate the routing heuristic (character count threshold). One session of direct testing or targeted API docs review is sufficient.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Core foundation):** Provider interface, pipeline pattern, Zod confidence wrapper, and npm publish pipeline are all well-documented in architecture and pitfalls research. Patterns are explicit and ready to implement.
- **Phase 3 (Web app):** Next.js App Router, react-dropzone, shadcn/ui, Anthropic SDK browser usage, and sessionStorage key storage are all documented. The `dangerouslyAllowBrowser: true` pattern is explicit in pitfalls research.
- **Phase 4 (CLI):** Commander.js and tsdown patterns are standard; no novel integration challenges.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All critical version decisions verified against official docs and npm registry. Version compatibility matrix explicitly validated. The one exception is Claude JSON consistency benchmark (MEDIUM — third-party benchmark, not independently reproduced). |
| Features | MEDIUM-HIGH | Commercial product feature landscape verified via multiple sources. Open-source competitor landscape confirmed via direct repo inspection. The Zod-as-schema-language differentiator is confirmed unique in the npm space (nearest competitor `llm-document-ocr` does not use Zod). |
| Architecture | HIGH | Pipeline pattern, provider abstraction, confidence-as-schema-wrapper, and build order all verified against multiple sources. Anti-patterns grounded in real failure modes (not speculative). |
| Pitfalls | HIGH | Most pitfalls verified across multiple independent sources. Confidence calibration section is MEDIUM (LLM calibration is an open research problem; categorical confidence is the pragmatic workaround, not a solved solution). |

**Overall confidence:** HIGH

### Gaps to Address

- **LLM confidence calibration:** The categorical `'high' | 'medium' | 'low'` confidence approach is the pragmatic recommendation, but whether Claude's self-assigned categorical labels correlate with actual accuracy on DocPipe's specific templates is untested. Validate during Phase 2 fixture testing: compare confidence labels against known-answer documents to see if the signal is meaningful.
- **`unpdf` empty-page detection:** `unpdf` 1.4.0's behavior on image-only PDFs (does it return empty string or null or throw?) is not fully characterized in the research. Validate during Phase 2 when building the PDF routing layer. Fallback: detect by checking if extracted text character count per page is below a threshold (e.g., < 50 characters).
- **Claude native PDF block vs. image array:** Research recommends using Claude's native `document` block for PDFs (simpler, Claude handles page rendering internally). However, the PDF routing layer still needs to handle the case where a PDF is too large for the native block. Validate the size limits and fallback behavior during Phase 1 fixture testing.
- **Vercel Hobby timeout with pdfjs-dist:** The PDF parse API route uses pdfjs-dist which has a non-trivial cold start. The 10-second Hobby timeout is for the default serverless function; `maxDuration` can be set higher (up to 300s with Fluid Compute opt-in). Confirm the actual route duration for a 2-page PDF during Phase 3 early deployment.

---

## Sources

### Primary (HIGH confidence)
- [Anthropic TypeScript SDK — npmjs.com](https://www.npmjs.com/package/@anthropic-ai/sdk) — version 0.80.0, `dangerouslyAllowBrowser` pattern
- [Claude PDF Support — Official Docs](https://platform.claude.com/docs/en/build-with-claude/pdf-support) — `document` block API, limits, token costs
- [Vercel AI SDK Introduction](https://ai-sdk.dev/docs/introduction) — `LanguageModelV1` interface spec
- [AI SDK v6 Release — Vercel](https://vercel.com/blog/ai-sdk-6) — version 6.0.140, provider packages
- [Turborepo 2.7 — Official Blog](https://turborepo.dev/blog/turbo-2-7) — version 2.8.20
- [Zod v4 Release Notes](https://zod.dev/v4) — version 4.3.6, bundle size reduction
- [Next.js 16.1 — Official Blog](https://nextjs.org/blog/next-16-1) — latest stable, React 19 requirement
- [Vercel Function Limits](https://vercel.com/docs/functions/limitations) — 10s Hobby timeout, Fluid Compute 300s
- [shadcn/ui Tailwind v4 docs](https://ui.shadcn.com/docs/tailwind-v4) — Tailwind v4 compatibility
- [Turborepo — Structuring a Repository](https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository) — monorepo structure patterns

### Secondary (MEDIUM confidence)
- [Koncile — Claude vs GPT invoice extraction benchmark](https://www.koncile.ai/en/ressources/claude-gpt-or-gemini-which-is-the-best-llm-for-invoice-extraction) — Claude 100% JSON consistency claim (third-party, not reproduced)
- [tsdown — Official Docs](https://tsdown.dev/guide/) — Rolldown-powered bundler (newer project, trajectory clear)
- [unpdf — GitHub](https://github.com/unjs/unpdf) — serverless PDF.js wrapper behavior
- [LandingAI — Extraction Schema Best Practices](https://landing.ai/developers/extraction-schema-best-practices-get-clean-structured-data-from-your-documents) — schema-driven extraction patterns
- [Extend.ai — Best Confidence Scoring Systems](https://www.extend.ai/resources/best-confidence-scoring-systems-document-processing) — confidence threshold recommendations (green >= 0.85, amber 0.60-0.84, red < 0.60)
- [5 Methods for Calibrating LLM Confidence Scores — Latitude](https://latitude.so/blog/5-methods-for-calibrating-llm-confidence-scores) — calibration options
- [Pitfalls When Adding Turborepo — DEV Community](https://dev.to/_gdelgado/pitfalls-when-adding-turborepo-to-your-project-4cel) — monorepo hoisting issues
- [Simon Willison — Anthropic direct browser access](https://simonwillison.net/2024/Aug/23/anthropic-dangerous-direct-browser-access/) — CORS header requirement

### Tertiary (supporting)
- [Parsio — Top 8 Document Extraction Tools 2026](https://parsio.io/blog/top-document-extraction-tools/) — commercial feature landscape
- [Vellum AI — LLMs vs OCRs for document extraction](https://www.vellum.ai/blog/document-data-extraction-llms-vs-ocrs) — hallucination patterns
- [Veryfi — AI Hallucinations in Data Extraction](https://www.veryfi.com/data/ai-hallucinations/) — confidence score reliability
- [Unstract — LLMs for structured extraction from PDFs](https://unstract.com/blog/comparing-approaches-for-using-llms-for-structured-data-extraction-from-pdfs/) — routing layer patterns
- [Nutrient — Complete Guide to PDF.js](https://www.nutrient.io/blog/complete-guide-to-pdfjs/) — browser compatibility limits

---

*Research completed: 2026-03-28*
*Ready for roadmap: yes*
