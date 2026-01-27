import { cn } from "@/lib/utils";

interface Step {
  id: string;
  title: string;
  description?: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStepIndex: number;
}

export default function StepIndicator({ steps, currentStepIndex }: StepIndicatorProps) {
  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <div className="flex items-center justify-between gap-2">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isUpcoming = index > currentStepIndex;

          return (
            <div
              key={step.id}
              className={cn(
                "flex-1 flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all",
                isCurrent && "border-primary bg-primary/5 shadow-md",
                isCompleted && "border-green-500 bg-green-50",
                isUpcoming && "border-slate-200 bg-white"
              )}
            >
              {/* Step Number */}
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                  isCurrent && "bg-primary text-white",
                  isCompleted && "bg-green-500 text-white",
                  isUpcoming && "bg-slate-200 text-slate-600"
                )}
              >
                {isCompleted ? "✓" : index + 1}
              </div>

              {/* Step Title */}
              <div className="text-center">
                <p
                  className={cn(
                    "text-xs font-semibold",
                    isCurrent && "text-primary",
                    isCompleted && "text-green-700",
                    isUpcoming && "text-slate-500"
                  )}
                >
                  {step.title}
                </p>
                {step.description && (
                  <p className="text-[10px] text-muted-foreground mt-0.5 hidden sm:block">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
