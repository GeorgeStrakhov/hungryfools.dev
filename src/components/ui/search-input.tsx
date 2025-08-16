"use client";

import { useState } from "react";
import { useAnimatedPlaceholder } from "./animated-placeholder";
import { Input } from "./input";
import { Search } from "lucide-react";

interface SearchInputProps {
  /** Initial value for the search input */
  defaultValue?: string;
  /** Name attribute for the form input */
  name?: string;
  /** Additional CSS classes */
  className?: string;
  /** Array of example search suggestions to cycle through */
  suggestions?: string[];
  /** Base placeholder text that shows when typing */
  basePlaceholder?: string;
  /** Whether to show the search icon */
  showIcon?: boolean;
  /** Whether to use controlled mode (provide onChange) or uncontrolled mode */
  controlled?: boolean;
  /** Callback when the value changes */
  onChange?: (value: string) => void;
  /** Callback when form is submitted */
  onSubmit?: (value: string) => void;
}

const defaultSearchSuggestions = [
  "Mastra.ai specialist from Europe, who also digs music",
  "vector database expert in San Francisco, open for hire",
  "React developer who ships MVPs in days, not months",
  "AI engineer building the next unicorn startup",
  "full-stack wizard available for freelance projects",
  "Python developer obsessed with clean architecture",
  "TypeScript ninja who loves real-time applications",
  "blockchain developer from Tokyo, crypto enthusiast",
  "machine learning engineer with a passion for NLP",
  "Next.js expert building e-commerce solutions",
  "DevOps engineer who automates everything",
  "mobile developer crafting beautiful iOS apps",
];

export function SearchInput({
  defaultValue = "",
  name = "q",
  className = "bg-input border-input h-12 w-full rounded-md px-4",
  suggestions = defaultSearchSuggestions,
  basePlaceholder = "Search developers and projects...",
  showIcon = false,
  controlled = true,
  onChange,
  onSubmit,
}: SearchInputProps) {
  const [value, setValue] = useState(defaultValue);

  const animatedPlaceholder = useAnimatedPlaceholder({
    suggestions,
    basePlaceholder,
    isTyping: controlled ? value.length > 0 : false,
    typingSpeed: 80,
    pauseBetween: 3000,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue); // Always update internal state for consistent behavior
    onChange?.(newValue);
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (onSubmit) {
      e.preventDefault();
      onSubmit(value);
    }
    // If no onSubmit callback, let the form submit naturally (for server-side forms)
  };

  const inputProps = controlled
    ? { value, onChange: handleChange }
    : { defaultValue, onChange: handleChange };

  if (showIcon) {
    return (
      <form onSubmit={handleSubmit} className="relative">
        <Input
          type="text"
          name={name}
          {...inputProps}
          placeholder={animatedPlaceholder}
          className={`${className} ${showIcon ? "pr-12" : ""}`}
        />
        {showIcon && (
          <button
            type="submit"
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 p-2 transition-colors"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>
        )}
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        name={name}
        {...inputProps}
        placeholder={animatedPlaceholder}
        className={className}
      />
    </form>
  );
}
