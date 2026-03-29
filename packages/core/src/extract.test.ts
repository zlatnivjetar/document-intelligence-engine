import type { LanguageModelV3 } from '@ai-sdk/provider';
import { generateObject } from 'ai';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { extract } from './extract.js';
import type { ExtractionResult } from './types.js';

vi.mock('ai', () => ({
  generateObject: vi.fn(),
}));

interface InvoiceData {
  vendor: string;
  total: number;
}

const invoiceSchema = z.object({
  vendor: z.string(),
  total: z.number(),
});

const mockModel = {} as LanguageModelV3;
const mockData: InvoiceData = {
  vendor: 'ACME Corp',
  total: 123.45,
};
const mockConfidence = {
  vendor: 0.9,
  total: 0.8,
};

function createResponse(
  overrides?: Partial<{
    extracted: InvoiceData;
    confidence: Record<string, number>;
  }>,
): Awaited<ReturnType<typeof generateObject>> {
  return {
    object: {
      extracted: overrides?.extracted ?? mockData,
      confidence: overrides?.confidence ?? mockConfidence,
    },
  } as Awaited<ReturnType<typeof generateObject>>;
}

function getGenerateObjectRequest(): Parameters<typeof generateObject>[0] {
  const request = vi.mocked(generateObject).mock.calls[0]?.[0];
  expect(request).toBeDefined();

  if (!request) {
    throw new Error('Expected generateObject to be called');
  }

  return request;
}

function getGenerateObjectRequestAt(
  index: number,
): Parameters<typeof generateObject>[0] {
  const request = vi.mocked(generateObject).mock.calls[index]?.[0];
  expect(request).toBeDefined();

  if (!request) {
    throw new Error(`Expected generateObject call at index ${index}`);
  }

  return request;
}

function createMockError(
  message: string,
  overrides?: Record<string, unknown>,
): Error {
  return Object.assign(new Error(message), overrides);
}

