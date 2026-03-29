import { describe, expect, it } from 'vitest';
import type { InvoiceData } from '../templates/invoice.js';
import { validateInvoice } from './invoice-validators.js';

const baseInvoice: InvoiceData = {
  vendorName: 'ACME Corp',
  vendorAddress: null,
  invoiceNumber: 'INV-001',
  invoiceDate: '2020-01-15',
  dueDate: null,
  lineItems: [
    {
      description: 'Widget',
      quantity: 2,
      unitPrice: 50,
      amount: 100,
    },
  ],
  subtotal: 100,
  taxAmount: null,
  taxRate: null,
  total: 100,
};

describe('validateInvoice', () => {
  it('returns ZERO_TOTAL when total is zero', () => {
    expect(validateInvoice({ ...baseInvoice, total: 0 })).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'ZERO_TOTAL',
          field: 'total',
        }),
      ]),
    );
  });

  it('does not return ZERO_TOTAL when total is positive', () => {
    expect(
      validateInvoice({ ...baseInvoice, total: 100 }).some(
        (warning) => warning.code === 'ZERO_TOTAL',
      ),
    ).toBe(false);
  });

  it('returns FUTURE_DATE when invoiceDate is in the future', () => {
    expect(validateInvoice({ ...baseInvoice, invoiceDate: '2099-01-01' })).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'FUTURE_DATE',
          field: 'invoiceDate',
        }),
      ]),
    );
  });

  it('does not return FUTURE_DATE when invoiceDate is in the past', () => {
    expect(
      validateInvoice({ ...baseInvoice, invoiceDate: '2023-06-15' }).some(
        (warning) => warning.code === 'FUTURE_DATE',
      ),
    ).toBe(false);
  });

  it('returns LINE_ITEMS_SUBTOTAL_MISMATCH when line items do not match subtotal', () => {
    expect(
      validateInvoice({
        ...baseInvoice,
        subtotal: 90,
        lineItems: [
          {
            description: 'Widget',
            quantity: 1,
            unitPrice: 100,
            amount: 100,
          },
        ],
      }),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'LINE_ITEMS_SUBTOTAL_MISMATCH',
          field: 'subtotal',
        }),
      ]),
    );
  });

  it('does not return LINE_ITEMS_SUBTOTAL_MISMATCH when subtotal matches within tolerance', () => {
    expect(
      validateInvoice({
        ...baseInvoice,
        subtotal: 100.005,
        lineItems: [
          {
            description: 'Widget',
            quantity: 1,
            unitPrice: 100,
            amount: 100,
          },
        ],
      }).some((warning) => warning.code === 'LINE_ITEMS_SUBTOTAL_MISMATCH'),
    ).toBe(false);
  });

  it('does not return LINE_ITEMS_SUBTOTAL_MISMATCH when subtotal is null', () => {
    expect(
      validateInvoice({
        ...baseInvoice,
        subtotal: null as never,
      }).some((warning) => warning.code === 'LINE_ITEMS_SUBTOTAL_MISMATCH'),
    ).toBe(false);
  });

  it('returns no warnings for a valid invoice', () => {
    expect(validateInvoice(baseInvoice)).toEqual([]);
  });
});
