import { Command, CommanderError, Option } from 'commander';
import { createAnthropicProvider, extract } from '@docpipe/core';
import type { ExtractionError } from '@docpipe/core';
import { loadCustomSchema } from './custom-schema.js';
import { loadDocumentInput } from './document-input.js';
import { formatExtractionOutput } from './output.js';
import type { OutputFormat } from './output.js';
import {
  BUILT_IN_TEMPLATES,
  type BuiltInTemplateId,
} from './templates.js';

export interface CliIo {
  stdout: Pick<NodeJS.WriteStream, 'write'>;
  stderr: Pick<NodeJS.WriteStream, 'write'>;
  env?: NodeJS.ProcessEnv;
  cwd?: string;
}

interface ExtractCommandOptions {
  template?: BuiltInTemplateId;
  schema?: string;
  format: OutputFormat;
  key?: string;
}

interface ExtractionSchemaConfig {
  schema: Parameters<typeof extract<Record<string, unknown>>>[0]['schema'];
  schemaName: string;
  schemaDescription: string;
}

function writeLine(
  stream: Pick<NodeJS.WriteStream, 'write'>,
  message: string,
): void {
  stream.write(message.endsWith('\n') ? message : `${message}\n`);
}

function isExtractionError(error: unknown): error is ExtractionError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as ExtractionError).code === 'string' &&
    'message' in error &&
    typeof (error as ExtractionError).message === 'string'
  );
}

async function executeExtractCommand(
  filePath: string,
  options: ExtractCommandOptions,
  io: Required<CliIo>,
): Promise<number> {
  try {
    const hasTemplate = typeof options.template === 'string';
    const hasSchema = typeof options.schema === 'string';

    if (Number(hasTemplate) + Number(hasSchema) !== 1) {
      writeLine(
        io.stderr,
        'Choose exactly one schema source: --template <invoice|receipt|w2> or --schema <path>.',
      );
      return 1;
    }

    const input = await loadDocumentInput(filePath);
    const schemaConfig: ExtractionSchemaConfig = hasSchema
      ? await loadCustomSchema(options.schema, io.cwd)
      : BUILT_IN_TEMPLATES[options.template as BuiltInTemplateId];
    const apiKey = options.key ?? io.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      writeLine(
        io.stderr,
        'Provide an Anthropic API key with --key or ANTHROPIC_API_KEY.',
      );
      return 1;
    }

    const result = await extract({
      input,
      schema: schemaConfig.schema,
      schemaName: schemaConfig.schemaName,
      schemaDescription: schemaConfig.schemaDescription,
      model: createAnthropicProvider({ apiKey }),
    });

    io.stdout.write(
      formatExtractionOutput(
        result as Parameters<typeof formatExtractionOutput<Record<string, unknown>>>[0],
        options.format,
      ),
    );

    return 0;
  } catch (error) {
    if (isExtractionError(error)) {
      writeLine(
        io.stderr,
        `Extraction failed [${error.code}]: ${error.message}`,
      );
      return 1;
    }

    if (error instanceof Error) {
      writeLine(io.stderr, error.message);
      return 1;
    }

    writeLine(io.stderr, String(error));
    return 1;
  }
}

export async function runCli(
  argv: string[],
  io?: CliIo,
): Promise<number> {
  const runtimeIo: Required<CliIo> = {
    stdout: io?.stdout ?? process.stdout,
    stderr: io?.stderr ?? process.stderr,
    env: io?.env ?? process.env,
    cwd: io?.cwd ?? process.cwd(),
  };
  let exitCode = 0;

  const program = new Command();

  program
    .name('docpipe')
    .description('DocPipe CLI for structured document extraction.')
    .configureOutput({
      writeOut: (message) => {
        runtimeIo.stdout.write(message);
      },
      writeErr: (message) => {
        runtimeIo.stderr.write(message);
      },
      outputError: (message, write) => {
        write(message);
      },
    })
    .showHelpAfterError()
    .exitOverride();

  program
    .command('extract')
    .description('Extract structured data from a local PDF, PNG, or JPEG file.')
    .argument('<file>', 'Local document file path')
    .addOption(
      new Option(
        '--template <name>',
        'Built-in template to use (invoice|receipt|w2)',
      )
        .choices(['invoice', 'receipt', 'w2']),
    )
    .option('--schema <path>', 'Path to a schema module file')
    .addOption(
      new Option('--format <format>', 'Output format (json or csv)')
        .choices(['json', 'csv'])
        .default('json'),
    )
    .option('--key <apiKey>', 'Anthropic API key (overrides ANTHROPIC_API_KEY)')
    .addHelpText(
      'after',
      [
        '',
        'Supported templates: invoice, receipt, w2',
        'Custom schema modules may export default z.object({...}) or export const schema = z.object({...}).',
        'Environment:',
        '  ANTHROPIC_API_KEY  Anthropic API key used when --key is omitted.',
      ].join('\n'),
    )
    .action(async (filePath: string, options: ExtractCommandOptions) => {
      exitCode = await executeExtractCommand(filePath, options, runtimeIo);
    });

  try {
    await program.parseAsync(argv, { from: 'user' });
    return exitCode;
  } catch (error) {
    if (error instanceof CommanderError) {
      return error.exitCode;
    }

    throw error;
  }
}
