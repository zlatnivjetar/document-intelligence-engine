import type { LanguageModelV3 } from '@ai-sdk/provider';
import { generateObject } from 'ai';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { extract } from './extract.js';
import { invoiceSchema as builtInInvoiceSchema } from './templates/invoice.js';
import { receiptSchema } from './templates/receipt.js';
import { w2Schema } from './templates/w2.js';
import type { ExtractionResult, ExtractionWarning } from './types.js';

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
      routingOverride: 'image-only',
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

  it('accepts Uint8Array browser input and encodes it as base64', async () => {
    await extract({
      input: {
        document: new Uint8Array([1, 2, 3]),
        mimeType: 'image/png',
      },
      schema: invoiceSchema,
      model: mockModel,
    });

    const request = getGenerateObjectRequest();
    const filePart = request.messages?.[0]?.content?.[1];

    expect(filePart).toEqual({
      type: 'file',
      data: 'AQID',
      mediaType: 'image/png',
    });
  });

  it('accepts ArrayBuffer browser input and encodes it as base64', async () => {
    const document = new ArrayBuffer(3);
    new Uint8Array(document).set([1, 2, 3]);

    await extract({
      input: {
        document,
        mimeType: 'image/png',
      },
      schema: invoiceSchema,
      model: mockModel,
    });

    const request = getGenerateObjectRequest();
    const filePart = request.messages?.[0]?.content?.[1];

    expect(filePart).toEqual({
      type: 'file',
      data: 'AQID',
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

describe('extract() - PDF routing via routingOverride', () => {
  beforeEach(() => {
    vi.mocked(generateObject).mockReset();
  });

  it('returns pdfType text-layer when routingOverride is text-layer', async () => {
    vi.mocked(generateObject).mockResolvedValueOnce({
      object: {
        extracted: {
          vendorName: 'Test Vendor',
          vendorAddress: null,
          invoiceNumber: 'INV-001',
          invoiceDate: '2024-01-15',
          dueDate: null,
          lineItems: [],
          subtotal: 100,
          taxAmount: null,
          taxRate: null,
          total: 100,
        },
        confidence: {
          vendorName: 0.9,
          vendorAddress: 0.9,
          invoiceNumber: 0.9,
          invoiceDate: 0.9,
          dueDate: 0.9,
          lineItems: 0.9,
          subtotal: 0.9,
          taxAmount: 0.9,
          taxRate: 0.9,
          total: 0.9,
        },
      },
    } as Awaited<ReturnType<typeof generateObject>>);

    const result = await extract({
      input: { document: 'base64pdfdata', mimeType: 'application/pdf' },
      schema: builtInInvoiceSchema,
      model: mockModel,
      routingOverride: 'text-layer',
    });

    expect(result.pdfType).toBe('text-layer');
  });

  it('returns pdfType image-only when routingOverride is image-only', async () => {
    vi.mocked(generateObject).mockResolvedValueOnce({
      object: {
        extracted: {
          vendorName: 'Test Vendor',
          vendorAddress: null,
          invoiceNumber: 'INV-002',
          invoiceDate: '2024-01-15',
          dueDate: null,
          lineItems: [],
          subtotal: 200,
          taxAmount: null,
          taxRate: null,
          total: 200,
        },
        confidence: {
          vendorName: 0.92,
          vendorAddress: 0.92,
          invoiceNumber: 0.92,
          invoiceDate: 0.92,
          dueDate: 0.92,
          lineItems: 0.92,
          subtotal: 0.92,
          taxAmount: 0.92,
          taxRate: 0.92,
          total: 0.92,
        },
      },
    } as Awaited<ReturnType<typeof generateObject>>);

    const result = await extract({
      input: { document: 'base64pdfdata', mimeType: 'application/pdf' },
      schema: builtInInvoiceSchema,
      model: mockModel,
      routingOverride: 'image-only',
    });

    expect(result.pdfType).toBe('image-only');
  });
});

describe('extract() - validators and custom schema support', () => {
  beforeEach(() => {
    vi.mocked(generateObject).mockReset();
  });

  it('runs validators and attaches warnings to the extraction result', async () => {
    const mockWarning: ExtractionWarning = {
      code: 'TEST_WARNING',
      message: 'test warning',
    };
    const mockValidator = vi.fn().mockReturnValue([mockWarning]);
    const customSchema = z.object({ amount: z.number() });

    vi.mocked(generateObject).mockResolvedValueOnce({
      object: {
        extracted: { amount: 0 },
        confidence: { amount: 1 },
      },
    } as Awaited<ReturnType<typeof generateObject>>);

    const result = await extract({
      input: { document: 'base64data', mimeType: 'image/png' },
      schema: customSchema,
      model: mockModel,
      validators: [mockValidator],
    });

    expect(mockValidator).toHaveBeenCalledWith({ amount: 0 });
    expect(result.warnings).toEqual([mockWarning]);
  });

  it('returns undefined warnings when no validators are provided', async () => {
    const customSchema = z.object({ amount: z.number() });

    vi.mocked(generateObject).mockResolvedValueOnce({
      object: {
        extracted: { amount: 100 },
        confidence: { amount: 0.9 },
      },
    } as Awaited<ReturnType<typeof generateObject>>);

    const result = await extract({
      input: { document: 'base64data', mimeType: 'image/png' },
      schema: customSchema,
      model: mockModel,
    });

    expect(result.warnings).toBeUndefined();
  });

  it('TMPL-04: supports custom Zod schemas end-to-end', async () => {
    const contractSchema = z.object({
      partyA: z.string(),
      partyB: z.string(),
      effectiveDate: z.string(),
      totalValue: z.number(),
    });

    vi.mocked(generateObject).mockResolvedValueOnce({
      object: {
        extracted: {
          partyA: 'Acme Corp',
          partyB: 'Globe Ltd',
          effectiveDate: '2024-06-01',
          totalValue: 50000,
        },
        confidence: {
          partyA: 0.95,
          partyB: 0.95,
          effectiveDate: 0.9,
          totalValue: 0.85,
        },
      },
    } as Awaited<ReturnType<typeof generateObject>>);

    const result = await extract({
      input: { document: 'base64data', mimeType: 'image/png' },
      schema: contractSchema,
      model: mockModel,
    });

    expect(result.data.partyA).toBe('Acme Corp');
    expect(result.data.totalValue).toBe(50000);
    expect(result.confidence).toHaveProperty('partyA');
    expect(result.overallConfidence).toBeGreaterThan(0);
    expect(result.warnings).toBeUndefined();
  });

  it('TMPL-02: receiptSchema works end-to-end', async () => {
    vi.mocked(generateObject).mockResolvedValueOnce({
      object: {
        extracted: {
          merchantName: 'Corner Cafe',
          merchantAddress: '42 Oak Street, Portland, OR 97201',
          date: '2024-03-15',
          lineItems: [
            {
              description: 'Latte',
              quantity: 1,
              unitPrice: 5.5,
              amount: 5.5,
            },
          ],
          subtotal: 5.5,
          tax: 0.55,
          total: 6.05,
        },
        confidence: {
          merchantName: 0.99,
          merchantAddress: 0.98,
          date: 0.95,
          lineItems: 0.97,
          subtotal: 0.96,
          tax: 0.95,
          total: 0.97,
        },
      },
    } as Awaited<ReturnType<typeof generateObject>>);

    const result = await extract({
      input: { document: 'base64data', mimeType: 'image/png' },
      schema: receiptSchema,
      model: mockModel,
    });

    expect(result.data.merchantName).toBe('Corner Cafe');
    expect(result.data.total).toBe(6.05);
    expect(result.overallConfidence).toBeGreaterThan(0);
    expect(result.overallConfidence).toBeLessThanOrEqual(1);
  });

  it('TMPL-03: w2Schema works end-to-end', async () => {
    vi.mocked(generateObject).mockResolvedValueOnce({
      object: {
        extracted: {
          employerName: 'Acme Corporation',
          employerAddress: '100 Corporate Blvd, Chicago, IL 60601',
          employerEin: '12-3456789',
          employeeName: 'Jane Smith',
          employeeAddress: '456 Elm Ave, Chicago, IL 60602',
          employeeSsn: 'XXX-XX-1234',
          taxYear: '2023',
          wagesTipsOtherComp: 75000,
          federalIncomeTaxWithheld: 12500,
          stateWages: 75000,
          stateTaxWithheld: 4500,
          stateCode: 'IL',
        },
        confidence: {
          employerName: 0.98,
          employerAddress: 0.97,
          employerEin: 0.96,
          employeeName: 0.98,
          employeeAddress: 0.97,
          employeeSsn: 0.95,
          taxYear: 0.99,
          wagesTipsOtherComp: 0.95,
          federalIncomeTaxWithheld: 0.95,
          stateWages: 0.95,
          stateTaxWithheld: 0.95,
          stateCode: 0.96,
        },
      },
    } as Awaited<ReturnType<typeof generateObject>>);

    const result = await extract({
      input: { document: 'base64data', mimeType: 'image/png' },
      schema: w2Schema,
      model: mockModel,
    });

    expect(result.data.wagesTipsOtherComp).toBe(75000);
    expect(result.data.taxYear).toBe('2023');
    expect(result.overallConfidence).toBeGreaterThan(0);
    expect(result.overallConfidence).toBeLessThanOrEqual(1);
  });
});
