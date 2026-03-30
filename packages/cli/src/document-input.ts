import { access, readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import type { ExtractionInput } from '@docpipe/core';

const PDF_SIGNATURE = '%PDF-';
const PNG_SIGNATURE = '89504e470d0a1a0a';
const JPEG_SIGNATURE = 'ffd8ff';

type SupportedMimeType = ExtractionInput['mimeType'];

function getMimeType(extension: string): SupportedMimeType {
  switch (extension) {
    case '.pdf':
      return 'application/pdf';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    default:
      throw new Error(
        `Unsupported file extension: ${extension}. Supported extensions: .pdf, .png, .jpg, .jpeg`,
      );
  }
}

function hasExpectedSignature(buffer: Buffer, extension: string): boolean {
  switch (extension) {
    case '.pdf':
      return buffer.subarray(0, 5).toString('utf8') === PDF_SIGNATURE;
    case '.png':
      return buffer.subarray(0, 8).toString('hex') === PNG_SIGNATURE;
    case '.jpg':
    case '.jpeg':
      return buffer.subarray(0, 3).toString('hex') === JPEG_SIGNATURE;
    default:
      return false;
  }
}

export async function loadDocumentInput(
  filePath: string,
): Promise<ExtractionInput> {
  try {
    await access(filePath);
  } catch {
    throw new Error(`Input file not found: ${filePath}`);
  }

  const extension = extname(filePath).toLowerCase();
  const mimeType = getMimeType(extension);
  const document = await readFile(filePath);

  if (!hasExpectedSignature(document, extension)) {
    throw new Error(`File signature does not match extension for ${filePath}`);
  }

  return {
    document,
    mimeType,
  };
}
