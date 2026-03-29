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
