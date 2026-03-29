import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ResultConfidenceTable } from '@/components/docpipe/result-confidence-table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { ResultErrorState } from '@/lib/extraction-error-state';
import type { ExtractionResult } from '@/lib/docpipe';
import {
  copyResultJson,
  downloadResultCsv,
  downloadResultJson,
} from '@/lib/result-export';

interface ResultsPreviewProps {
  result: ExtractionResult<Record<string, unknown>> | null;
  resultError: ResultErrorState | null;
  sourceFileName: string | null;
}

type CopyState = 'idle' | 'copied' | 'error';

function formatOverallConfidence(overallConfidence: number): string {
  return `${Math.round(overallConfidence * 100)}%`;
}

function getCopyButtonLabel(copyState: CopyState): string {
  if (copyState === 'copied') {
    return 'Copied JSON';
  }

  if (copyState === 'error') {
    return 'Copy failed';
  }

  return 'Copy JSON';
}

export function ResultsPreview({
  result,
  resultError,
  sourceFileName,
}: ResultsPreviewProps): React.JSX.Element {
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const copyResetTimeoutRef = useRef<number | null>(null);
  const fileStem = sourceFileName?.replace(/\.[^.]+$/, '') ?? 'docpipe-result';

  useEffect(() => {
    return () => {
      if (copyResetTimeoutRef.current !== null) {
        window.clearTimeout(copyResetTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (copyResetTimeoutRef.current !== null) {
      window.clearTimeout(copyResetTimeoutRef.current);
      copyResetTimeoutRef.current = null;
    }

    setCopyState('idle');
  }, [result, resultError, sourceFileName]);

  function setTransientCopyState(nextState: CopyState): void {
    if (copyResetTimeoutRef.current !== null) {
      window.clearTimeout(copyResetTimeoutRef.current);
    }

    setCopyState(nextState);
    copyResetTimeoutRef.current = window.setTimeout(() => {
      setCopyState('idle');
      copyResetTimeoutRef.current = null;
    }, 2000);
  }

  async function handleCopyJson(): Promise<void> {
    if (result === null) {
      return;
    }

    try {
      await copyResultJson(result.data);
      setTransientCopyState('copied');
    } catch {
      setTransientCopyState('error');
    }
  }

  if (resultError) {
    return (
      <Card className="sticky top-8 bg-[rgba(251,248,242,0.94)]">
        <CardHeader>
          <CardTitle className="text-[2rem]">{resultError.title}</CardTitle>
          <CardDescription>{resultError.message}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {resultError.details && resultError.details.length > 0 ? (
            <div className="rounded-[var(--radius-md)] border border-[rgba(180,35,24,0.18)] bg-[rgba(255,244,241,0.78)] px-5 py-5 text-sm leading-7 text-[var(--color-danger)]">
              <h3 className="font-display text-base text-[var(--color-ink)]">
                Validation details
              </h3>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                {resultError.details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="rounded-[var(--radius-md)] border border-[rgba(180,35,24,0.18)] bg-[rgba(255,244,241,0.78)] px-5 py-5 text-sm leading-7 text-[var(--color-danger)]">
              Retry with the same file after addressing the issue above.
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (result === null) {
    return (
      <Card className="sticky top-8 bg-[rgba(251,248,242,0.94)]">
        <CardHeader>
          <CardTitle className="text-[2rem]">Result preview</CardTitle>
          <CardDescription>
            Structured output stays in-page with field-level confidence and
            actionable failure states.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-[var(--radius-md)] border border-dashed border-[rgba(31,26,23,0.12)] bg-[rgba(244,239,230,0.72)] px-5 py-6 text-sm leading-7 text-[var(--color-muted)]">
            Run extraction to see top-level fields, confidence bands, and
            provider feedback here.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="sticky top-8 bg-[rgba(251,248,242,0.94)]">
      <CardHeader>
        <CardTitle className="text-[2rem]">Result preview</CardTitle>
        <CardDescription>
          Structured output stays in-page with field-level confidence and
          browser-only export actions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-[rgba(217,204,184,0.36)] px-4 py-3 text-sm text-[var(--color-muted)]">
          <span>Overall confidence</span>
          <span className="font-semibold text-[var(--color-ink)]">
            {formatOverallConfidence(result.overallConfidence)}
          </span>
        </div>

        {result.pdfType ? (
          <div className="flex items-center gap-3 text-sm text-[var(--color-muted)]">
            <span>PDF routing</span>
            <span className="inline-flex rounded-full bg-[rgba(217,204,184,0.36)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-ink)]">
              {result.pdfType}
            </span>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button
            disabled={result === null}
            onClick={() => {
              downloadResultJson(fileStem, result.data);
            }}
            size="sm"
            type="button"
            variant="outline"
          >
            Download JSON
          </Button>
          <Button
            disabled={result === null}
            onClick={() => {
              downloadResultCsv(fileStem, result);
            }}
            size="sm"
            type="button"
            variant="outline"
          >
            Download CSV
          </Button>
          <Button
            disabled={result === null}
            onClick={() => {
              void handleCopyJson();
            }}
            size="sm"
            type="button"
            variant="secondary"
          >
            {getCopyButtonLabel(copyState)}
          </Button>
        </div>

        <ResultConfidenceTable
          confidence={result.confidence}
          data={result.data}
        />
      </CardContent>
    </Card>
  );
}
