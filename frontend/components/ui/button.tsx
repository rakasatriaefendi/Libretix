import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, asChild = false, variant = "default", size = "default", ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium transition",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--accent)]/60 disabled:pointer-events-none disabled:opacity-50",
          variant === "default" && "bg-[color:var(--accent)] text-[color:var(--accent-foreground)] hover:bg-[color:var(--accent-strong)]",
          variant === "ghost" && "bg-transparent text-[color:var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[color:var(--text-primary)]",
          variant === "outline" && "border border-[color:var(--border-color)] bg-transparent text-[color:var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[color:var(--text-primary)]",
          size === "default" && "h-9 px-4 py-2",
          size === "sm" && "h-8 px-3",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
