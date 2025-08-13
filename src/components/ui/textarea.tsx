"use client"

import * as React from "react"
import posthog from "posthog-js"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    posthog.capture("textarea-input-finished", {
      component_id: props.id,
      component_name: props.name,
      input_length: e.target.value.length,
    })
    props.onBlur?.(e)
  }

  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      {...props}
      onBlur={handleBlur}
    />
  )
}

export { Textarea }
