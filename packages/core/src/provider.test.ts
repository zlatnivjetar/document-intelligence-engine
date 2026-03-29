import { describe, it, expect } from 'vitest';
import { createAnthropicProvider, createOpenAIProvider } from './provider.js';
import type {
  ExtractionInput,
  ExtractionResult,
  ExtractionError,
  ExtractionErrorCode,
} from './types.js';

describe('createAnthropicProvider', () => {
  it('returns an object with the LanguageModelV1 shape (specificationVersion, provider, modelId)', () => {
    // Uses a fake key — this test only verifies the object shape, not real API calls
    const model = createAnthropicProvider({
      apiKey: 'sk-ant-test-fake-key-for-type-check',
    });
    expect(model).toBeDefined();
    expect(typeof model.specificationVersion).toBe('string');
    expect(typeof model.provider).toBe('string');
    expect(typeof model.modelId).toBe('string');
    expect(model.provider).toBe('anthropic.messages');
    expect(model.modelId).toBe('claude-sonnet-4-6');
  });

  it('accepts a custom model ID', () => {
    const model = createAnthropicProvider({
      apiKey: 'sk-ant-test-fake',
      model: 'claude-opus-4-5',
    });
    expect(model.modelId).toBe('claude-opus-4-5');
  });

  it('defaults to claude-sonnet-4-6 when no model is specified', () => {
    const model = createAnthropicProvider({ apiKey: 'sk-ant-fake' });
    expect(model.modelId).toBe('claude-sonnet-4-6');
  });
});

describe('createOpenAIProvider', () => {
  it('returns an object with the LanguageModelV3 shape (specificationVersion, provider, modelId)', () => {
    const model = createOpenAIProvider({
      apiKey: 'sk-proj-test-fake-key-for-type-check',
    });
    expect(model).toBeDefined();
    expect(typeof model.specificationVersion).toBe('string');
    expect(typeof model.provider).toBe('string');
    expect(typeof model.modelId).toBe('string');
    expect(model.modelId).toBe('gpt-4.1');
  });

  it('accepts a custom model ID', () => {
    const model = createOpenAIProvider({
      apiKey: 'sk-proj-test-fake',
      model: 'gpt-4.1-mini',
    });
    expect(model.modelId).toBe('gpt-4.1-mini');
  });

  it('defaults to gpt-4.1 when no model is specified', () => {
    const model = createOpenAIProvider({ apiKey: 'sk-proj-fake' });
    expect(model.modelId).toBe('gpt-4.1');
  });
});

describe('ExtractionError discriminated union', () => {
  it('TypeScript narrows correctly on code field', () => {
    // This test exists to prove the type compiles — no runtime assertion needed
    const err: ExtractionError = {
      code: 'VALIDATION_FAILED',
      message: 'Zod validation failed',
      retryable: false,
      validationErrors: ['field "total" must be a number'],
    };

    // Type narrowing: TypeScript should know validationErrors exists here
    if (err.code === 'VALIDATION_FAILED') {
      expect(err.validationErrors).toHaveLength(1);
    }

    const retryableErr: ExtractionError = {
      code: 'EXTRACTION_FAILED',
      message: 'LLM returned unparseable response',
      retryable: true,
    };
    expect(retryableErr.retryable).toBe(true);
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
});

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
    expect(result.overallConfidence).toBeCloseTo(0.915);
  });
});

// Compile-time check: ExtractionErrorCode is the union of all valid codes
const _codeCheck: ExtractionErrorCode = 'INVALID_API_KEY';
void _codeCheck;
