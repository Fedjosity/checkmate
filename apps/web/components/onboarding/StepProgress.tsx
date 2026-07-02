import React from "react";

interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function StepProgress({ currentStep, totalSteps }: StepProgressProps) {
  return (
    <div className="flex gap-1.5 w-full mb-8">
      {Array.from({ length: totalSteps }).map((_, i) => {
        const stepNumber = i + 1;
        const isActiveOrCompleted = stepNumber <= currentStep;

        return (
          <div
            key={stepNumber}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ease-in-out ${
              isActiveOrCompleted ? "bg-gold" : "bg-border"
            }`}
          />
        );
      })}
    </div>
  );
}
