import { CheckCircle2 } from "lucide-react";

interface StepHeaderProps {
  steps: { key: string; label: string; icon: React.ReactNode }[];
  currentStepIndex: number;
  onStepClick: (key: any) => void;
}

export function RegistrationStepHeader({ steps, currentStepIndex, onStepClick }: StepHeaderProps) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between max-w-md mx-auto">
        {steps.map((step, i) => (
          <div key={step.key} className="flex items-center flex-1">
            <button
              type="button"
              onClick={() => {
                if (i < currentStepIndex) onStepClick(step.key);
              }}
              className={`flex flex-col items-center gap-1 flex-1 transition-colors ${
                i === currentStepIndex
                  ? "text-primary"
                  : i < currentStepIndex
                  ? "text-green-500"
                  : "text-muted-foreground/40"
              }`}
            >
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors ${
                i === currentStepIndex
                  ? "border-primary bg-primary text-primary-foreground"
                  : i < currentStepIndex
                  ? "border-green-500 bg-green-500 text-white"
                  : "border-muted-foreground/30 bg-muted"
              }`}>
                {i < currentStepIndex ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span className="text-[10px] font-medium leading-tight text-center">{step.label}</span>
            </button>
            {i < steps.length - 1 && (
              <div className={`h-0.5 w-full mx-1 mt-[-12px] ${i < currentStepIndex ? "bg-green-500" : "bg-muted"}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
