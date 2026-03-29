import { describe, expect, it } from 'vitest';
import { receiptSchema } from './receipt.js';
import type { ReceiptData } from './receipt.js';

const validReceipt: ReceiptData = {
  merchantName: 'Corner Cafe',
  merchantAddress: '42 Oak Street, Portland, OR 97201',
  date: '2024-03-15',
  lineItems: [
    {
      description: 'Latte',
      quantity: 1,
      unitPrice: 5.5,
      amount: 5.5,
    },
    {
      description: 'Muffin',
      quantity: null,
      unitPrice: null,
      amount: 3,
    },
  ],
  subtotal: 8.5,
  tax: 0.85,
  total: 9.35,
};

describe('receiptSchema', () => {
  it('accepts a complete valid receipt object', () => {
    expect(receiptSchema.safeParse(validReceipt).success).toBe(true);
  });

  it('fails when total is missing', () => {
    const { total: _total, ...missingTotal } = validReceipt;

    expect(receiptSchema.safeParse(missingTotal).success).toBe(false);
  });

  it('fails when total is a string instead of a number', () => {
    expect(
      receiptSchema.safeParse({
        ...validReceipt,
        total: '9.35',
      }).success,
    ).toBe(false);
  });

  it('accepts nullable optional receipt fields', () => {
    expect(
      receiptSchema.safeParse({
        ...validReceipt,
        merchantAddress: null,
        subtotal: null,
        tax: null,
      }).success,
    ).toBe(true);
  });

  it('accepts a valid line item array shape', () => {
    expect(
      receiptSchema.shape.lineItems.safeParse([
        {
          description: 'Coffee',
          quantity: null,
          unitPrice: null,
          amount: 4,
        },
      ]).success,
    ).toBe(true);
  });

  it('contains all required top-level receipt fields', () => {
    expect(Object.keys(receiptSchema.shape)).toEqual([
      'merchantName',
      'merchantAddress',
      'date',
      'lineItems',
      'subtotal',
      'tax',
      'total',
    ]);
  });
});
