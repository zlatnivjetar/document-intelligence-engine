import { invoiceSchema, receiptSchema, w2Schema } from '@/lib/docpipe';

export type BuiltInTemplateId = 'invoice' | 'receipt' | 'w2';

export interface BuiltInTemplateDefinition {
  id: BuiltInTemplateId;
  label: string;
  schema:
    | typeof invoiceSchema
    | typeof receiptSchema
    | typeof w2Schema;
  schemaName: string;
  schemaDescription: string;
}

export const BUILT_IN_TEMPLATES: readonly BuiltInTemplateDefinition[] = [
  {
    id: 'invoice',
    label: 'Invoice',
    schema: invoiceSchema,
    schemaName: 'InvoiceData',
    schemaDescription:
      'Invoice document with vendor, dates, totals, tax, and line items.',
  },
  {
    id: 'receipt',
    label: 'Receipt',
    schema: receiptSchema,
    schemaName: 'ReceiptData',
    schemaDescription:
      'Receipt document with merchant, transaction date, totals, tax, and line items.',
  },
  {
    id: 'w2',
    label: 'W-2',
    schema: w2Schema,
    schemaName: 'W2Data',
    schemaDescription:
      'US W-2 tax statement with employer, employee, wages, and withholding fields.',
  },
] as const;
