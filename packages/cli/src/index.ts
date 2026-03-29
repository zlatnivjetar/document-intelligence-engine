#!/usr/bin/env node
// @docpipe/cli — entry point
// CLI commands are implemented in Phase 6.
import {
  createAnthropicProvider,
  extract,
  invoiceSchema,
  receiptSchema,
  w2Schema,
} from '@docpipe/core';
import type {
  ExtractOptions,
  ExtractionInput,
  ExtractionResult,
  InvoiceData,
  ReceiptData,
  W2Data,
} from '@docpipe/core';

const importedCoreApi = [
  extract,
  createAnthropicProvider,
  invoiceSchema,
  receiptSchema,
  w2Schema,
] as const;
const _typeCheck:
  | ExtractOptions<InvoiceData>
  | ExtractOptions<ReceiptData>
  | ExtractOptions<W2Data>
  | ExtractionInput
  | ExtractionResult<InvoiceData>
  | undefined = undefined;

void importedCoreApi;
void _typeCheck;
