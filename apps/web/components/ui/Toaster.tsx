"use client";

import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

export const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-surface group-[.toaster]:text-text-primary group-[.toaster]:border-border group-[.toaster]:border group-[.toaster]:shadow-lg group-[.toaster]:rounded-none group-[.toaster]:font-body-md group-[.toaster]:px-6 group-[.toaster]:py-4",
          description: "group-[.toast]:text-text-muted group-[.toast]:text-sm group-[.toast]:mt-1",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-on-primary group-[.toast]:font-label-caps group-[.toast]:rounded-none group-[.toast]:px-4 group-[.toast]:py-2",
          cancelButton:
            "group-[.toast]:bg-surface-bright group-[.toast]:text-text-primary group-[.toast]:font-label-caps group-[.toast]:rounded-none",
          success: "group-[.toaster]:border-l-4 group-[.toaster]:border-l-primary group-[.toaster]:border-t-border group-[.toaster]:border-r-border group-[.toaster]:border-b-border group-[.toaster]:shadow-[0_0_15px_rgba(201,168,76,0.15)]",
          error: "group-[.toaster]:border-t-4 group-[.toaster]:border-t-primary group-[.toaster]:border-l-border group-[.toaster]:border-r-border group-[.toaster]:border-b-border group-[.toaster]:shadow-[0_0_15px_rgba(201,168,76,0.15)]",
          warning: "group-[.toaster]:border-secondary/50 group-[.toaster]:shadow-[0_0_15px_rgba(226,195,132,0.15)]",
          info: "group-[.toaster]:border-tertiary/50 group-[.toaster]:shadow-[0_0_15px_rgba(185,196,255,0.15)]",
        },
      }}
      {...props}
    />
  );
};
