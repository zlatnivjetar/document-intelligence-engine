import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { ExtractionResult } from '@/lib/docpipe';
import type { ResultErrorState } from '@/lib/extraction-error-state';

interface ResultsPreviewProps {
  result: ExtractionResult<Record<string, unknown>> | null;
  resultError: ResultErrorState | null;
}

function formatOverallConfidence(
  overallConfidence: number | undefined,
): string {
  if (overallConfidence === null) {
    return 'Pending extraction';
  }

  if (typeof overallConfidence !== 'number') {
    return 'Pending extraction';
  }

  return `${Math.round(overallConfidence * 100)}%`;
}

export function ResultsPreview({
  result,
  resultError,
}: ResultsPreviewProps): React.JSX.Element {
  const resultJson = result ? JSON.stringify(result.data, null, 2) : null;

  return (
    <Card className="sticky top-8 bg-[rgba(251,248,242,0.94)]">
      <CardHeader>
        <CardTitle className="text-[2rem]">Result preview</CardTitle>
        <CardDescription>
          Structured output stays in-page with a plain JSON readout before
          exports are introduced.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-[rgba(217,204,184,0.36)] px-4 py-3 text-sm text-[var(--color-muted)]">
          <span>Overall confidence</span>
          <span className="font-semibold text-[var(--color-ink)]">
            {formatOverallConfidence(result?.overallConfidence)}
          </span>
        </div>

        {resultError ? (
          <div className="rounded-[var(--radius-md)] border border-[rgba(180,35,24,0.18)] bg-[rgba(255,244,241,0.78)] px-5 py-5 text-sm leading-7 text-[var(--color-danger)]">
            <p className="font-semibold text-[var(--color-ink)]">
              {resultError.title}
            </p>
            <p>{resultError.message}</p>
          </div>
        ) : resultJson ? (
          <pre className="overflow-x-auto rounded-[var(--radius-md)] bg-[var(--color-ink)] px-5 py-5 font-mono text-sm leading-7 text-[rgba(251,248,242,0.92)]">
            <code>{resultJson}</code>
          </pre>
        ) : (
          <div className="rounded-[var(--radius-md)] border border-dashed border-[rgba(31,26,23,0.12)] bg-[rgba(244,239,230,0.72)] px-5 py-6 text-sm leading-7 text-[var(--color-muted)]">
            Run extraction to see formatted JSON output and confidence here.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
