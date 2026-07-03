import React, { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";
import CheckIcon from "@mui/icons-material/Check";

export interface CheckboxProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label?: React.ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    return (
      <div className={cn("flex items-start gap-3", className)}>
        <div className="relative flex items-center justify-center mt-0.5">
          <input
            type="checkbox"
            id={id}
            className="peer appearance-none h-5 w-5 rounded-md border-2 border-primary/40 bg-surface shadow-[0_0_10px_rgba(230,195,100,0.1)] checked:bg-primary checked:border-primary checked:shadow-[0_0_15px_rgba(230,195,100,0.25)] focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all duration-300 cursor-pointer"
            ref={ref}
            {...props}
          />
          <CheckIcon
            className="absolute text-on-primary pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity"
            style={{ fontSize: 16 }}
          />
        </div>
        {label && (
          <label
            htmlFor={id}
            className="text-sm text-on-surface-variant cursor-pointer"
          >
            {label}
          </label>
        )}
      </div>
    );
  },
);
Checkbox.displayName = "Checkbox";
