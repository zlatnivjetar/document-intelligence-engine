import { access } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { createJiti } from 'jiti';
import { z } from 'zod';

export interface LoadedCustomSchema {
  schema: z.ZodObject<z.ZodRawShape>;
  schemaName: 'CustomSchema';
  schemaDescription: string;
}

function getSchemaExport(moduleValue: unknown): unknown {
  if (moduleValue instanceof z.ZodType) {
    return moduleValue;
  }

  if (typeof moduleValue !== 'object' || moduleValue === null) {
    return undefined;
  }

  if ('default' in moduleValue) {
    return moduleValue.default;
  }

  if ('schema' in moduleValue) {
    return moduleValue.schema;
  }

  return undefined;
}

export async function loadCustomSchema(
  schemaPath: string,
  cwd: string = process.cwd(),
): Promise<LoadedCustomSchema> {
  const resolvedPath = resolve(cwd, schemaPath);

  try {
    await access(resolvedPath);
  } catch {
    throw new Error(`Custom schema file not found: ${resolvedPath}`);
  }

  const jiti = createJiti(import.meta.url, { interopDefault: true });
  const importedModule = await jiti.import(resolvedPath);
  const schemaValue = getSchemaExport(importedModule);

  if (schemaValue === undefined) {
    throw new Error(
      'Custom schema module must export a Zod object as default or named export "schema".',
    );
  }

  if (!(schemaValue instanceof z.ZodObject)) {
    throw new Error('Custom schema must be a top-level z.object({...}) value.');
  }

  return {
    schema: schemaValue,
    schemaName: 'CustomSchema',
    schemaDescription: `User-provided schema loaded from ${basename(resolvedPath)}.`,
  };
}