describe('extract', () => {
  beforeEach(() => {
    vi.mocked(generateObject).mockReset();
    vi.mocked(generateObject).mockResolvedValue(createResponse());
  });

  it('routes PDF buffers through a file content block with application/pdf mimeType', async () => {
    const pdfBuffer = Buffer.from('fake-pdf');

    const result = await extract({
      input: {
        document: pdfBuffer,
        mimeType: 'application/pdf',
      },
      schema: invoiceSchema,
      model: mockModel,
    });

    const request = getGenerateObjectRequest();
    const filePart = request.messages?.[0]?.content?.[1];

    expect(filePart).toEqual({
      type: 'file',
      data: pdfBuffer.toString('base64'),
      mediaType: 'application/pdf',
    });
    expect(result.data).toEqual(mockData);
  });

  it('routes PNG base64 input through a file content block with image/png mimeType', async () => {
    await extract({
      input: {
        document: 'png-base64-data',
        mimeType: 'image/png',
      },
      schema: invoiceSchema,
      model: mockModel,
    });

    const request = getGenerateObjectRequest();
    const filePart = request.messages?.[0]?.content?.[1];

    expect(filePart).toEqual({
      type: 'file',
      data: 'png-base64-data',
      mediaType: 'image/png',
    });
  });

  it('routes JPEG base64 input through a file content block with image/jpeg mimeType', async () => {
    await extract({
      input: {
        document: 'jpeg-base64-data',
        mimeType: 'image/jpeg',
      },
      schema: invoiceSchema,
      model: mockModel,
    });

    const request = getGenerateObjectRequest();
    const filePart = request.messages?.[0]?.content?.[1];

    expect(filePart).toEqual({
      type: 'file',
      data: 'jpeg-base64-data',
      mediaType: 'image/jpeg',
    });
  });

  it('returns one numeric confidence key per top-level schema field', async () => {
    const result = await extract({
      input: {
        document: 'png-base64-data',
        mimeType: 'image/png',
      },
      schema: invoiceSchema,
      model: mockModel,
    });

    expect(Object.keys(result.confidence).sort()).toEqual(['total', 'vendor']);
    expect(
      Object.values(result.confidence).every(
        (value) => typeof value === 'number' && value >= 0 && value <= 1,
      ),
    ).toBe(true);
  });

  it('computes overallConfidence as the arithmetic mean of per-field scores', async () => {
    vi.mocked(generateObject).mockResolvedValueOnce(
      createResponse({
        confidence: {
          vendor: 0.65,
          total: 0.95,
        },
      }),
    );

    const result = await extract({
      input: {
        document: 'png-base64-data',
        mimeType: 'image/png',
      },
      schema: invoiceSchema,
      model: mockModel,
    });

    expect(result.overallConfidence).toBeCloseTo(0.8);
  });

  it('returns ExtractionResult<T> with schema-typed data', async () => {
    const result: ExtractionResult<InvoiceData> = await extract({
      input: {
        document: 'png-base64-data',
        mimeType: 'image/png',
      },
      schema: invoiceSchema,
      model: mockModel,
    });

    const vendorName: string = result.data.vendor;
    const totalAmount: number = result.data.total;

    expect(vendorName).toBe('ACME Corp');
    expect(totalAmount).toBe(123.45);
  });

  it('throws INVALID_API_KEY without retrying when the provider returns 401', async () => {
    vi.mocked(generateObject).mockRejectedValueOnce(
      createMockError('Unauthorized', { status: 401 }),
    );

    await expect(
      extract({
        input: {
          document: 'png-base64-data',
          mimeType: 'image/png',
        },
        schema: invoiceSchema,
        model: mockModel,
      }),
    ).rejects.toMatchObject({
      code: 'INVALID_API_KEY',
      retryable: false,
    });

    expect(generateObject).toHaveBeenCalledTimes(1);
  });

  it('throws RATE_LIMITED without retrying when the provider returns 429', async () => {
    vi.mocked(generateObject).mockRejectedValueOnce(
      createMockError('Rate limited', { status: 429 }),
    );

    await expect(
      extract({
        input: {
          document: 'png-base64-data',
          mimeType: 'image/png',
        },
        schema: invoiceSchema,
        model: mockModel,
      }),
    ).rejects.toMatchObject({
      code: 'RATE_LIMITED',
      retryable: false,
    });

    expect(generateObject).toHaveBeenCalledTimes(1);
  });

  it('retries validation failures with the previous validation error appended to the prompt', async () => {
    vi.mocked(generateObject)
      .mockRejectedValueOnce(
        createMockError('validation failed', {
          name: 'NoObjectGeneratedError',
        }),
      )
      .mockResolvedValueOnce(createResponse());

    await extract({
      input: {
        document: 'png-base64-data',
        mimeType: 'image/png',
      },
      schema: invoiceSchema,
      model: mockModel,
    });

    const retryRequest = getGenerateObjectRequestAt(1);

    expect(generateObject).toHaveBeenCalledTimes(2);
    expect(retryRequest.messages).toHaveLength(2);
    expect(retryRequest.messages?.[1]).toEqual({
      role: 'user',
      content:
        'Previous extraction attempt failed schema validation.\nErrors:\nvalidation failed\nPlease fix your output to match the required schema exactly.',
    });
  });

  it('throws VALIDATION_FAILED after exhausting validation retries', async () => {
    vi.mocked(generateObject).mockRejectedValue(
      createMockError('validation failed', {
        name: 'NoObjectGeneratedError',
      }),
    );

    await expect(
      extract({
        input: {
          document: 'png-base64-data',
          mimeType: 'image/png',
        },
        schema: invoiceSchema,
        model: mockModel,
      }),
    ).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
      retryable: false,
      validationErrors: ['validation failed'],
    });

    expect(generateObject).toHaveBeenCalledTimes(3);
  });

  it('throws EXTRACTION_FAILED for non-validation provider errors', async () => {
    vi.mocked(generateObject).mockRejectedValueOnce(
      createMockError('Provider crashed'),
    );

    await expect(
      extract({
        input: {
          document: 'png-base64-data',
          mimeType: 'image/png',
        },
        schema: invoiceSchema,
        model: mockModel,
      }),
    ).rejects.toMatchObject({
      code: 'EXTRACTION_FAILED',
      retryable: true,
    });
  });

  it('throws UNSUPPORTED_FILE_TYPE before calling the model', async () => {
    await expect(
      extract({
        input: {
          document: 'video-data',
          mimeType: 'video/mp4' as never,
        },
        schema: invoiceSchema,
        model: mockModel,
      }),
    ).rejects.toMatchObject({
      code: 'UNSUPPORTED_FILE_TYPE',
      retryable: false,
    });

    expect(generateObject).not.toHaveBeenCalled();
  });
});
