"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils/cn";

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  success?: boolean;
  loading?: boolean;
}

export function OTPInput({
  length = 6,
  value,
  onChange,
  disabled = false,
  error = false,
  success = false,
  loading = false,
}: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  const focusInput = useCallback((index: number) => {
    const target = inputRefs.current[index];
    if (target) target.focus();
  }, []);

  const handleChange = useCallback(
    (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
      const digit = e.target.value;

      // Only accept single digits
      if (digit && !/^\d$/.test(digit)) return;

      const chars = value.split("");
      // Pad to length
      while (chars.length < length) chars.push("");
      chars[index] = digit;
      const newValue = chars.join("");
      onChange(newValue);

      // Auto-advance to next input
      if (digit && index < length - 1) {
        focusInput(index + 1);
      }
    },
    [value, length, onChange, focusInput]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace") {
        e.preventDefault();
        const chars = value.split("");
        while (chars.length < length) chars.push("");

        if (chars[index]) {
          // Clear current box
          chars[index] = "";
          onChange(chars.join(""));
        } else if (index > 0) {
          // Move back and clear previous
          chars[index - 1] = "";
          onChange(chars.join(""));
          focusInput(index - 1);
        }
      } else if (e.key === "ArrowLeft" && index > 0) {
        focusInput(index - 1);
      } else if (e.key === "ArrowRight" && index < length - 1) {
        focusInput(index + 1);
      }
    },
    [value, length, onChange, focusInput]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
      if (pasted.length > 0) {
        onChange(pasted.padEnd(length, ""));
        focusInput(Math.min(pasted.length, length - 1));
      }
    },
    [length, onChange, focusInput]
  );

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={value[index] ?? ""}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled || loading}
          className={cn(
            "w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold text-white bg-surface border-2 rounded-xl transition-all duration-200 focus:outline-none",
            // Default state
            !error && !success && !loading && "border-border focus:border-gold focus:ring-1 focus:ring-gold",
            // Error state
            error && "border-error bg-error/10 animate-shake",
            // Success state
            success && "border-success bg-success/10",
            // Loading state
            loading && "border-gold/50 opacity-70 animate-border-pulse",
            // Disabled
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />
      ))}
    </div>
  );
}
