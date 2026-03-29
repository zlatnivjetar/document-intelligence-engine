import type { LanguageModelV3 } from '@ai-sdk/provider';
import { generateObject } from 'ai';
import type { UserModelMessage } from 'ai';
import { z } from 'zod';
import type {
  ExtractionError,
  ExtractionInput,
  ExtractionResult,
} from './types.js';

const SYSTEM_PROMPT = `You are a precise document extraction assistant. Extract structured data from the provided document exactly as it appears and do not hallucinate missing values.

Return a JSON object with two keys:
- "extracted": the structured data matching the provided schema
- "confidence": an object with the same keys as "extracted", where each value is a number between 0.0 and 1.0 representing how confident you are in that field's value`;
const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
] as const;
const MAX_RETRIES = 2;

export interface ExtractOptions<T> {
  input: ExtractionInput;
  schema: z.ZodSchema<T>;
  model: LanguageModelV3;
  schemaName?: string;
  schemaDescription?: string;
}

function getTopLevelKeys<T>(schema: z.ZodSchema<T>): string[] {
  if (schema instanceof z.ZodObject) {
    return Object.keys(schema.shape);
  }

  return [];
}

function createConfidenceSchema(topLevelKeys: string[]) {
  if (topLevelKeys.length === 0) {
    return z.record(z.string(), z.number().min(0).max(1));
  }

  const confidenceShape = Object.fromEntries(
    topLevelKeys.map((key) => [key, z.number().min(0).max(1)]),
  ) as z.ZodRawShape;

  return z.object(confidenceShape);
}

function normalizeConfidence<T>(
  extracted: T,
  confidence: Record<string, number>,
  topLevelKeys: string[],
): Record<string, number> {
  if (topLevelKeys.length > 0) {
    return confidence;
  }

  if (typeof extracted !== 'object' || extracted === null || Array.isArray(extracted)) {
    return confidence;
  }

  return Object.fromEntries(
    Object.keys(extracted).map((key) => [key, confidence[key] ?? 0]),
  );
}

function isExtractionError(error: unknown): error is ExtractionError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as ExtractionError).code === 'string'
  );
}

function getStatusCode(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null) {
    return undefined;
  }

  const directStatus = (error as { status?: number; statusCode?: number }).status;
  if (typeof directStatus === 'number') {
    return directStatus;
  }

  const directStatusCode = (error as { statusCode?: number }).statusCode;
  if (typeof directStatusCode === 'number') {
    return directStatusCode;
  }

  const cause = (error as { cause?: unknown }).cause;
  if (typeof cause !== 'object' || cause === null) {
    return undefined;
  }

  const causeStatus = (cause as { status?: number; statusCode?: number }).status;
  if (typeof causeStatus === 'number') {
    return causeStatus;
  }

  const causeStatusCode = (cause as { statusCode?: number }).statusCode;
  return typeof causeStatusCode === 'number' ? causeStatusCode : undefined;
}

function getValidationErrors(error: unknown): string[] {
  if (!(error instanceof Error)) {
    return [String(error)];
  }

  return error.message
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function isValidationError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === 'NoObjectGeneratedError' ||
      error.message.toLowerCase().includes('validation'))
  );
}

async function extractCore<T>(
  options: ExtractOptions<T>,
  previousErrors: string[] = [],
): Promise<ExtractionResult<T>> {
  const { input, model, schema, schemaName, schemaDescription } = options;
  const base64Document = Buffer.isBuffer(input.document)
    ? input.document.toString('base64')
    : input.document;
  const topLevelKeys = getTopLevelKeys(schema);
  const responseSchema = z.object({
    extracted: schema,
    confidence: createConfidenceSchema(topLevelKeys),
  });

  const userMessage = {
    role: 'user' as const,
    content: [
      {
        type: 'text' as const,
        text: 'Extract structured data from this document.',
      },
      {
        type: 'file' as const,
        data: base64Document,
        mediaType: input.mimeType,
      },
    ],
  };
  const messages: UserModelMessage[] = [userMessage];

  if (previousErrors.length > 0) {
    messages.push({
      role: 'user' as const,
      content: `Previous extraction attempt failed schema validation.\nErrors:\n${previousErrors.join('\n')}\nPlease fix your output to match the required schema exactly.`,
    });
  }

  const result = await generateObject({
    model,
    schema: responseSchema,
    schemaName: schemaName ?? 'ExtractionResponse',
    schemaDescription:
      schemaDescription ?? 'Structured extraction with per-field confidence',
    messages,
    system: SYSTEM_PROMPT,
  });

  const confidence = normalizeConfidence(
    result.object.extracted,
    result.object.confidence as Record<string, number>,
    topLevelKeys,
  );
  const confidenceValues = Object.values(confidence);
  const overallConfidence =
    confidenceValues.length > 0
      ? confidenceValues.reduce((sum, value) => sum + value, 0) /
        confidenceValues.length
      : 0;

  return {
    data: result.object.extracted,
    confidence,
    overallConfidence,
  };
}

export async function extract<T>(
  options: ExtractOptions<T>,
): Promise<ExtractionResult<T>> {
  if (
    !SUPPORTED_MIME_TYPES.includes(
      options.input.mimeType as (typeof SUPPORTED_MIME_TYPES)[number],
    )
  ) {
    throw {
      code: 'UNSUPPORTED_FILE_TYPE',
      message: `Unsupported file type: ${options.input.mimeType}. Supported types: ${SUPPORTED_MIME_TYPES.join(', ')}`,
      retryable: false,
    } satisfies ExtractionError;
  }

  let lastValidationErrors: string[] = [];

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await extractCore(options, lastValidationErrors);
    } catch (error: unknown) {
      if (isExtractionError(error)) {
        throw error;
      }

      const statusCode = getStatusCode(error);
      if (statusCode === 401) {
        throw {
          code: 'INVALID_API_KEY',
          message: 'Invalid API key (401).',
          retryable: false,
        } satisfies ExtractionError;
      }

      if (statusCode === 429) {
        throw {
          code: 'RATE_LIMITED',
          message: 'Rate limited (429). Try again later.',
          retryable: false,
        } satisfies ExtractionError;
      }

      if (isValidationError(error)) {
        lastValidationErrors = getValidationErrors(error);

        if (attempt < MAX_RETRIES) {
          continue;
        }

        throw {
          code: 'VALIDATION_FAILED',
          message:
            'Extraction output failed schema validation after maximum retries.',
          retryable: false,
          validationErrors: lastValidationErrors,
        } satisfies ExtractionError;
      }

      throw {
        code: 'EXTRACTION_FAILED',
        message: `Extraction failed: ${error instanceof Error ? error.message : String(error)}`,
        retryable: true,
      } satisfies ExtractionError;
    }
  }

  throw new Error('extract(): unreachable code after retry loop');
}
