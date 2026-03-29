import * as React from "react";

import { cn } from "@/lib/utils";

type DivProps = React.HTMLAttributes<HTMLDivElement>;

function Card({ className, ...props }: DivProps): React.JSX.Element {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-[rgba(31,26,23,0.08)] bg-[var(--color-card)] text-[var(--color-ink)] shadow-[var(--shadow-card)]",
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: DivProps): React.JSX.Element {
  return <div className={cn("flex flex-col gap-3 p-6", className)} {...props} />;
}

function CardTitle({ className, ...props }: DivProps): React.JSX.Element {
  return (
    <div
      className={cn(
        "font-display text-[1.75rem] font-semibold leading-[1.1] tracking-[-0.03em]",
        className
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: DivProps): React.JSX.Element {
  return (
    <div
      className={cn("text-base leading-[1.6] text-[var(--color-muted)]", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: DivProps): React.JSX.Element {
  return <div className={cn("px-6 pb-6", className)} {...props} />;
}

export { Card, CardContent, CardDescription, CardHeader, CardTitle };
