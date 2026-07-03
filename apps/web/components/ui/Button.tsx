import React from "react";
import { cn } from "@/lib/utils/cn";
import { Spinner } from "./Spinner";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      fullWidth = false,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const variants = {
      primary:
        "btn-primary px-8 py-4 font-label-caps text-label-caps rounded-sm w-full text-center",
      secondary:
        "bg-transparent border border-border text-on-surface-variant hover:border-primary hover:text-primary hover:shadow-[0_0_15px_rgba(230,195,100,0.2)] active:border-primary active:text-primary active:shadow-[0_0_20px_rgba(230,195,100,0.4)] transition-all duration-300 group",
      ghost:
        "bg-transparent text-muted hover:text-white hover:bg-white/5 border border-transparent transition-all duration-300",
    };

    const sizes = {
      sm: "h-8 px-3 text-sm",
      md: "h-10 px-4 py-2",
      lg: "h-12 px-6 text-lg",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          className,
        )}
        {...props}
      >
        {isLoading && <Spinner className="mr-2" size="sm" />}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
