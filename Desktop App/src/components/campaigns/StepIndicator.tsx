import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  step: 1 | 2 | 3 | 4;
}

const LABELS = ["Configuración", "Mensaje", "Confirmación", "Envío"];

export function StepIndicator({ step }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-3">
      {LABELS.map((label, i) => {
        const n = (i + 1) as 1 | 2 | 3 | 4;
        const done = step > n;
        const active = step === n;
        return (
          <div key={label} className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex items-center justify-center h-6 w-6 rounded-full border font-mono text-xs transition-colors",
                  done && "bg-primary border-primary text-primary-foreground",
                  active && "border-primary text-primary bg-primary/10",
                  !done && !active && "border-border text-muted-foreground",
                )}
              >
                {done ? <Check className="h-3 w-3" /> : n}
              </div>
              <span
                className={cn(
                  "label-eq text-[0.625rem] transition-colors",
                  active && "text-primary",
                  !done && !active && "text-muted-foreground/60",
                )}
              >
                {label}
              </span>
            </div>
            {i < LABELS.length - 1 && (
              <div
                className={cn(
                  "h-px w-8 transition-colors",
                  done ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
