"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type PageHeroProps = {
  eyebrow: string
  title: string
  description: string
  actions?: ReactNode
  stats?: Array<{
    label: string
    value: string
  }>
  className?: string
}

export function PageHero({
  eyebrow,
  title,
  description,
  actions,
  stats,
  className,
}: PageHeroProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[2.5rem] border border-border bg-card p-6 shadow-2xl dark:bg-slate-900/40 dark:backdrop-blur-xl sm:p-10",
        className
      )}
    >
      {/* Dynamic Background */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-blue-500/5 blur-[100px]" />
        <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-sky-500/5 blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 dark:text-blue-400">
              {eyebrow}
            </p>
          </div>
          <h1 className="text-3xl font-black leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl xl:text-6xl">
            {title}
          </h1>
          <p className="max-w-2xl text-base font-medium leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>

        <div className="flex flex-col gap-6 lg:items-end">
          {actions && <div className="flex w-full flex-wrap gap-3 lg:w-auto lg:justify-end">{actions}</div>}
          {stats && stats.length > 0 && (
            <div className="flex flex-wrap gap-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[1.5rem] border border-border bg-background/50 px-5 py-4 shadow-sm backdrop-blur-sm dark:bg-white/5 sm:min-w-[100px]"
                >
                  <p className="text-xl font-black tracking-tighter text-foreground sm:text-2xl">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
