/**
 * Input document for extraction.
 * Web app sends base64 strings or browser-native binary data. CLI sends Buffer.
 * All inputs normalize to Claude's native document block (per D-13).
 */
export interface ExtractionInput {
  document: string | Uint8Array | ArrayBuffer | Buffer;
  mimeType: 'application/pdf' | 'image/png' | 'image/jpeg';
}

/**
 * Successful extraction result with typed data and per-field confidence scores.
 * T is the shape of the extracted data (determined by the Zod schema passed to extract()).
 * Per D-14: confidence is a parallel map keyed by field name, NOT nested per-field.
 */
export interface ExtractionWarning {
  code: string;
  message: string;
  field?: string;
}

export interface ExtractionResult<T> {
  data: T;
  confidence: Record<string, number>;
  overallConfidence: number;
  pdfType?: 'text-layer' | 'image-only';
  warnings?: ExtractionWarning[];
}

/**
 * Error codes for the discriminated union.
 * Per D-15: each code maps to a specific failure mode with distinct retry behavior.
 */
export type ExtractionErrorCode =
  | 'INVALID_API_KEY' // 401 from provider — no retry
  | 'RATE_LIMITED' // 429 from provider — no retry (respect backoff)
  | 'UNSUPPORTED_FILE_TYPE' // mimeType not accepted by provider
  | 'EXTRACTION_FAILED' // LLM call failed or returned unparseable response
  | 'VALIDATION_FAILED'; // Zod validation failed after max retries

/**
 * Discriminated union error type (per D-15).
 * The `code` field is the discriminant — TypeScript narrows exhaustively.
 * `retryable` tells the caller whether retrying with the same input is safe.
 */
export type ExtractionError =
  | { code: 'INVALID_API_KEY'; message: string; retryable: false }
  | { code: 'RATE_LIMITED'; message: string; retryable: false }
  | { code: 'UNSUPPORTED_FILE_TYPE'; message: string; retryable: false }
  | { code: 'EXTRACTION_FAILED'; message: string; retryable: true }
  | {
      code: 'VALIDATION_FAILED';
      message: string;
      retryable: false;
      validationErrors: string[];
    };
