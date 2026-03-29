import { detectPdfType } from '@docpipe/core';

import {
  createPdfInspectResponse,
  parsePdfInspectRequest,
} from '@/lib/pdf-inspect';

export const runtime = 'nodejs';

export async function POST(request: Request): Promise<Response> {
  try {
    const { file, buffer } = await parsePdfInspectRequest(request);
    const startTime = performance.now();
    const pdfType = await detectPdfType(buffer);
    const elapsedMs = Math.round(performance.now() - startTime);

    return createPdfInspectResponse({
      filename: file.name,
      sizeBytes: file.size,
      pdfType,
      elapsedMs,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'PdfInspectRequestError') {
      return Response.json({ error: error.message }, { status: 400 });
    }

    console.error('Failed to inspect PDF upload.', error);

    return Response.json({ error: 'Failed to inspect PDF.' }, { status: 500 });
  }
}
