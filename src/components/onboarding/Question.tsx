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
  const toggle = (k: string) => {
    if (multi) {
      onChange(value.includes(k) ? value.filter((v) => v !== k) : [...value, k]);
    } else {
      onChange(value.includes(k) ? [] : [k]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {subtitle ? <p className="text-muted-foreground mt-2">{subtitle}</p> : null}
      </div>
      <div className="grid gap-3">
        {options.map((opt) => {
          const active = value.includes(opt.key);
          return (
            <Button
              key={opt.key}
              variant={active ? "default" : "outline"}
              className="h-16 text-base justify-start gap-3 rounded-2xl"
              onClick={() => toggle(opt.key)}
            >
              {opt.icon}
              {opt.label}
            </Button>
          );
        })}
      </div>
      <div className="flex flex-row-reverse items-center justify-between">
        {onNext ? (
          <Button onClick={onNext}>{nextLabel}</Button>
        ) : null}
        {onBack ? (
          <Button variant="ghost" onClick={onBack}>
            {backLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}


