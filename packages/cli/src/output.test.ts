import { describe, expect, it } from 'vitest';
import { formatExtractionOutput } from './output.js';

describe('formatExtractionOutput', () => {
  it('formats json with two-space indentation and a trailing newline', () => {
    const output = formatExtractionOutput(
      {
        data: {
          invoiceNumber: 'INV-001',
          total: 42,
        },
        confidence: {
          invoiceNumber: 0.99,
          total: 0.98,
        },
        overallConfidence: 0.985,
      },
      'json',
    );

    expect(output).toBe(
      '{\n  "invoiceNumber": "INV-001",\n  "total": 42\n}\n',
    );
  });

  it('formats csv with the exact header and escaped quoted values', () => {
    const output = formatExtractionOutput(
      {
        data: {
          merchant: 'Bob "Burger" Shop',
          tags: ['lunch', 'team'],
          notes: {
            reviewer: 'qa',
          },
        },
        confidence: {
          merchant: 0.95,
          notes: 0.88,
        },
        overallConfidence: 0.915,
      },
      'csv',
    );

    expect(output).toBe(
      'field,value,confidence\n' +
        '"merchant","Bob ""Burger"" Shop","0.95"\n' +
        '"tags","[""lunch"",""team""]",""\n' +
        '"notes","{""reviewer"":""qa""}","0.88"\n',
    );
  });
});
