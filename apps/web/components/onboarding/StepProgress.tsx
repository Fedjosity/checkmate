import React from "react";

interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function StepProgress({ currentStep, totalSteps }: StepProgressProps) {
  return (
    <div className="flex gap-2.5 w-full mb-6">
      {Array.from({ length: totalSteps }).map((_, i) => {
        const stepNumber = i + 1;
        const isCurrent = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;

        return (
          <div
            key={stepNumber}
            className={`h-2 flex-1 rounded-full transition-all duration-500 ease-in-out ${
              isCurrent || isCompleted
                ? "bg-gold shadow-[0_0_12px_rgba(201,168,76,0.7)]"
                : "bg-surface-bright border border-border/60"
            }`}
          />
        );
      })}
    </div>
  );
}
