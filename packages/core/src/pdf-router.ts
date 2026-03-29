import { extractText } from 'unpdf';

export type PdfType = 'text-layer' | 'image-only';
export interface PdfRoutingAnalysis {
  pdfType: PdfType;
  extractedText?: string;
}

const TEXT_LAYER_THRESHOLD = 50;

export async function analyzePdfRouting(
  pdfBuffer: Buffer,
): Promise<PdfRoutingAnalysis> {
  try {
    const { text } = await extractText(new Uint8Array(pdfBuffer), {
      mergePages: true,
    });
    const normalizedText = text.trim();
    const nonWhitespaceCount = normalizedText.replace(/\s/g, '').length;

    if (nonWhitespaceCount >= TEXT_LAYER_THRESHOLD) {
      return {
        pdfType: 'text-layer',
        extractedText: normalizedText,
      };
    }
  } catch {
    // Treat unreadable or low-text PDFs as image-only so extract() can keep the file path.
  }

  return { pdfType: 'image-only' };
}

export async function detectPdfType(pdfBuffer: Buffer): Promise<PdfType> {
  const analysis = await analyzePdfRouting(pdfBuffer);

  return analysis.pdfType;
}
