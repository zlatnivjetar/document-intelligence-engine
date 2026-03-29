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

### Active

- [ ] Built-in receipt and W-2 templates, plus extensible custom-schema support
- [ ] BYOK - users provide their own LLM API key
- [ ] Web app: drag-and-drop upload, template selection, live extraction preview, results table with confidence indicators
- [ ] Web app: export as JSON, CSV, or copy to clipboard
- [ ] Web app: API key input stored in browser only
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
- Multiple LLM providers in v1 - start with one, clean abstraction makes adding providers easy

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
| Client-side preferred, API routes allowed | Privacy-first but pragmatic - PDF parsing may need server help | Pending |
| One LLM provider first | Prove the abstraction before adding complexity. Clean interface matters more than provider count | In progress - Anthropic provider is implemented and Phase 02 proved the shared extract() API against a LanguageModelV3-compatible model surface |
| 2-3 templates, not 6 | Depth over breadth. Extensible system design is more impressive than template quantity | In progress - invoice template is complete; receipt, W-2, and custom-schema completion move to Phase 03 |
| Defer batch mode | Single-doc flow must be excellent first. Batch adds complexity without proving core value | Pending |
| Core + web app priority over CLI | These are the most visible for portfolio. CLI is functional but lower polish | In progress - the shared core library is the first completed product surface; web remains ahead of CLI in the roadmap |

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
*Last updated: 2026-03-29 - Phase 02 complete (extraction pipeline, invoice template, and npm consumer verification)*
