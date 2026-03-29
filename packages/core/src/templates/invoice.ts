import { z } from 'zod';

type InvoiceLineItemShape = {
  description: z.ZodString;
  quantity: z.ZodNumber;
  unitPrice: z.ZodNumber;
  amount: z.ZodNumber;
};

type InvoiceSchemaShape = {
  vendorName: z.ZodString;
  vendorAddress: z.ZodNullable<z.ZodString>;
  invoiceNumber: z.ZodString;
  invoiceDate: z.ZodString;
  dueDate: z.ZodNullable<z.ZodString>;
  lineItems: z.ZodArray<z.ZodObject<InvoiceLineItemShape>>;
  subtotal: z.ZodNumber;
  taxAmount: z.ZodNullable<z.ZodNumber>;
  taxRate: z.ZodNullable<z.ZodNumber>;
  total: z.ZodNumber;
};

const lineItemSchema: z.ZodObject<InvoiceLineItemShape> = z.object({
  description: z.string().describe('Product or service description'),
  quantity: z.number().describe('Number of units'),
  unitPrice: z.number().describe('Price per unit in document currency'),
  amount: z.number().describe('quantity multiplied by unitPrice for this line'),
});

const invoiceSchemaShape: InvoiceSchemaShape = {
  vendorName: z
    .string()
    .describe('Company or individual name issuing the invoice'),
  vendorAddress: z
    .string()
    .nullable()
    .describe('Full vendor address or null if not present'),
  invoiceNumber: z.string().describe('Invoice identifier or reference number'),
  invoiceDate: z
    .string()
    .describe('Invoice issue date exactly as printed on the document'),
  dueDate: z
    .string()
    .nullable()
    .describe('Payment due date as printed, or null if not present'),
  lineItems: z
    .array(lineItemSchema)
    .describe('All billable line items on the invoice'),
  subtotal: z.number().describe('Sum of all line items before tax'),
  taxAmount: z
    .number()
    .nullable()
    .describe('Tax amount in document currency, or null if not shown'),
  taxRate: z
    .number()
    .nullable()
    .describe('Tax rate as a decimal, or null if not shown'),
  total: z.number().describe('Final total amount due'),
};

export const invoiceSchema: z.ZodObject<InvoiceSchemaShape> =
  z.object(invoiceSchemaShape);

export type InvoiceData = z.infer<typeof invoiceSchema>;
