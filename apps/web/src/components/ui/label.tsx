import * as React from "react";

import * as LabelPrimitive from "@radix-ui/react-label";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const labelVariants: ReturnType<typeof cva> = cva(
  "text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]"
);

type LabelProps = React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>;

type LabelComponent = React.ForwardRefExoticComponent<
  LabelProps & React.RefAttributes<React.ElementRef<typeof LabelPrimitive.Root>>
>;

const Label: LabelComponent = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  LabelProps
>(function Label({ className, ...props }, ref): React.ReactElement | null {
  return (
    <LabelPrimitive.Root
      className={cn(labelVariants(), className)}
      ref={ref}
      {...props}
    />
  );
});

Label.displayName = "Label";

export { Label };
