# Requirements: DocPipe

**Defined:** 2026-03-28
**Core Value:** A user can upload a document and get clean, validated structured data back - reliably, every time.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Document Input

- [x] **INPUT-01**: User can upload PDF files for extraction
- [x] **INPUT-02**: User can upload image files (PNG, JPG) for extraction
- [x] **INPUT-03**: Engine detects PDF type (text-layer vs image-only) and routes to appropriate processing path
- [ ] **INPUT-04**: Web app provides drag-and-drop upload with visual feedback and file type validation

### Extraction Engine

- [x] **EXTRACT-01**: Engine extracts structured data from documents using vision-capable LLM
- [x] **EXTRACT-02**: Extraction is schema-driven - user defines output structure using Zod schemas
- [x] **EXTRACT-03**: Each extracted field includes a confidence score
- [x] **EXTRACT-04**: Engine automatically retries extraction when output fails Zod validation (max 2 retries, error fed back to model)
- [x] **EXTRACT-05**: Engine provides clear error states: invalid API key, unsupported file type, extraction failure, validation failure after retries
- [x] **EXTRACT-06**: Provider abstraction layer - start with one LLM provider (Claude), clean interface for adding more
- [x] **EXTRACT-07**: Templates include business-rule validators (e.g., invoice line items must sum to total)
- [x] **EXTRACT-08**: Retry logic respects a cost budget - no retry on 401/429, max 2 retries per extraction

### Templates

- [x] **TMPL-01**: Built-in invoice template (vendor name, vendor address, invoice number, invoice date, due date, line items, subtotal, tax amount, tax rate, total)
- [x] **TMPL-02**: Built-in receipt template (merchant name, merchant address, date, line items, subtotal, tax, total)
- [x] **TMPL-03**: Built-in W-2 template (employer info, employee info, wages/tips, federal tax withheld, state info, tax year)
- [x] **TMPL-04**: Template system is extensible - users can define custom Zod schemas for any document type

### Web Application

- [ ] **WEB-01**: BYOK API key input stored in browser only (localStorage/sessionStorage), never sent to server
- [ ] **WEB-02**: Live extraction preview - results appear in-page as extraction completes
- [ ] **WEB-03**: Results displayed in table with field-level confidence color-coding (green >= 0.85, amber 0.60-0.84, red < 0.60)
- [ ] **WEB-04**: Export results as JSON (file download)
- [ ] **WEB-05**: Export results as CSV (file download)
- [ ] **WEB-06**: Copy JSON to clipboard with instant visual feedback
- [ ] **WEB-07**: Custom Zod schema input - users can provide custom schemas in the web UI
- [ ] **WEB-08**: Template selection UI - users pick from built-in templates or provide custom schema

### CLI

- [ ] **CLI-01**: Single-file extraction: `docpipe extract <file> --template <name>`
- [ ] **CLI-02**: Custom schema support: `docpipe extract <file> --schema <path>`
- [ ] **CLI-03**: Output formats: JSON (default), CSV
- [ ] **CLI-04**: Stdout output for piping into other tools

### Library / Infrastructure

- [x] **LIB-01**: Core engine publishable as npm package with clean, documented public API
- [x] **LIB-02**: Monorepo structure (Turborepo + pnpm) with packages/core, packages/web, packages/cli
- [x] **LIB-03**: Web and CLI are thin wrappers around the shared core engine - no logic duplication

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Batch Processing

- **BATCH-01**: Web app batch mode - upload multiple documents, process against same template
- **BATCH-02**: CLI batch mode - process directory of documents
- **BATCH-03**: Consolidated export from batch results

### Additional Providers

- **PROV-01**: OpenAI vision provider implementation
- **PROV-02**: Gemini vision provider implementation

### Additional Templates

- **TMPL-05**: Contract template (parties, dates, key terms, obligations)
- **TMPL-06**: Booking confirmation template (guest, dates, property, rate, confirmation number)
- **TMPL-07**: Business card template (name, title, company, contact info)
- **TMPL-08**: Menu template (categories, items, prices, dietary flags)

### Web Enhancements

- **WEB-09**: Extraction history in localStorage (last 5 results)
- **WEB-10**: Schema editor with syntax highlighting and validation

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Server-side document storage | Conflicts with privacy-first positioning. Requires auth, database, GDPR compliance, retention policies |
| User accounts / OAuth | BYOK model eliminates the need. Auth adds weeks of work that doesn't demonstrate document extraction skill |
| Human-in-the-loop review queue | Separate product category (Rossum's entire business). Overkill for a BYOK extraction tool |
| Document auto-classification | Adds a failure-prone pre-extraction step. Template selection is a one-click UX step |
| Training / fine-tuning on user data | Requires ML infrastructure. LLM-based approach uses prompt engineering instead |
| Real-time webhooks | Adds backend infrastructure for a client-side tool. Synchronous API is sufficient |
| Multi-language UI | i18n adds maintenance burden. Extraction itself handles multilingual documents via the LLM |
| Mobile app | Web-first. Mobile is a separate product decision |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INPUT-01 | Phase 2 | Complete |
| INPUT-02 | Phase 2 | Complete |
| INPUT-03 | Phase 3 | Complete |
| INPUT-04 | Phase 4 | Pending |
| EXTRACT-01 | Phase 2 | Complete |
| EXTRACT-02 | Phase 2 | Complete |
| EXTRACT-03 | Phase 2 | Complete |
| EXTRACT-04 | Phase 2 | Complete |
| EXTRACT-05 | Phase 2 | Complete |
| EXTRACT-06 | Phase 1 | Complete |
| EXTRACT-07 | Phase 3 | Complete |
| EXTRACT-08 | Phase 2 | Complete |
| TMPL-01 | Phase 2 | Complete |
| TMPL-02 | Phase 3 | Complete |
| TMPL-03 | Phase 3 | Complete |
| TMPL-04 | Phase 3 | Complete |
| WEB-01 | Phase 4 | Pending |
| WEB-02 | Phase 4 | Pending |
| WEB-03 | Phase 5 | Pending |
| WEB-04 | Phase 5 | Pending |
| WEB-05 | Phase 5 | Pending |
| WEB-06 | Phase 5 | Pending |
| WEB-07 | Phase 5 | Pending |
| WEB-08 | Phase 4 | Pending |
| CLI-01 | Phase 6 | Pending |
| CLI-02 | Phase 6 | Pending |
| CLI-03 | Phase 6 | Pending |
| CLI-04 | Phase 6 | Pending |
| LIB-01 | Phase 2 | Complete |
| LIB-02 | Phase 1 | Complete |
| LIB-03 | Phase 3 | Complete |

**Coverage:**
- v1 requirements: 31 total
- Mapped to phases: 31
- Unmapped: 0

---
*Requirements defined: 2026-03-28*
*Last updated: 2026-03-29 - Phase 03 complete; TMPL-02, TMPL-03, TMPL-04, EXTRACT-07, INPUT-03, and LIB-03 verified complete*
