import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "flex h-9 w-full rounded-md border border-white/10 bg-black/60 px-3 py-2 text-sm",
      "placeholder:text-white/35 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#00d964]/60",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";
