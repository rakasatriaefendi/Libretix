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
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#00d964]/60 disabled:pointer-events-none disabled:opacity-50",
          variant === "default" && "bg-[#00d964] text-black hover:bg-[#00c05a]",
          variant === "ghost" && "bg-transparent hover:bg-white/5",
          variant === "outline" && "border border-white/10 bg-transparent hover:bg-white/5",
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
