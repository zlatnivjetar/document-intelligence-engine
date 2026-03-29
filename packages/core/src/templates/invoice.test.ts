import { describe, expect, it } from 'vitest';
import { invoiceSchema } from './invoice.js';
import type { InvoiceData } from './invoice.js';

const validInvoice: InvoiceData = {
  vendorName: 'ACME Corp',
  vendorAddress: '123 Main St, Springfield, IL 62701',
  invoiceNumber: 'INV-2024-001',
  invoiceDate: '2024-01-15',
  dueDate: '2024-02-15',
  lineItems: [
    {
      description: 'Widget A',
      quantity: 10,
      unitPrice: 5,
      amount: 50,
    },
    {
      description: 'Widget B',
      quantity: 2,
      unitPrice: 25,
      amount: 50,
    },
  ],
  subtotal: 100,
  taxAmount: 8,
  taxRate: 0.08,
  total: 108,
};

describe('invoiceSchema', () => {
  it('accepts a complete valid invoice object', () => {
    expect(invoiceSchema.safeParse(validInvoice).success).toBe(true);
  });

  it('fails when total is missing', () => {
    const { total: _total, ...missingTotal } = validInvoice;

    expect(invoiceSchema.safeParse(missingTotal).success).toBe(false);
  });

  it('fails when total is a string instead of a number', () => {
    expect(
      invoiceSchema.safeParse({
        ...validInvoice,
        total: '108',
      }).success,
    ).toBe(false);
  });

  it('accepts nullable optional invoice fields', () => {
    expect(
      invoiceSchema.safeParse({
        ...validInvoice,
        vendorAddress: null,
        dueDate: null,
        taxAmount: null,
        taxRate: null,
      }).success,
    ).toBe(true);
  });

  it('accepts a valid line item array shape', () => {
    expect(invoiceSchema.shape.lineItems.safeParse(validInvoice.lineItems).success).toBe(
      true,
    );
  });

  it('contains all required top-level invoice fields', () => {
    expect(Object.keys(invoiceSchema.shape)).toEqual([
      'vendorName',
      'vendorAddress',
      'invoiceNumber',
      'invoiceDate',
      'dueDate',
      'lineItems',
      'subtotal',
      'taxAmount',
      'taxRate',
      'total',
    ]);
  });

  it('infers InvoiceData with a string vendorName', () => {
    const vendorName: string = validInvoice.vendorName;

    expect(vendorName).toBe('ACME Corp');
  });
});
