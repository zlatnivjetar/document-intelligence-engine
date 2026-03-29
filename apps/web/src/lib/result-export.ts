import type { ExtractionResult } from '@/lib/docpipe';

function escapeCsvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
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

function downloadTextFile(
  fileName: string,
  content: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = fileName;
  anchor.click();

  URL.revokeObjectURL(url);
}

export function downloadResultJson(
  fileStem: string,
  data: Record<string, unknown>,
): void {
  downloadTextFile(
    `${fileStem}-extraction.json`,
    JSON.stringify(data, null, 2),
    'application/json;charset=utf-8',
  );
}

export function downloadResultCsv(
  fileStem: string,
  result: ExtractionResult<Record<string, unknown>>,
): void {
  const header = 'field,value,confidence';
  const rows = Object.entries(result.data).map(([field, value]) => {
    const confidence = result.confidence[field];

    return [
      escapeCsvCell(field),
      escapeCsvCell(toCsvValue(value)),
      escapeCsvCell(typeof confidence === 'number' ? String(confidence) : ''),
    ].join(',');
  });

  downloadTextFile(
    `${fileStem}-extraction.csv`,
    [header, ...rows].join('\n'),
    'text/csv;charset=utf-8',
  );
}

export async function copyResultJson(
  data: Record<string, unknown>,
): Promise<void> {
  await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
}
