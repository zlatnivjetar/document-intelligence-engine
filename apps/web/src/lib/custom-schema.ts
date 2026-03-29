import { z } from 'zod';

export interface CompiledCustomSchema {
  schema: z.ZodObject<z.ZodRawShape>;
  schemaName: 'CustomSchema';
  schemaDescription: 'User-provided schema pasted in the DocPipe web UI.';
}

export function compileCustomSchema(source: string): CompiledCustomSchema {
  const trimmedSource = source.trim();

  if (trimmedSource === '') {
    throw new Error('Paste a custom Zod schema before extracting.');
  }

  let schemaValue: unknown;

  try {
    const schemaFactory = new Function('z', `return (${trimmedSource});`);
    schemaValue = schemaFactory(z);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    throw new Error(`Custom schema could not be parsed: ${message}`);
  }

  if (!(schemaValue instanceof z.ZodObject)) {
    throw new Error('Custom schemas must be a top-level z.object({...}) value.');
  }

  return {
    schema: schemaValue,
    schemaName: 'CustomSchema',
    schemaDescription: 'User-provided schema pasted in the DocPipe web UI.',
  };
}
