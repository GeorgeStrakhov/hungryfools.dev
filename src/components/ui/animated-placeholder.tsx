"use client";

import { useState, useEffect, useRef } from "react";

interface AnimatedPlaceholderProps {
  /** Array of example search suggestions to cycle through */
  suggestions: string[];
  /** Base placeholder text that shows when typing */
  basePlaceholder?: string;
  /** Speed of typing animation in milliseconds */
  typingSpeed?: number;
  /** Pause between suggestions in milliseconds */
  pauseBetween?: number;
  /** Whether the user is currently typing */
  isTyping?: boolean;
  /** Callback when animation state changes */
  onAnimationChange?: (isAnimating: boolean) => void;
}

export function useAnimatedPlaceholder({
  suggestions,
  basePlaceholder = "",
  typingSpeed = 100,
  pauseBetween = 2000,
  isTyping = false,
}: AnimatedPlaceholderProps) {
  const [currentText, setCurrentText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Stop animation if user is typing
    if (isTyping) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setCurrentText(basePlaceholder);
      return;
    }

    // If no suggestions, show base placeholder
    if (suggestions.length === 0) {
      setCurrentText(basePlaceholder);
      return;
    }

    const currentSuggestion = suggestions[currentIndex] || "";

    const animate = () => {
      if (isDeleting) {
        // Clear text instantly and move to next suggestion
        setCurrentText("");
        setIsDeleting(false);
        setCurrentIndex((prev) => (prev + 1) % suggestions.length);
      } else {
        // Typing text
        if (currentText.length < currentSuggestion.length) {
          setCurrentText(
            currentSuggestion.substring(0, currentText.length + 1),
          );
          timeoutRef.current = setTimeout(animate, typingSpeed);
        } else {
          // Finished typing, wait then clear and move to next
          timeoutRef.current = setTimeout(
            () => setIsDeleting(true),
            pauseBetween,
          );
        }
      }
    };

    // Start animation with small delay
    timeoutRef.current = setTimeout(animate, 100);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [
    currentText,
    currentIndex,
    isDeleting,
    isTyping,
    suggestions,
    basePlaceholder,
    typingSpeed,
    pauseBetween,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return currentText;
}

/**
 * Hook that provides animated placeholder functionality for input fields
 *
 * @example
 * ```tsx
 * const suggestions = [
 *   "Mastra.ai specialist from Europe, who also digs music",
 *   "vector database expert in San Francisco, open for hire",
 *   "React developer who ships MVPs in days, not months"
 * ];
 *
 * const [value, setValue] = useState("");
 * const placeholder = useAnimatedPlaceholder({
 *   suggestions,
 *   basePlaceholder: "Search developers...",
 *   isTyping: value.length > 0
 * });
 *
 * return (
 *   <input
 *     value={value}
 *     onChange={(e) => setValue(e.target.value)}
 *     placeholder={placeholder}
 *   />
 * );
 * ```
 */
export default useAnimatedPlaceholder;
