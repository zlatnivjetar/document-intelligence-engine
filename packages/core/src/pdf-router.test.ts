import { beforeEach, describe, expect, it, vi } from 'vitest';
import { analyzePdfRouting, detectPdfType } from './pdf-router.js';

vi.mock('unpdf', () => ({
  extractText: vi.fn(),
}));

import { extractText } from 'unpdf';

const mockExtractText = vi.mocked(extractText);

describe('detectPdfType', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns text-layer when extracted text has 200+ non-whitespace chars', async () => {
    mockExtractText.mockResolvedValueOnce({
      totalPages: 1,
      text: 'a'.repeat(200),
    });

    await expect(detectPdfType(Buffer.from('fake-pdf'))).resolves.toBe(
      'text-layer',
    );
  });

  it('returns image-only when extracted text is empty', async () => {
    mockExtractText.mockResolvedValueOnce({
      totalPages: 1,
      text: '',
    });

    await expect(detectPdfType(Buffer.from('fake-pdf'))).resolves.toBe(
      'image-only',
    );
  });

  it('returns image-only when extracted text is only whitespace', async () => {
    mockExtractText.mockResolvedValueOnce({
      totalPages: 1,
      text: '   \n\t  ',
    });

    await expect(detectPdfType(Buffer.from('fake-pdf'))).resolves.toBe(
      'image-only',
    );
  });

  it('returns image-only when non-whitespace count is 49', async () => {
    mockExtractText.mockResolvedValueOnce({
      totalPages: 1,
      text: `${'a'.repeat(49)}   `,
    });

    await expect(detectPdfType(Buffer.from('fake-pdf'))).resolves.toBe(
      'image-only',
    );
  });

  it('returns text-layer when non-whitespace count is 50', async () => {
    mockExtractText.mockResolvedValueOnce({
      totalPages: 1,
      text: 'a'.repeat(50),
    });

    await expect(detectPdfType(Buffer.from('fake-pdf'))).resolves.toBe(
      'text-layer',
    );
  });

  it('accepts a Buffer input without throwing when text extraction succeeds', async () => {
    mockExtractText.mockResolvedValueOnce({
      totalPages: 1,
      text: 'plain text layer content',
    });

    await expect(detectPdfType(Buffer.from('fake-pdf'))).resolves.toBe(
      'image-only',
    );
  });

  it('returns image-only when extractText throws', async () => {
    mockExtractText.mockRejectedValueOnce(new Error('PDF parsing failed'));

    await expect(detectPdfType(Buffer.from('fake-pdf'))).resolves.toBe(
      'image-only',
    );
  });
});

describe('analyzePdfRouting', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns image-only when normalized extractedText stays below the threshold', async () => {
    mockExtractText.mockResolvedValueOnce({
      totalPages: 1,
      text: '  Routing Sample Invoice  ',
    });

    await expect(analyzePdfRouting(Buffer.from('fake-pdf'))).resolves.toEqual({
      pdfType: 'image-only',
    });
  });

  it('includes extractedText when extracted text meets the threshold', async () => {
    mockExtractText.mockResolvedValueOnce({
      totalPages: 1,
      text: `  ${'a'.repeat(50)}  `,
    });

    await expect(analyzePdfRouting(Buffer.from('fake-pdf'))).resolves.toEqual({
      pdfType: 'text-layer',
      extractedText: 'a'.repeat(50),
    });
  });
});
