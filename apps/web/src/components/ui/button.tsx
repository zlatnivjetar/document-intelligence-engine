import * as React from "react";

import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "secondary" | "outline" | "ghost";
type ButtonSize = "default" | "sm" | "lg";
type ButtonVariants = (options?: {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) => string;

const buttonVariants: ButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-accent)] text-[var(--color-card)] shadow-[0_16px_40px_rgba(200,100,59,0.28)] hover:bg-[#b65831]",
        secondary:
          "bg-[var(--color-surface)] text-[var(--color-ink)] hover:bg-[#cebfa9]",
        outline:
          "border border-[rgba(31,26,23,0.16)] bg-transparent text-[var(--color-ink)] hover:bg-[rgba(31,26,23,0.05)]",
        ghost: "bg-transparent text-[var(--color-ink)] hover:bg-[rgba(31,26,23,0.05)]"
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 px-4 py-2",
        lg: "h-14 px-7 py-4 text-base"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
 ) as ButtonVariants;

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  {
    variant?: ButtonVariant;
    size?: ButtonSize;
    asChild?: boolean;
  };

type ButtonComponent = React.ForwardRefExoticComponent<
  ButtonProps & React.RefAttributes<HTMLButtonElement>
>;

const Button: ButtonComponent = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className, variant, size, asChild = false, ...props },
    ref
  ): React.ReactElement | null {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
