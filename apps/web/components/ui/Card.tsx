import React from "react";
import { cn } from "@/lib/utils/cn";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: "none" | "sm" | "md" | "lg";
  variant?: "default" | "hud";
}

export function Card({ className, padding = "md", variant = "default", children, ...props }: CardProps) {
  const paddings = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8 sm:p-12",
  };

  const variants = {
    default: "rounded-2xl border border-border bg-surface text-white",
    hud: "bg-surface/60 backdrop-blur-xl border-t-2 border-t-gold/50 border border-border/50 rounded-2xl shadow-xl transition-all hover:bg-surface/80 group",
  };

  return (
    <div
      className={cn(
        variants[variant],
        paddings[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

