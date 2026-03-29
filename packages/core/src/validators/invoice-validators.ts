import type { InvoiceData } from '../templates/invoice.js';
import type { ExtractionWarning } from '../types.js';

const CURRENCY_TOLERANCE = 0.01;

export function validateInvoice(data: InvoiceData): ExtractionWarning[] {
  const warnings: ExtractionWarning[] = [];

  if (data.total <= 0) {
    warnings.push({
      code: 'ZERO_TOTAL',
      message: `Invoice total is ${data.total} - expected a positive amount. This may indicate an extraction error.`,
      field: 'total',
    });
  }

  const parsedDate = new Date(data.invoiceDate);
  if (!Number.isNaN(parsedDate.getTime()) && parsedDate > new Date()) {
    warnings.push({
      code: 'FUTURE_DATE',
      message: `Invoice date "${data.invoiceDate}" is in the future. This may indicate an extraction error.`,
      field: 'invoiceDate',
    });
  }

  if (data.subtotal !== null && data.lineItems.length > 0) {
    const lineItemSum = data.lineItems.reduce((sum, item) => sum + item.amount, 0);

    if (Math.abs(lineItemSum - data.subtotal) > CURRENCY_TOLERANCE) {
      warnings.push({
        code: 'LINE_ITEMS_SUBTOTAL_MISMATCH',
        message: `Line items sum to ${lineItemSum.toFixed(2)} but subtotal is ${data.subtotal.toFixed(2)}.`,
        field: 'subtotal',
      });
    }
  }

  return warnings;
}
