import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ApiKeyFieldProps {
  disabled?: boolean;
  inputId: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

export function ApiKeyField({
  disabled = false,
  inputId,
  label,
  placeholder,
  value,
  onChange,
}: ApiKeyFieldProps): React.JSX.Element {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor={inputId}>{label}</Label>
        <Input
          autoComplete="off"
          disabled={disabled}
          id={inputId}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
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
