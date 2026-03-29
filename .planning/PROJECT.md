# DocPipe - Document Intelligence Engine

## What This Is

DocPipe is an open-source document intelligence engine that extracts structured data from unstructured documents (PDFs, images, scanned files). Users define what data they want using Zod schemas (or pick a built-in template), and DocPipe returns clean, validated, typed JSON with confidence scores. Three access layers: a TypeScript core library (npm package), a Next.js web application, and a CLI tool - all sharing the same extraction engine in a monorepo.

## Core Value

A non-technical user can upload a document and get clean, validated structured data back - reliably, every time. Schema-driven extraction with validation is the thing that must work.

## Requirements

### Validated

- [x] Monorepo structure with shared core (Turborepo) - Validated in Phase 01: monorepo-types-provider
- [x] Multi-format document input (PDF, PNG, JPG) - Validated in Phase 02: extraction-pipeline-invoice-template
- [x] LLM-powered extraction using vision-capable models (start with one provider, abstraction for adding more) - Validated in Phase 02: extraction-pipeline-invoice-template
- [x] Schema-driven output using Zod - every extraction validated against a schema, malformed output retried or flagged - Validated in Phase 02: extraction-pipeline-invoice-template
- [x] Confidence scoring per extracted field - Validated in Phase 02: extraction-pipeline-invoice-template
- [x] Core engine publishable as npm package with clean, well-documented API - Validated in Phase 02: extraction-pipeline-invoice-template
- [x] Built-in receipt and W-2 templates, plus extensible custom-schema support - Validated in Phase 03: core-completeness
- [x] PDF routing distinguishes text-layer and image-only documents before the model call - Validated in Phase 03: core-completeness
- [x] Business-rule validators surface warnings without failing extraction - Validated in Phase 03: core-completeness
- [x] Web and CLI stay thin consumers of the shared core package - Validated in Phase 03: core-completeness
- [x] BYOK - users provide their own LLM API key in the browser only - Validated in Phase 04: web-app-core-flow
- [x] Web app: drag-and-drop upload, template selection, live extraction preview, and production verification on Vercel - Validated in Phase 04: web-app-core-flow
- [x] Web app: API key input stored in browser only with no DocPipe-hosted extraction endpoint - Validated in Phase 04: web-app-core-flow

### Active

- [ ] Web app: export as JSON, CSV, or copy to clipboard
- [ ] Web app: results table with confidence indicators and richer result presentation
- [ ] CLI: single-file processing with template selection
- [ ] CLI: custom schema support
- [ ] CLI: multiple output formats (JSON, CSV)

### Out of Scope

- Batch mode (web app or CLI) - adds significant complexity (progress tracking, error handling across files, consolidated export). Defer to v2 after single-doc flow is solid
- All 6 templates in v1 - nail 2-3 first, prove the pattern is extensible. Remaining templates are trivial to add later
- OAuth/social login - not a user-facing SaaS, no accounts needed
- Server-side document storage - privacy-first design, no backend persistence of user documents or API keys
- Real-time collaboration - single-user tool
- Mobile app - web-first

## Context

- **Portfolio project** for a solo technical founder job-searching for engineering roles. Must demonstrate skills beyond CRUD dashboards: library design, CLI development, full-stack web app, AI integration
- **Three-layer architecture is deliberate** - shows range. Core library + web app are higher priority; CLI is functional but gets less polish
- **Longer-term direction**: building AI infrastructure for businesses. Document extraction is a real, universal problem across industries
- **Done = someone can use it**: a visitor hits the web app, uploads an invoice, gets structured JSON/CSV back. That's the minimum viable portfolio piece
- **Flexible on client/server boundary**: prefer client-side processing in the web app, but Next.js API routes are acceptable for things that are hard in-browser (e.g., PDF parsing)
- **Audience**: hiring managers and engineers evaluating technical skill, plus developers who'd actually use the library

## Constraints

- **Tech stack**: TypeScript, Next.js (App Router), Tailwind CSS, shadcn/ui, Zod, Turborepo monorepo
- **Hosting**: Vercel free tier for web app
- **LLM**: Vision-capable models. Start with one provider (Claude or OpenAI), abstract for easy addition of others
- **BYOK**: No API key management on server side. User provides their own key
- **Solo developer**: One person building everything - architecture must not create unnecessary coordination overhead

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Monorepo with Turborepo | Shared core engine across web + CLI, single repo for portfolio visibility | Done - pnpm 10 + Turborepo 2.8 with topological build order |
| Client-side preferred, API routes allowed | Privacy-first but pragmatic - PDF parsing may need server help | Done - extraction stays browser-side, and Phase 04 added only a bounded `/api/pdf-inspect` diagnostic route on Vercel |
| One LLM provider first | Prove the abstraction before adding complexity. Clean interface matters more than provider count | Done - the browser flow now supports Anthropic and OpenAI through the same shared provider abstraction |
| 2-3 templates, not 6 | Depth over breadth. Extensible system design is more impressive than template quantity | Done - invoice, receipt, W-2, and custom-schema support are all verified in the shared core library |
| Defer batch mode | Single-doc flow must be excellent first. Batch adds complexity without proving core value | Pending |
| Core + web app priority over CLI | These are the most visible for portfolio. CLI is functional but lower polish | In progress - the shared core library and Phase 04 web flow are complete; Phase 05 polish and the CLI remain |

## Current State

- Phase 04 is complete: the web app supports drag-and-drop upload, provider-aware BYOK entry, template selection, in-page extraction preview, and a production-verified Vercel deployment.
- Extraction remains browser-first: the provider key stays in sessionStorage and the live network path goes directly to the selected LLM provider.
- The only DocPipe-hosted runtime route added for the web app so far is `/api/pdf-inspect`, which measures PDF classification behavior without becoming an extraction proxy.

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check - still the right priority?
3. Audit Out of Scope - reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-29 - Phase 04 complete (browser upload flow, provider-aware BYOK, Vercel verification, and PDF inspect diagnostics)*
