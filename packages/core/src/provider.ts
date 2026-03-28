import { createAnthropic } from '@ai-sdk/anthropic';
import type { LanguageModelV3 } from '@ai-sdk/provider';

/**
 * Options for creating the Anthropic provider.
 * apiKey: Anthropic API key (BYOK — provided by the caller, never stored server-side).
 * model: Claude model ID. Defaults to 'claude-sonnet-4-6'.
 */
export interface AnthropicProviderOptions {
  apiKey: string;
  model?: string;
}

/**
 * Creates a LanguageModelV3-compatible Anthropic provider instance.
 *
 * Per D-09, D-10, D-11: The provider abstraction IS LanguageModelV3 from @ai-sdk/provider.
 * Swapping to OpenAI requires only: `import { createOpenAI } from '@ai-sdk/openai'`
 * and dropping in `createOpenAI({ apiKey })(model)` — no changes to packages/core.
 *
 * BYOK: The caller provides `apiKey` at call time. It is never stored or logged.
 *
 * @example
 * const model = createAnthropicProvider({ apiKey: 'sk-ant-...' });
 * // Pass model to extract() in Phase 2:
 * // const result = await extract({ input, schema, model });
 */
export function createAnthropicProvider(
  options: AnthropicProviderOptions,
): LanguageModelV3 {
  const { apiKey, model = 'claude-sonnet-4-6' } = options;
  const anthropic = createAnthropic({ apiKey });
  return anthropic(model);
}
