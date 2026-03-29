import type { ExtractionErrorCode } from '@/lib/docpipe';

export type ResultErrorState = {
  code: ExtractionErrorCode | 'CLIENT';
  title: string;
  message: string;
  details?: string[];
};

type ExtractionErrorLike = {
  code?: unknown;
  message?: unknown;
  validationErrors?: unknown;
};

function getErrorMessage(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as ExtractionErrorLike).message;

    if (typeof message === 'string' && message.length > 0) {
      return message;
    }
  }

  if (typeof error === 'string' && error.length > 0) {
    return error;
  }

  return undefined;
}

function getValidationDetails(error: unknown): string[] | undefined {
  if (typeof error === 'object' && error !== null && 'validationErrors' in error) {
    const validationErrors = (error as ExtractionErrorLike).validationErrors;

    if (!Array.isArray(validationErrors)) {
      return undefined;
    }

    const details = validationErrors.filter(
      (value): value is string => typeof value === 'string' && value.length > 0,
    );

    if (details.length > 0) {
      return details;
    }
  }

  return undefined;
}

export function toExtractionErrorState(error: unknown): ResultErrorState {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? (error as ExtractionErrorLike).code
      : undefined;

  switch (code) {
    case 'INVALID_API_KEY':
      return {
        code,
        title: 'API key rejected',
        message:
          'Your Anthropic API key was rejected by Anthropic. Check the key and retry.',
      };
    case 'UNSUPPORTED_FILE_TYPE':
      return {
        code,
        title: 'Unsupported file format',
        message: 'Use a PDF, PNG, or JPG document and try again.',
      };
    case 'EXTRACTION_FAILED':
      return {
        code,
        title: 'Extraction failed',
        message:
          'The document could not be extracted into a valid result. Retry the same file or choose a clearer scan.',
      };
    case 'VALIDATION_FAILED':
      return {
        code,
        title: 'Schema validation failed',
        message:
          'The model could not satisfy the schema after the retry limit. Simplify the schema or adjust the document.',
        details: getValidationDetails(error),
      };
    case 'RATE_LIMITED':
      return {
        code,
        title: 'Rate limited',
        message: 'Anthropic rate-limited this request. Wait a moment, then retry.',
      };
    default:
      return {
        code: 'CLIENT',
        title: 'Client-side error',
        message:
          getErrorMessage(error) ??
          'Something went wrong in the browser before extraction completed.',
      };
  }
}
