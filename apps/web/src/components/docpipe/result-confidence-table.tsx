type ConfidenceBand = 'high' | 'medium' | 'low';

interface ResultConfidenceTableProps {
  data: Record<string, unknown>;
  confidence: Record<string, number>;
}

function getConfidenceBand(value: number): ConfidenceBand {
  if (value >= 0.85) {
    return 'high';
  }

  // >= 0.60 && < 0.85
  if (value >= 0.60 && value < 0.85) {
    return 'medium';
  }

  return 'low';
}

function getBandLabel(band: ConfidenceBand): 'High' | 'Medium' | 'Low' {
  switch (band) {
    case 'high':
      return 'High';
    case 'medium':
      return 'Medium';
    default:
      return 'Low';
  }
}

function getBandClassName(band: ConfidenceBand): string {
  switch (band) {
    case 'high':
      return 'text-[var(--color-confidence-high)]';
    case 'medium':
      return 'text-[var(--color-confidence-medium)]';
    default:
      return 'text-[var(--color-confidence-low)]';
  }
}

function renderValue(value: unknown): React.JSX.Element {
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return <span className="text-sm leading-6 text-[var(--color-ink)]">{String(value)}</span>;
  }

  if (value === null) {
    return (
      <span className="text-sm leading-6 text-[var(--color-muted)]">
        &mdash;
      </span>
    );
  }

  if (Array.isArray(value) || typeof value === 'object') {
    return (
      <pre className="overflow-x-auto rounded-[calc(var(--radius-md)-6px)] bg-[rgba(31,26,23,0.05)] px-3 py-3 font-mono text-xs leading-6 text-[var(--color-ink)]">
        <code>{JSON.stringify(value, null, 2)}</code>
      </pre>
    );
  }

  return <span className="text-sm leading-6 text-[var(--color-ink)]">{String(value)}</span>;
}

export function ResultConfidenceTable({
  data,
  confidence,
}: ResultConfidenceTableProps): React.JSX.Element {
  const rows = Object.entries(data);

  return (
    <div className="overflow-hidden rounded-[var(--radius-md)] border border-[rgba(31,26,23,0.1)] bg-[rgba(251,248,242,0.8)]">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="bg-[rgba(217,204,184,0.34)] text-left text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
            <th className="px-4 py-3 font-semibold">Field</th>
            <th className="px-4 py-3 font-semibold">Value</th>
            <th className="px-4 py-3 font-semibold">Confidence</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([field, value]) => {
            const confidenceValue = confidence[field] ?? 0;
            const band = getConfidenceBand(confidenceValue);
            const percent = Math.round(confidenceValue * 100);

            return (
              <tr
                className="border-t border-[rgba(31,26,23,0.08)] align-top"
                key={field}
              >
                <th className="w-[24%] px-4 py-4 text-left text-sm font-semibold text-[var(--color-ink)]">
                  {field}
                </th>
                <td className="w-[52%] px-4 py-4">{renderValue(value)}</td>
                <td className="w-[24%] px-4 py-4">
                  <span
                    className={`inline-flex rounded-full bg-[rgba(251,248,242,0.92)] px-3 py-1 text-xs font-semibold tracking-[0.08em] ${getBandClassName(
                      band,
                    )}`}
                  >
                    {getBandLabel(band)} &middot; {percent}%
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
