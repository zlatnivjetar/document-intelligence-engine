import { invoiceSchema, receiptSchema, w2Schema } from '@docpipe/core';

export type BuiltInTemplateId = 'invoice' | 'receipt' | 'w2';

type BuiltInSchema =
  | typeof invoiceSchema
  | typeof receiptSchema
  | typeof w2Schema;

export interface BuiltInTemplateDefinition {
  schema: BuiltInSchema;
  schemaName: string;
  schemaDescription: string;
}

export const BUILT_IN_TEMPLATES: Record<
  BuiltInTemplateId,
  BuiltInTemplateDefinition
> = {
  invoice: {
    schema: invoiceSchema,
    schemaName: 'InvoiceData',
    schemaDescription:
      'Invoice document with vendor, dates, totals, tax, and line items.',
  },
  receipt: {
    schema: receiptSchema,
    schemaName: 'ReceiptData',
    schemaDescription:
      'Receipt document with merchant, transaction date, totals, tax, and line items.',
  },
  w2: {
    schema: w2Schema,
    schemaName: 'W2Data',
    schemaDescription:
      'US W-2 tax statement with employer, employee, wages, and withholding fields.',
  },
};
