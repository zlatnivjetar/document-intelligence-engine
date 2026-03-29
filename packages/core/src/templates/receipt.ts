import { z } from 'zod';

type ReceiptLineItemShape = {
  description: z.ZodString;
  quantity: z.ZodNullable<z.ZodNumber>;
  unitPrice: z.ZodNullable<z.ZodNumber>;
  amount: z.ZodNumber;
};

type ReceiptSchemaShape = {
  merchantName: z.ZodString;
  merchantAddress: z.ZodNullable<z.ZodString>;
  date: z.ZodString;
  lineItems: z.ZodArray<z.ZodObject<ReceiptLineItemShape>>;
  subtotal: z.ZodNullable<z.ZodNumber>;
  tax: z.ZodNullable<z.ZodNumber>;
  total: z.ZodNumber;
};

const receiptLineItemSchema: z.ZodObject<ReceiptLineItemShape> = z.object({
  description: z.string().describe('Item or service description'),
  quantity: z.number().nullable().describe('Number of units, or null if not shown'),
  unitPrice: z
    .number()
    .nullable()
    .describe('Price per unit, or null if not shown'),
  amount: z.number().describe('Total amount for this line item'),
});

const receiptSchemaShape: ReceiptSchemaShape = {
  merchantName: z
    .string()
    .describe('Name of the store, restaurant, or business'),
  merchantAddress: z
    .string()
    .nullable()
    .describe('Merchant address as printed, or null if not present'),
  date: z
    .string()
    .describe(
      'Transaction date as printed (e.g., "2024-01-15" or "Jan 15, 2024")',
    ),
  lineItems: z
    .array(receiptLineItemSchema)
    .describe('All items or services purchased'),
  subtotal: z
    .number()
    .nullable()
    .describe('Subtotal before tax, or null if not shown separately'),
  tax: z.number().nullable().describe('Tax amount, or null if not shown separately'),
  total: z.number().describe('Final total amount charged'),
};

export const receiptSchema: z.ZodObject<ReceiptSchemaShape> =
  z.object(receiptSchemaShape);

export type ReceiptData = z.infer<typeof receiptSchema>;
