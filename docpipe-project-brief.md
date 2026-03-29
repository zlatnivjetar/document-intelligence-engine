# DocPipe — Document Intelligence Engine

## What It Is

DocPipe is an open-source document intelligence engine that extracts structured data from unstructured documents (PDFs, images, scanned files). You feed it a messy invoice, contract, receipt, booking confirmation, or any business document — it returns clean, validated, structured JSON.

The core differentiator: schema-driven extraction with validation. You define what data you want (or pick a built-in template), and DocPipe enforces that structure on every document, every time. This makes it reliable enough for real business workflows, not just one-off AI demos.

## Three Access Layers

### 1. Core Engine (TypeScript library)

The heart of the project. A standalone TypeScript library that handles:

- **Multi-format input**: PDF, images (PNG/JPG), scanned documents
- **LLM-powered extraction**: Uses vision-capable LLMs (Claude, OpenAI) to understand document content — text, tables, handwriting, charts
- **Schema-driven output**: User defines output structure using Zod schemas. The engine validates extracted data against the schema and returns typed, structured JSON
- **Built-in templates**: Pre-built schemas for common document types (invoices, receipts, contracts, booking confirmations, menus, business cards)
- **Confidence scoring**: Each extracted field includes a confidence score so downstream systems can flag uncertain extractions for human review
- **BYOK (Bring Your Own Key)**: Users provide their own LLM API key. Supports multiple providers

Publishable as an npm package. Other developers can import and integrate it into their own applications and pipelines.

### 2. Web Application (Next.js)

A clean, polished web interface for non-technical users:

- **Drag-and-drop upload**: Drop a document, pick a template (or define a custom one), get results
- **Live extraction preview**: Watch fields populate as the LLM processes the document
- **Results table view**: Structured output displayed in a readable table with field-level confidence indicators
- **Export options**: Download results as JSON, CSV, or copy to clipboard
- **Batch mode**: Upload multiple documents, process them all against the same template, export as a single dataset
- **API key input**: Users enter their own LLM API key (stored only in browser, never on server)

Hosted on Vercel (free tier). This is the primary demo surface — send someone a link, they try it immediately.

### 3. CLI (npm package)

A command-line interface wrapping the core engine for developer workflows:

- **Single file**: `npx docpipe process invoice.pdf --template invoice`
- **Batch processing**: `npx docpipe process ./documents/ --template invoice --output ./structured/`
- **Custom schemas**: `npx docpipe process contract.pdf --schema ./my-schema.ts`
- **Multiple output formats**: JSON (default), CSV, NDJSON for streaming
- **Pipeline-friendly**: Stdout output for piping into other tools

## Technical Architecture

- **Core engine**: TypeScript, Zod for schema validation, supports Claude (vision) and OpenAI (vision) as LLM providers
- **Web app**: Next.js (App Router), TypeScript, Tailwind, shadcn/ui. Client-side processing — the server is just a static host. API calls go directly from the browser to the LLM provider using the user's key
- **CLI**: TypeScript, built on the same core engine. Published as an npm package
- **Monorepo structure**: Core engine, web app, and CLI in a single repo (e.g., Turborepo)

```
docpipe/
├── packages/
│   ├── core/          # TypeScript extraction engine + Zod schemas
│   ├── web/           # Next.js web application
│   └── cli/           # CLI tool
├── templates/         # Built-in document templates (invoice, receipt, etc.)
├── examples/          # Example documents + expected outputs
└── docs/              # Documentation
```

## Built-in Templates (Starter Set)

1. **Invoice** — vendor, line items, totals, tax, dates, payment terms
2. **Receipt** — merchant, items, total, payment method, date
3. **Contract** — parties, dates, key terms, obligations, signatures
4. **Booking confirmation** — guest name, dates, property, rate, confirmation number
5. **Business card** — name, title, company, email, phone, address
6. **Menu** — categories, items, descriptions, prices, dietary flags

## Key Design Decisions

- **Client-side processing in web app**: No backend server storing documents or API keys. Everything runs in the browser. This eliminates privacy concerns, hosting costs, and security surface area.
- **Schema-first**: The schema is not optional. Every extraction is validated. Malformed output is retried or flagged, never silently passed through.
- **Provider-agnostic**: The core engine abstracts the LLM provider. Swap between Claude and OpenAI with a config flag. Future providers plug in without changing extraction logic.
- **Monorepo with shared core**: The web app and CLI are thin wrappers around the same engine. No logic duplication.

## What Success Looks Like

- A non-technical user can visit the web app, upload a PDF invoice, and get a clean CSV export in under 30 seconds with zero setup
- A developer can `npm install @docpipe/core`, define a Zod schema for their specific document type, and extract structured data in 10 lines of code
- A power user can batch-process 200 receipts from the command line and get a single consolidated CSV
- The project README includes clear examples, a live demo link, and template documentation
