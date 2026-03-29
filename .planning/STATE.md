---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Completed 04-01-PLAN.md
last_updated: "2026-03-29T10:40:50.189Z"
last_activity: 2026-03-29
progress:
  total_phases: 6
  completed_phases: 3
  total_plans: 16
  completed_plans: 13
  percent: 81
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-29)

**Core value:** A user can upload a document and get clean, validated structured data back - reliably, every time.
**Current focus:** Phase 04 — web-app-core-flow

## Current Position

Phase: 04 (web-app-core-flow) — EXECUTING
Plan: 2 of 4
Status: Ready to execute
Last activity: 2026-03-29

Progress: [████████░░] 81%

## Performance Metrics

**Velocity:**

- Total plans completed: 12
- Average duration: 5 min
- Total execution time: 57 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 2 | 34 min | 17 min |
| 02 | 4 | 13 min | 3 min |
| 03 | 6 | 10 min | 2 min |

**Recent Trend:**

- Last 5 plans: 2 min, 2 min, 1 min, 2 min, 1 min
- Trend: stable

**Recent Plan Metrics:**

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 01-monorepo-types-provider P01 | 14 min | 2 tasks | 16 files |
| Phase 01-monorepo-types-provider P02 | 20 min | 3 tasks | 10 files |
| Phase 02 P01 | 5 min | 2 tasks | 3 files |
| Phase 02 P02 | 2 min | 1 task | 2 files |
| Phase 02 P03 | 2 min | 2 tasks | 3 files |
| Phase 02 P04 | 4 min | 3 tasks | 3 files |
| Phase 03 P01 | 2 min | 2 tasks | 5 files |
| Phase 03 P02 | 2 min | 2 tasks | 8 files |
| Phase 03 P03 | 2 min | 2 tasks | 6 files |
| Phase 03 P04 | 1 min | 2 tasks | 2 files |
| Phase 03 P05 | 2 min | 2 tasks | 5 files |
| Phase 03 P06 | 1 min | 2 tasks | 5 files |
| Phase 04 P01 | 6 min | 2 tasks | 7 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Research: Call Anthropic directly from the browser (not via API route) - eliminates Vercel 10s timeout, aligns with BYOK privacy
- Research: Claude as default LLM provider - native PDF document block, 100% JSON consistency in benchmarks
- Research: unpdf for PDF text extraction, tsdown for library bundling, Vercel AI SDK for provider abstraction
- Research: Set up npm publish pipeline in Phase 2 - monorepo hoisting masks missing deps until consumers install the package
- Roadmap revision: Expanded from 4 phases to 6. Phase 1 now solely focuses on monorepo scaffold + types + provider abstraction. Extraction pipeline + invoice template moved to Phase 2. Web app split into Phase 4 (core flow) and Phase 5 (results and export). CLI remains last (Phase 6).
- [Phase 01-monorepo-types-provider]: apps/web uses Bundler moduleResolution (overrides base NodeNext) - required for Next.js App Router with webpack/Turbopack
- [Phase 01-monorepo-types-provider]: pnpm installed via npm install -g pnpm@10 - not pre-installed in execution environment
- [Phase 01-monorepo-types-provider]: .gitignore added as Rule 2 deviation - foundational requirement for any git repository
- [Phase 01-monorepo-types-provider]: LanguageModelV1 does not exist in ai@6.x - renamed to LanguageModelV3 in @ai-sdk/provider. Phase 2 extract() should accept LanguageModelV3.
- [Phase 01-monorepo-types-provider]: isolatedDeclarations requires explicit return type annotations on all exported functions including Next.js page components
- [Phase 02]: AI SDK file parts use mediaType - ai@6.0.141 UserModelMessage file parts require mediaType, so the plan's older mimeType example was corrected during 02-01.
- [Phase 02]: Non-object schemas use z.record confidence fallback - preserves dynamic top-level confidence keys for flexible schemas instead of stripping them with an empty object schema.
- [Phase 02]: Unsupported mime types fail before model calls - the retry wrapper rejects unsupported inputs before generateObject() so invalid files do not consume tokens.
- [Phase 02]: Validation retries append schema errors to the prompt - each retry reuses extractCore() and adds the previous validation failure as corrective context for the model.
- [Phase 02]: Invoice template uses nullable optional invoice fields - vendorAddress, dueDate, taxAmount, and taxRate are nullable so the built-in template matches invoices that omit them.
- [Phase 02]: Invoice schema uses explicit shape annotations - the exported Zod schema needs explicit internal shape types to compile under isolatedDeclarations without weakening the template contract.
- [Phase 02]: Consumer verification audits tarball contents before install - the publish smoke test rejects tarballs that leak src, node_modules, or test files before attempting the external install.
- [Phase 02]: Installed-package smoke test asserts EXTRACTION_FAILED path - using a fake model and the public error wrapper is more reliable than deep-mocking ai inside an installed tarball while still proving no missing-module failures.
- [Phase 03]: Phase 03-01: built-in templates mirror the invoice schema/export pattern - keeping receipt and W-2 on the same explicit-shape Zod pattern preserves isolatedDeclarations compatibility and a single public template contract in @docpipe/core.
- [Phase 03]: Phase 03-01: nullable template fields represent missing document values explicitly - receipt subtotal or tax and W-2 state fields can be absent on real documents, so nullable fields preserve a stable result shape while still expressing missing data.
- [Phase 03]: Phase 03-02: PDF routing uses unpdf mergePages text extraction with a 50-character threshold - merging pages before counting non-whitespace characters keeps the classifier tied to overall document text density and provides a stable threshold between scanned and text-layer PDFs.
- [Phase 03]: Phase 03-02: routingOverride keeps PDF-path tests deterministic - allowing extract() to accept a routing override avoids handing fake PDF buffers to the real parser while still proving both routing outcomes through the extraction API.
- [Phase 03]: Phase 03-03: validator findings are warnings on ExtractionResult, not extraction failures - business-rule anomalies should surface alongside otherwise valid structured data, so validators annotate results after schema success instead of affecting the retry or failure path.
- [Phase 03]: Phase 03-03: validators run only after extractCore succeeds - keeping validators outside the schema-validation retry loop preserves the existing extraction error semantics while still allowing callers to attach domain-specific checks.
- [Phase 03]: Known-answer PDF evidence lives under packages/core/test/fixtures - the repo keeps real verification artifacts while npm publishing still ships only dist files.
- [Phase 03]: analyzePdfRouting returns extracted text only for genuine text-layer PDFs - extract() branches on that analysis while routingOverride remains a metadata seam when real extracted text is unavailable.
- [Phase 04]: Web code imports a dedicated @docpipe/core/browser surface so client code avoids non-browser-safe helpers from the root package.
- [Phase 04]: Shared extract() normalizes browser-native binaries to base64 while decoding PDF base64 back to bytes for routing analysis.

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 04: Deploy to Vercel early in Phase 4 (not at end) - confirm actual route duration for pdfjs-dist on a 2-page PDF before building full polish

## Session Continuity

Last session: 2026-03-29T10:39:46.473Z
Stopped at: Completed 04-01-PLAN.md
Resume file: None
