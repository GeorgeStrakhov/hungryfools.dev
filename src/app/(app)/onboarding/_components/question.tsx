"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

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
}) {
  const select = (key: string) => {
    if (multi) {
      const next = value.includes(key)
        ? value.filter((v) => v !== key)
        : [...value, key];
      onChange(next);
    } else {
      onChange([key]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-medium">{title}</h2>
        {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
      </div>

      <div className="grid gap-3">
        {options.map((option) => (
          <Button
            key={option.key}
            variant={value.includes(option.key) ? "default" : "outline"}
            onClick={() => select(option.key)}
            className="flex h-auto items-center justify-start gap-3 p-4"
          >
            {option.icon}
            <span>{option.label}</span>
          </Button>
        ))}
      </div>

      {(onNext || onBack) && (
        <div className="nav-buttons flex justify-between">
          {onBack ? (
            <Button variant="ghost" onClick={onBack}>
              {backLabel}
            </Button>
          ) : (
            <div />
          )}
          {onNext && (
            <Button onClick={onNext} disabled={value.length === 0}>
              {nextLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
