import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

// Variants and sizes follow the Buttons group on the Components page.
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        secondary: "border border-border-strong bg-card text-foreground shadow-xs hover:bg-surface-2",
        outline: "border border-border-strong bg-card text-foreground shadow-xs hover:bg-surface-2",
        ghost: "text-foreground hover:bg-surface-2",
        soft: "bg-primary-soft text-primary-text hover:bg-primary/15",
        destructive: "bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90",
        link: "text-primary-text underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 gap-1.5 rounded-[7px] px-3 text-label",
        default: "h-10 gap-2 rounded-lg px-4 text-label",
        lg: "h-12 gap-2 rounded-[10px] px-[22px] text-[15px] leading-[22px]",
        icon: "h-10 w-10 rounded-lg",
        "icon-sm": "h-8 w-8 rounded-[7px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Shows a spinner in place of the leading icon and disables the button. */
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    const classes = cn(buttonVariants({ variant, size, className }));

    // Slot needs exactly one child, so the spinner is only added to real buttons.
    if (asChild) {
      return (
        <Slot className={classes} ref={ref} {...props}>
          {children}
        </Slot>
      );
    }

    return (
      <button className={classes} ref={ref} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
        {loading && <Loader2 className="animate-spin" />}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
