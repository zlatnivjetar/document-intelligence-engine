import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { loadDocumentInput } from './document-input.js';

const tempDirs: string[] = [];

async function createTempFile(
  fileName: string,
  bytes: number[],
): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'docpipe-cli-'));
  const filePath = join(directory, fileName);

  tempDirs.push(directory);
  await writeFile(filePath, Buffer.from(bytes));

  return filePath;
}

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  );
});

describe('loadDocumentInput', () => {
  it('loads a PDF when the signature matches the extension', async () => {
    const filePath = await createTempFile('invoice.pdf', [
      0x25,
      0x50,
      0x44,
      0x46,
      0x2d,
      0x31,
      0x2e,
      0x37,
    ]);

    await expect(loadDocumentInput(filePath)).resolves.toMatchObject({
      mimeType: 'application/pdf',
      document: expect.any(Buffer),
    });
  });

  it('loads a PNG when the signature matches the extension', async () => {
    const filePath = await createTempFile('receipt.png', [
      0x89,
      0x50,
      0x4e,
      0x47,
      0x0d,
      0x0a,
      0x1a,
      0x0a,
      0x00,
    ]);

    await expect(loadDocumentInput(filePath)).resolves.toMatchObject({
      mimeType: 'image/png',
      document: expect.any(Buffer),
    });
  });

  it('loads a JPEG when the signature matches the extension', async () => {
    const filePath = await createTempFile('receipt.jpg', [
      0xff,
      0xd8,
      0xff,
      0xe0,
      0x00,
      0x10,
    ]);

    await expect(loadDocumentInput(filePath)).resolves.toMatchObject({
      mimeType: 'image/jpeg',
      document: expect.any(Buffer),
    });
  });

  it('rejects files whose signature does not match the extension', async () => {
    const filePath = await createTempFile('invoice.pdf', [
      0xff,
      0xd8,
      0xff,
      0xe0,
    ]);

    await expect(loadDocumentInput(filePath)).rejects.toThrow(
      `File signature does not match extension for ${filePath}`,
    );
  });

  it('rejects unsupported extensions', async () => {
    const filePath = await createTempFile('invoice.gif', [0x47, 0x49, 0x46]);

    await expect(loadDocumentInput(filePath)).rejects.toThrow(
      'Unsupported file extension: .gif. Supported extensions: .pdf, .png, .jpg, .jpeg',
    );
  });
});
