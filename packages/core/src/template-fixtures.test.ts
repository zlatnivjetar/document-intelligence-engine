import { readFile } from 'node:fs/promises';
import type { LanguageModelV3 } from '@ai-sdk/provider';
import { generateObject } from 'ai';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { extract } from './extract.js';
import type { ReceiptData } from './templates/receipt.js';
import { receiptSchema } from './templates/receipt.js';
import type { W2Data } from './templates/w2.js';
import { w2Schema } from './templates/w2.js';

vi.mock('ai', () => ({
  generateObject: vi.fn(),
}));

interface KnownAnswerFixture<T> {
  data: T;
  confidence: Record<string, number>;
}

const mockModel = {} as LanguageModelV3;

function meanConfidence(confidence: Record<string, number>): number {
  const values = Object.values(confidence);

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

async function loadFixtureBytes(relativePath: string): Promise<Buffer> {
  return readFile(new URL(relativePath, import.meta.url));
}

async function loadExpectedFixture<T>(
  relativePath: string,
): Promise<KnownAnswerFixture<T>> {
  const file = await readFile(new URL(relativePath, import.meta.url), 'utf8');

  return JSON.parse(file) as KnownAnswerFixture<T>;
}

function mockExtractionResult<T>(fixture: KnownAnswerFixture<T>): void {
  vi.mocked(generateObject).mockResolvedValueOnce({
    object: {
      extracted: fixture.data,
      confidence: fixture.confidence,
    },
  } as Awaited<ReturnType<typeof generateObject>>);
}

describe('template fixture known-answer PDFs', () => {
  beforeEach(() => {
    vi.mocked(generateObject).mockReset();
  });

  it('TMPL-02 fixture: receipt known-answer PDF returns exact values and confidence labels', async () => {
    const [fixtureBytes, expected] = await Promise.all([
      loadFixtureBytes('../test/fixtures/receipt/known-answer.pdf'),
      loadExpectedFixture<ReceiptData>('../test/fixtures/receipt/expected.json'),
    ]);

    mockExtractionResult(expected);

    const result = await extract({
      input: {
        document: fixtureBytes,
        mimeType: 'application/pdf',
      },
      schema: receiptSchema,
      model: mockModel,
    });

    expect(result.data).toEqual(expected.data);
    expect(result.confidence).toEqual(expected.confidence);
    expect(result.overallConfidence).toBeCloseTo(
      meanConfidence(expected.confidence),
    );
    expect(result.pdfType).toBe('text-layer');
    expect(result.warnings).toBeUndefined();
  });

  it('TMPL-03 fixture: W-2 known-answer PDF returns exact values and confidence labels', async () => {
    const [fixtureBytes, expected] = await Promise.all([
      loadFixtureBytes('../test/fixtures/w2/known-answer.pdf'),
      loadExpectedFixture<W2Data>('../test/fixtures/w2/expected.json'),
    ]);

    mockExtractionResult(expected);

    const result = await extract({
      input: {
        document: fixtureBytes,
        mimeType: 'application/pdf',
      },
      schema: w2Schema,
      model: mockModel,
    });

    expect(result.data).toEqual(expected.data);
    expect(result.confidence).toEqual(expected.confidence);
    expect(result.overallConfidence).toBeCloseTo(
      meanConfidence(expected.confidence),
    );
    expect(result.pdfType).toBe('text-layer');
    expect(result.warnings).toBeUndefined();
  });
});
