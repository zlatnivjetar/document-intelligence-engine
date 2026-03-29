import type { LanguageModelV3 } from '@ai-sdk/provider';
import { generateObject } from 'ai';
import { z } from 'zod';
import type { ExtractionInput, ExtractionResult } from './types.js';

const SYSTEM_PROMPT = `You are a precise document extraction assistant. Extract structured data from the provided document exactly as it appears and do not hallucinate missing values.

Return a JSON object with two keys:
- "extracted": the structured data matching the provided schema
- "confidence": an object with the same keys as "extracted", where each value is a number between 0.0 and 1.0 representing how confident you are in that field's value`;

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

export async function extract<T>(
  options: ExtractOptions<T>,
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

  const result = await generateObject({
    model,
    schema: responseSchema,
    schemaName: schemaName ?? 'ExtractionResponse',
    schemaDescription:
      schemaDescription ?? 'Structured extraction with per-field confidence',
    messages: [userMessage],
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

  // TODO: Phase 02 Plan 02 wraps this in extractWithRetry() with error classification
  return {
    data: result.object.extracted,
    confidence,
    overallConfidence,
  };
}
