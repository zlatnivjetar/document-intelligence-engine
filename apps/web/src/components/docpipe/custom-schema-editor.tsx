import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const CUSTOM_SCHEMA_PLACEHOLDER = `z.object({
  invoiceNumber: z.string(),
  total: z.number(),
  lineItems: z.array(
    z.object({
      description: z.string(),
      amount: z.number(),
    }),
  ),
})`;

interface CustomSchemaEditorProps {
  disabled?: boolean;
  value: string;
  onChange: (value: string) => void;
}

export function CustomSchemaEditor({
  disabled = false,
  value,
  onChange,
}: CustomSchemaEditorProps): React.JSX.Element {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="custom-schema-editor">Custom Zod schema</Label>
        <p className="text-sm text-[var(--color-muted)]">
          Paste a top-level {'z.object({...})'} schema. This runs only in your
          browser session.
        </p>
      </div>
      <Textarea
        disabled={disabled}
        id="custom-schema-editor"
        onChange={(event) => onChange(event.target.value)}
        placeholder={CUSTOM_SCHEMA_PLACEHOLDER}
        spellCheck={false}
        value={value}
      />
      <p className="text-sm text-[rgba(99,89,78,0.82)]">
        Use z from Zod directly, for example z.string(), z.number(), and
        z.array(...).
      </p>
    </div>
  );
}
