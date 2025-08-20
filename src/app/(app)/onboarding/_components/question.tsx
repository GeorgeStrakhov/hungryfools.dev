"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type Option = {
  key: string;
  label: string;
  icon?: React.ReactNode;
};

export function Question({
  title,
  subtitle,
  options,
  multi = false,
  value,
  onChange,
  onNext,
  onBack,
  nextLabel = "Next",
  backLabel = "Back",
  isSaving = false,
}: {
  title: string;
  subtitle?: string;
  options: Option[];
  multi?: boolean;
  value: string[];
  onChange: (next: string[]) => void;
  onNext?: () => void;
  onBack?: () => void;
  nextLabel?: string;
  backLabel?: string;
  isSaving?: boolean;
}) {
  const select = (key: string) => {
    if (multi) {
      const next = value.includes(key)
        ? value.filter((v) => v !== key)
        : [...value, key];
      console.log("❓ Question: select multi", {
        key,
        oldValue: value,
        newValue: next,
      });
      onChange(next);
    } else {
      console.log("❓ Question: select single", {
        key,
        oldValue: value,
        newValue: [key],
      });
      onChange([key]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-medium">{title}</h2>
        {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
      </div>

      <div className="grid auto-rows-fr grid-cols-2 gap-3">
        {options.map((option) => (
          <Button
            key={option.key}
            variant={value.includes(option.key) ? "default" : "outline"}
            onClick={() => select(option.key)}
            className="flex h-full items-center justify-center gap-2 p-3 text-center whitespace-normal"
            title={option.label}
          >
            {option.icon && <div className="flex-shrink-0">{option.icon}</div>}
            <span className="text-xs leading-tight sm:text-sm">
              {option.label}
            </span>
          </Button>
        ))}
      </div>

      {(onNext || onBack) && (
        <div className="nav-buttons flex justify-between">
          {onBack ? (
            <Button variant="ghost" onClick={onBack} disabled={isSaving}>
              {backLabel}
            </Button>
          ) : (
            <div />
          )}
          {onNext && (
            <Button onClick={onNext} disabled={value.length === 0 || isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                nextLabel
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
