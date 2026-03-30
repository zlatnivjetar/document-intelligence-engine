import type { ExtractionResult } from '@docpipe/core';

export type OutputFormat = 'json' | 'csv';

function escapeCsvCell(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

function toCsvValue(value: unknown): string {
  if (value === null) {
    return '';
  }

  if (Array.isArray(value) || typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

export function formatExtractionOutput<T extends Record<string, unknown>>(
  result: ExtractionResult<T>,
  format: OutputFormat,
): string {
  if (format === 'json') {
    return JSON.stringify(result.data, null, 2) + '\n';
  }

  const rows = Object.entries(result.data).map(([field, value]) => {
    const confidence = result.confidence[field];

    return [
      escapeCsvCell(field),
      escapeCsvCell(toCsvValue(value)),
      escapeCsvCell(typeof confidence === 'number' ? String(confidence) : ''),
    ].join(',');
  });

  return ['field,value,confidence', ...rows].join('\n') + '\n';
}
