'use client';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { DocpipeProvider } from '@/hooks/use-session-storage';

interface ProviderSelectorProps {
  disabled?: boolean;
  onValueChange: (value: DocpipeProvider) => void;
  value: DocpipeProvider;
}

const PROVIDER_LABELS: Record<DocpipeProvider, string> = {
  anthropic: 'Anthropic',
  openai: 'OpenAI',
};

export function ProviderSelector({
  disabled = false,
  onValueChange,
  value,
}: ProviderSelectorProps): React.JSX.Element {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="docpipe-provider">Provider</Label>
        <Select
          disabled={disabled}
          onValueChange={(nextValue) => onValueChange(nextValue as DocpipeProvider)}
          value={value}
        >
          <SelectTrigger id="docpipe-provider">
            <SelectValue placeholder="Choose a provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="anthropic">
              {PROVIDER_LABELS.anthropic}
            </SelectItem>
            <SelectItem value="openai">
              {PROVIDER_LABELS.openai}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <p className="text-sm text-[var(--color-muted)]">
        Your browser calls the selected model provider directly.
      </p>
    </div>
  );
}
