"use client"

import { cn } from "@/lib/utils"

export function ChipSelect({
  options,
  value,
  onChange,
  className,
}: {
  options: string[]
  value: string
  onChange: (value: string) => void
  className?: string
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            "rounded-full border px-4 py-2 text-xs font-bold transition-all active:scale-95",
            value === option
              ? "border-emerald-500/40 bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
              : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          {option}
        </button>
      ))}
    </div>
  )
}
