const PDF_MIME_TYPE = 'application/pdf';

class PdfInspectRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PdfInspectRequestError';
  }
}

// MAX_PDF_INSPECT_SIZE_BYTES = 5 * 1024 * 1024
export const MAX_PDF_INSPECT_SIZE_BYTES: number = 5 * 1024 * 1024;

function ensurePdfFile(entry: FormDataEntryValue | null): File {
  if (!(entry instanceof File)) {
    throw new PdfInspectRequestError('A PDF file is required.');
  }

  if (entry.type !== PDF_MIME_TYPE) {
    throw new PdfInspectRequestError('Only PDF uploads are supported.');
  }

  if (entry.size > MAX_PDF_INSPECT_SIZE_BYTES) {
    throw new PdfInspectRequestError('PDF uploads must be 5 MB or smaller.');
  }

  return entry;
}

export async function parsePdfInspectRequest(
  request: Request,
): Promise<{ file: File; buffer: Buffer }> {
  const formData = await request.formData();
  const file = ensurePdfFile(formData.get('file'));
  const arrayBuffer = await file.arrayBuffer();

  return {
    file,
    buffer: Buffer.from(arrayBuffer),
  };
}

export function createPdfInspectResponse(input: {
  filename: string;
  sizeBytes: number;
  pdfType: 'text-layer' | 'image-only';
  elapsedMs: number;
}): Response {
  return Response.json({
    filename: input.filename,
    sizeBytes: input.sizeBytes,
    pdfType: input.pdfType,
    elapsedMs: input.elapsedMs,
  });
}
