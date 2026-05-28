import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "flex h-9 w-full rounded-md border border-[color:var(--border-color)] bg-[var(--surface-input)] px-3 py-2 text-sm text-[color:var(--text-primary)]",
      "placeholder:text-[color:var(--text-faint)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--accent)]/60",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";
