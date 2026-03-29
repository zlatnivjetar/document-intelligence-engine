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
): {
  object: {
    extracted: InvoiceData;
    confidence: Record<string, number>;
  };
} {
  return {
    object: {
      extracted: overrides?.extracted ?? mockData,
      confidence: overrides?.confidence ?? mockConfidence,
    },
  };
}

function getGenerateObjectRequest(): Parameters<typeof generateObject>[0] {
  const request = vi.mocked(generateObject).mock.calls[0]?.[0];
  expect(request).toBeDefined();

  if (!request) {
    throw new Error('Expected generateObject to be called');
  }

  return request;
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
      mimeType: 'application/pdf',
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
      mimeType: 'image/png',
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
      mimeType: 'image/jpeg',
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
});
