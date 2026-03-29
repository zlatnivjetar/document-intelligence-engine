import * as React from 'react';

import { cn } from '@/lib/utils';

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

type TextareaComponent = React.ForwardRefExoticComponent<
  TextareaProps & React.RefAttributes<HTMLTextAreaElement>
>;

const Textarea: TextareaComponent = React.forwardRef<
  HTMLTextAreaElement,
  TextareaProps
>(function Textarea(
  { className, ...props },
  ref,
): React.ReactElement | null {
  return (
    <textarea
      className={cn(
        'flex min-h-40 w-full rounded-[var(--radius-md)] border border-[rgba(31,26,23,0.12)] bg-[rgba(244,239,230,0.92)] px-4 py-3 text-base text-[var(--color-ink)] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] outline-none transition-colors placeholder:text-[rgba(99,89,78,0.72)] focus-visible:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[rgba(200,100,59,0.18)] disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});

Textarea.displayName = 'Textarea';

export { Textarea };
