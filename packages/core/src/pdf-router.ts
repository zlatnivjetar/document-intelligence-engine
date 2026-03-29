import { extractText } from 'unpdf';

export type PdfType = 'text-layer' | 'image-only';

const TEXT_LAYER_THRESHOLD = 50;

export async function detectPdfType(pdfBuffer: Buffer): Promise<PdfType> {
  try {
    const { text } = await extractText(new Uint8Array(pdfBuffer), {
      mergePages: true,
    });
    const nonWhitespaceCount = text.replace(/\s/g, '').length;

    return nonWhitespaceCount >= TEXT_LAYER_THRESHOLD
      ? 'text-layer'
      : 'image-only';
  } catch {
    return 'image-only';
  }
}
