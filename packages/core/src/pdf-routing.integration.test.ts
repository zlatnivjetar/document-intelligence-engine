import { readFile } from 'node:fs/promises';
import type { LanguageModelV3 } from '@ai-sdk/provider';
import { generateObject } from 'ai';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { extract } from './extract.js';
import { analyzePdfRouting } from './pdf-router.js';

vi.mock('ai', () => ({
  generateObject: vi.fn(),
}));

const mockModel = {} as LanguageModelV3;
const routingSchema = z.object({
  vendor: z.string(),
  total: z.number(),
});
type RequestContentPart =
  | { type: 'text'; text: string }
  | { type: 'file'; data: string; mediaType: string };

async function readFixture(relativePath: string): Promise<Buffer> {
  return readFile(new URL(relativePath, import.meta.url));
}

function getUserContent(): RequestContentPart[] {
  const request = vi.mocked(generateObject).mock.calls[0]?.[0];
  expect(request).toBeDefined();

  const content = request?.messages?.[0]?.content;
  expect(Array.isArray(content)).toBe(true);

  if (!Array.isArray(content)) {
    throw new Error('Expected the first user message content to be an array');
  }

  return content as RequestContentPart[];
}

describe('fixture-backed PDF routing', () => {
  beforeEach(() => {
    vi.mocked(generateObject).mockReset();
  });

  it('text-layer routing fixture: extract() uses extracted PDF text and contains no file part', async () => {
    const fixtureBytes = await readFixture('../test/fixtures/pdf/text-layer-routing.pdf');
    const analysis = await analyzePdfRouting(fixtureBytes);

    expect(analysis.pdfType).toBe('text-layer');
    expect(analysis.extractedText).toContain('Routing Sample Invoice');

    vi.mocked(generateObject).mockResolvedValueOnce({
      object: {
        extracted: { vendor: 'Vendor Example Co', total: 42 },
        confidence: { vendor: 0.96, total: 0.95 },
      },
    } as Awaited<ReturnType<typeof generateObject>>);

    const result = await extract({
      input: { document: fixtureBytes, mimeType: 'application/pdf' },
      schema: routingSchema,
      model: mockModel,
    });

    const content = getUserContent();

    expect(result.pdfType).toBe('text-layer');
    // text-layer request contains no file part
    expect(content.some((part) => part.type === 'file')).toBe(false);
    expect(
      content.some(
        (part) =>
          part.type === 'text' && part.text.includes('Routing Sample Invoice'),
      ),
    ).toBe(true);
  });

  it('image-only routing fixture: extract() keeps the PDF file part path', async () => {
    const fixtureBytes = await readFixture('../test/fixtures/pdf/image-only-routing.pdf');
    const analysis = await analyzePdfRouting(fixtureBytes);

    expect(analysis).toEqual({ pdfType: 'image-only' });

    vi.mocked(generateObject).mockResolvedValueOnce({
      object: {
        extracted: { vendor: 'Vendor Example Co', total: 42 },
        confidence: { vendor: 0.96, total: 0.95 },
      },
    } as Awaited<ReturnType<typeof generateObject>>);

    const result = await extract({
      input: { document: fixtureBytes, mimeType: 'application/pdf' },
      schema: routingSchema,
      model: mockModel,
    });

    const content = getUserContent();
    const filePart = content.find((part) => part.type === 'file');

    expect(result.pdfType).toBe('image-only');
    // image-only request contains a file part with mediaType application/pdf
    expect(filePart).toMatchObject({
      type: 'file',
      mediaType: 'application/pdf',
    });
  });
});
