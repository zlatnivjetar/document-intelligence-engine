// @docpipe/core — public API

// Core types: ExtractionInput, ExtractionResult, ExtractionError, ExtractionErrorCode
export type {
  ExtractionInput,
  ExtractionResult,
  ExtractionError,
  ExtractionErrorCode,
} from './types.js';

// Provider factory: createAnthropicProvider, AnthropicProviderOptions
export type { AnthropicProviderOptions } from './provider.js';
export { createAnthropicProvider } from './provider.js';

// Core extraction function: extract, ExtractOptions
export type { ExtractOptions } from './extract.js';
export { extract } from './extract.js';

// Built-in templates
export type { InvoiceData } from './templates/invoice.js';
export { invoiceSchema } from './templates/invoice.js';
export type { ReceiptData } from './templates/receipt.js';
export { receiptSchema } from './templates/receipt.js';
export type { W2Data } from './templates/w2.js';
export { w2Schema } from './templates/w2.js';
