import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ApiKeyFieldProps {
  disabled?: boolean;
  value: string;
  onChange: (value: string) => void;
}

export function ApiKeyField({
  disabled = false,
  value,
  onChange,
}: ApiKeyFieldProps): React.JSX.Element {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="anthropic-api-key">Anthropic API key</Label>
        <Input
          autoComplete="off"
          disabled={disabled}
          id="anthropic-api-key"
          onChange={(event) => onChange(event.target.value)}
          placeholder="sk-ant-..."
          spellCheck={false}
          type="password"
          value={value}
        />
      </div>
      <p className="text-sm text-[var(--color-muted)]">
        Stored only for this browser session
      </p>
    </div>
  );
}
