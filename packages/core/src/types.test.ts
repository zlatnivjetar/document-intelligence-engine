import { describe, it, expect } from 'vitest';
import type {
  ExtractionInput,
  ExtractionResult,
  ExtractionError,
  ExtractionErrorCode,
} from './types.js';

describe('ExtractionInput type', () => {
  it('accepts Buffer input', () => {
    const input: ExtractionInput = {
      document: Buffer.from('fake pdf bytes'),
      mimeType: 'application/pdf',
    };
    expect(Buffer.isBuffer(input.document)).toBe(true);
    expect(input.mimeType).toBe('application/pdf');
  });

  it('accepts base64 string input', () => {
    const input: ExtractionInput = {
      document: 'SGVsbG8gV29ybGQ=', // "Hello World" in base64
      mimeType: 'image/png',
    };
    expect(typeof input.document).toBe('string');
    expect(input.mimeType).toBe('image/png');
  });

  it('accepts image/jpeg mimeType', () => {
    const input: ExtractionInput = {
      document: 'base64data',
      mimeType: 'image/jpeg',
    };
    expect(input.mimeType).toBe('image/jpeg');
  });
});

describe('ExtractionResult type', () => {
  it('generic T flows through to data field', () => {
    interface InvoiceData {
      vendor: string;
      total: number;
    }
    const result: ExtractionResult<InvoiceData> = {
      data: { vendor: 'ACME Corp', total: 1234.56 },
      confidence: { vendor: 0.95, total: 0.88 },
      overallConfidence: 0.915,
    };
    expect(result.data.vendor).toBe('ACME Corp');
    expect(result.data.total).toBe(1234.56);
    expect(result.confidence['vendor']).toBe(0.95);
    expect(result.overallConfidence).toBeCloseTo(0.915);
  });

  it('confidence is a Record<string, number>', () => {
    const result: ExtractionResult<{ name: string }> = {
      data: { name: 'test' },
      confidence: { name: 0.99 },
      overallConfidence: 0.99,
    };
    expect(typeof result.confidence['name']).toBe('number');
  });
});

describe('ExtractionError discriminated union', () => {
  it('TypeScript narrows correctly on code field — VALIDATION_FAILED has validationErrors', () => {
    const err: ExtractionError = {
      code: 'VALIDATION_FAILED',
      message: 'Zod validation failed',
      retryable: false,
      validationErrors: ['field "total" must be a number'],
    };

    if (err.code === 'VALIDATION_FAILED') {
      expect(err.validationErrors).toHaveLength(1);
    }
  });

  it('EXTRACTION_FAILED error has retryable: true', () => {
    const err: ExtractionError = {
      code: 'EXTRACTION_FAILED',
      message: 'LLM returned unparseable response',
      retryable: true,
    };
    expect(err.retryable).toBe(true);
  });

  it('INVALID_API_KEY error has retryable: false', () => {
    const err: ExtractionError = {
      code: 'INVALID_API_KEY',
      message: 'Invalid API key',
      retryable: false,
    };
    expect(err.retryable).toBe(false);
    expect(err.code).toBe('INVALID_API_KEY');
  });

  it('RATE_LIMITED error has retryable: false', () => {
    const err: ExtractionError = {
      code: 'RATE_LIMITED',
      message: 'Too many requests',
      retryable: false,
    };
    expect(err.retryable).toBe(false);
  });

  it('UNSUPPORTED_FILE_TYPE error has retryable: false', () => {
    const err: ExtractionError = {
      code: 'UNSUPPORTED_FILE_TYPE',
      message: 'File type not supported',
      retryable: false,
    };
    expect(err.retryable).toBe(false);
  });
});

// Compile-time check: ExtractionErrorCode is the union of all valid codes
const _codeCheck: ExtractionErrorCode = 'INVALID_API_KEY';
void _codeCheck;
