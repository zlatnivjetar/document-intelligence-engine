import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface ResultsPreviewProps {
  overallConfidence: number | null;
  resultJson: string | null;
}

function formatOverallConfidence(overallConfidence: number | null): string {
  if (overallConfidence === null) {
    return 'Pending extraction';
  }

  return `${Math.round(overallConfidence * 100)}%`;
}

export function ResultsPreview({
  overallConfidence,
  resultJson,
}: ResultsPreviewProps): React.JSX.Element {
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
            {formatOverallConfidence(overallConfidence)}
          </span>
        </div>

        {resultJson ? (
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
