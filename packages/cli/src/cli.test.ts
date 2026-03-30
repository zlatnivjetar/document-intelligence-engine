import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  invoiceSchema,
  receiptSchema,
  w2Schema,
  mockCreateAnthropicProvider,
  mockExtract,
  mockLoadDocumentInput,
} = vi.hoisted(() => ({
  invoiceSchema: { kind: 'invoice-schema' },
  receiptSchema: { kind: 'receipt-schema' },
  w2Schema: { kind: 'w2-schema' },
  mockCreateAnthropicProvider: vi.fn(),
  mockExtract: vi.fn(),
  mockLoadDocumentInput: vi.fn(),
}));

vi.mock('@docpipe/core', () => ({
  createAnthropicProvider: mockCreateAnthropicProvider,
  extract: mockExtract,
  invoiceSchema,
  receiptSchema,
  w2Schema,
}));

vi.mock('./document-input.js', () => ({
  loadDocumentInput: mockLoadDocumentInput,
}));

import { runCli } from './cli.js';

interface CapturedIo {
  stdout: string[];
  stderr: string[];
  io: {
    stdout: { write: (chunk: string) => void };
    stderr: { write: (chunk: string) => void };
    env: NodeJS.ProcessEnv;
    cwd: string;
  };
}

function createCapturedIo(env: NodeJS.ProcessEnv = {}): CapturedIo {
  const stdout: string[] = [];
  const stderr: string[] = [];

  return {
    stdout,
    stderr,
    io: {
      stdout: {
        write: (chunk: string) => {
          stdout.push(chunk);
        },
      },
      stderr: {
        write: (chunk: string) => {
          stderr.push(chunk);
        },
      },
      env,
      cwd: process.cwd(),
    },
  };
}

describe('runCli', () => {
  beforeEach(() => {
    mockCreateAnthropicProvider.mockReset();
    mockExtract.mockReset();
    mockLoadDocumentInput.mockReset();

    mockCreateAnthropicProvider.mockReturnValue('anthropic-model');
    mockLoadDocumentInput.mockResolvedValue({
      document: Buffer.from('%PDF-1.7'),
      mimeType: 'application/pdf',
    });
  });

  it('maps the invoice template to the core invoice schema metadata', async () => {
    const captured = createCapturedIo({ ANTHROPIC_API_KEY: 'env-key' });

    mockExtract.mockResolvedValue({
      data: { invoiceNumber: 'INV-001' },
      confidence: { invoiceNumber: 0.99 },
      overallConfidence: 0.99,
    });

    const exitCode = await runCli(
      ['extract', 'invoice.pdf', '--template', 'invoice'],
      captured.io,
    );

    expect(exitCode).toBe(0);
    expect(mockExtract).toHaveBeenCalledWith(
      expect.objectContaining({
        schema: invoiceSchema,
        schemaName: 'InvoiceData',
        schemaDescription:
          'Invoice document with vendor, dates, totals, tax, and line items.',
        model: 'anthropic-model',
      }),
    );
  });

  it('writes csv output to stdout only when --format csv is selected', async () => {
    const captured = createCapturedIo({ ANTHROPIC_API_KEY: 'env-key' });

    mockExtract.mockResolvedValue({
      data: { invoiceNumber: 'INV-001' },
      confidence: { invoiceNumber: 0.99 },
      overallConfidence: 0.99,
    });

    const exitCode = await runCli(
      ['extract', 'invoice.pdf', '--template', 'invoice', '--format', 'csv'],
      captured.io,
    );

    expect(exitCode).toBe(0);
    expect(captured.stdout.join('')).toContain('field,value,confidence');
    expect(captured.stderr).toEqual([]);
  });

  it('prefers --key over ANTHROPIC_API_KEY', async () => {
    const captured = createCapturedIo({ ANTHROPIC_API_KEY: 'env-key' });

    mockExtract.mockResolvedValue({
      data: { invoiceNumber: 'INV-001' },
      confidence: { invoiceNumber: 0.99 },
      overallConfidence: 0.99,
    });

    const exitCode = await runCli(
      [
        'extract',
        'invoice.pdf',
        '--template',
        'invoice',
        '--key',
        'flag-key',
      ],
      captured.io,
    );

    expect(exitCode).toBe(0);
    expect(mockCreateAnthropicProvider).toHaveBeenCalledWith({
      apiKey: 'flag-key',
    });
  });

  it('returns exit code 1 with the exact missing-key message', async () => {
    const captured = createCapturedIo();

    const exitCode = await runCli(
      ['extract', 'invoice.pdf', '--template', 'invoice'],
      captured.io,
    );

    expect(exitCode).toBe(1);
    expect(captured.stdout).toEqual([]);
    expect(captured.stderr.join('')).toBe(
      'Provide an Anthropic API key with --key or ANTHROPIC_API_KEY.\n',
    );
  });

  it('renders extraction errors to stderr only', async () => {
    const captured = createCapturedIo({ ANTHROPIC_API_KEY: 'env-key' });

    mockExtract.mockRejectedValue({
      code: 'INVALID_API_KEY',
      message: 'Key rejected',
      retryable: false,
    });

    const invalidApiKeyExitCode = await runCli(
      ['extract', 'invoice.pdf', '--template', 'invoice'],
      captured.io,
    );

    expect(invalidApiKeyExitCode).toBe(1);
    expect(captured.stdout).toEqual([]);
    expect(captured.stderr.join('')).toContain(
      'Extraction failed [INVALID_API_KEY]: Key rejected',
    );

    captured.stderr.length = 0;
    mockExtract.mockRejectedValueOnce({
      code: 'UNSUPPORTED_FILE_TYPE',
      message: 'Unsupported input',
      retryable: false,
    });

    const unsupportedFileExitCode = await runCli(
      ['extract', 'invoice.pdf', '--template', 'invoice'],
      captured.io,
    );

    expect(unsupportedFileExitCode).toBe(1);
    expect(captured.stdout).toEqual([]);
    expect(captured.stderr.join('')).toContain(
      'Extraction failed [UNSUPPORTED_FILE_TYPE]: Unsupported input',
    );
  });

  it('shows help with template, format, and ANTHROPIC_API_KEY guidance', async () => {
    const captured = createCapturedIo();

    const exitCode = await runCli(['extract', '--help'], captured.io);
    const helpText = captured.stdout.join('');

    expect(exitCode).toBe(0);
    expect(helpText).toContain('--template <name>');
    expect(helpText).toContain('--format <format>');
    expect(helpText).toContain('ANTHROPIC_API_KEY');
    expect(captured.stderr).toEqual([]);
  });
});
