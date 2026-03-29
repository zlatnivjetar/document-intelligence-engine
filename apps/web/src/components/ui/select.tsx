"use client";

import * as React from "react";

import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

type SelectProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Root>;
type SelectTriggerProps = React.ComponentPropsWithoutRef<
  typeof SelectPrimitive.Trigger
>;
type SelectContentProps = React.ComponentPropsWithoutRef<
  typeof SelectPrimitive.Content
>;
type SelectItemProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>;

type SelectComponent = typeof SelectPrimitive.Root;
type SelectTriggerComponent = React.ForwardRefExoticComponent<
  SelectTriggerProps &
    React.RefAttributes<React.ElementRef<typeof SelectPrimitive.Trigger>>
>;
type SelectContentComponent = React.ForwardRefExoticComponent<
  SelectContentProps &
    React.RefAttributes<React.ElementRef<typeof SelectPrimitive.Content>>
>;
type SelectItemComponent = React.ForwardRefExoticComponent<
  SelectItemProps &
    React.RefAttributes<React.ElementRef<typeof SelectPrimitive.Item>>
>;

const Select: SelectComponent = SelectPrimitive.Root;

const SelectTrigger: SelectTriggerComponent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  SelectTriggerProps
>(function SelectTrigger(
  { className, children, ...props },
  ref
): React.ReactElement | null {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        "flex h-12 w-full items-center justify-between rounded-[var(--radius-md)] border border-[rgba(31,26,23,0.12)] bg-[rgba(244,239,230,0.92)] px-4 py-3 text-left text-base text-[var(--color-ink)] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] outline-none transition-colors data-[placeholder]:text-[rgba(99,89,78,0.72)] focus-visible:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[rgba(200,100,59,0.18)] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="h-4 w-4 text-[var(--color-muted)]" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});

SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectValue: typeof SelectPrimitive.Value = SelectPrimitive.Value;

const SelectContent: SelectContentComponent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  SelectContentProps
>(function SelectContent(
  { className, children, position = "popper", ...props },
  ref
): React.ReactElement | null {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        className={cn(
          "relative z-50 min-w-[12rem] overflow-hidden rounded-[var(--radius-md)] border border-[rgba(31,26,23,0.08)] bg-[var(--color-card)] text-[var(--color-ink)] shadow-[var(--shadow-card)] data-[state=closed]:animate-out data-[state=open]:animate-in",
          position === "popper" &&
            "data-[side=bottom]:translate-y-2 data-[side=left]:-translate-x-2 data-[side=right]:translate-x-2 data-[side=top]:-translate-y-2",
          className
        )}
        position={position}
        ref={ref}
        {...props}
      >
        <SelectPrimitive.Viewport
          className={cn(
            "p-2",
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
});

SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectItem: SelectItemComponent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  SelectItemProps
>(function SelectItem(
  { className, children, ...props },
  ref
): React.ReactElement | null {
  return (
    <SelectPrimitive.Item
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-[calc(var(--radius-md)-4px)] py-2.5 pl-3 pr-10 text-base outline-none transition-colors focus:bg-[rgba(200,100,59,0.12)] focus:text-[var(--color-ink)] data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    >
      <span className="absolute right-3 flex h-4 w-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="h-4 w-4 text-[var(--color-accent)]" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
});

SelectItem.displayName = SelectPrimitive.Item.displayName;

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue };
