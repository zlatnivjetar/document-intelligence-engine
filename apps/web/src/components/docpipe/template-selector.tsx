import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  BUILT_IN_TEMPLATES,
  type BuiltInTemplateId,
} from '@/lib/templates';

interface TemplateSelectorProps {
  disabled?: boolean;
  value: BuiltInTemplateId | 'custom' | '';
  onValueChange: (value: BuiltInTemplateId | 'custom') => void;
}

export function TemplateSelector({
  disabled = false,
  value,
  onValueChange,
}: TemplateSelectorProps): React.JSX.Element {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="template-selector">Template</Label>
        <Select
          disabled={disabled}
          onValueChange={(nextValue) =>
            onValueChange(nextValue as BuiltInTemplateId | 'custom')
          }
          value={value === '' ? undefined : value}
        >
          <SelectTrigger id="template-selector">
            <SelectValue placeholder="Choose a template" />
          </SelectTrigger>
          <SelectContent>
            {BUILT_IN_TEMPLATES.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                {template.label}
              </SelectItem>
            ))}
            <SelectItem value="custom">Custom Zod schema</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
