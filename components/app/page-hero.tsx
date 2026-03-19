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
        "relative overflow-hidden rounded-[1.8rem] border border-border bg-card p-5 shadow-xl dark:bg-slate-900/40 dark:backdrop-blur-md sm:rounded-[2.2rem] sm:p-7 lg:rounded-[2.5rem] lg:p-8",
        className
      )}
    >
      {/* Dynamic Background */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-[80px]" />
        <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-sky-500/10 blur-[80px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.05),transparent_40%)]" />
      </div>

      <div className="relative z-10 flex flex-col gap-5 sm:gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-600 dark:text-emerald-400 sm:tracking-[0.3em]">
              {eyebrow}
            </p>
          </div>
          <h1 className="mt-3 text-[1.8rem] font-extrabold tracking-tight text-foreground sm:mt-4 sm:text-[2.25rem] lg:text-4xl xl:text-5xl">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-[13px] font-medium leading-5 text-muted-foreground sm:mt-4 sm:text-[15px] sm:leading-relaxed lg:text-base">
            {description}
          </p>
        </div>

        {(actions || (stats && stats.length > 0)) && (
          <div className="flex flex-col gap-3 sm:gap-4 lg:items-end">
            {actions && <div className="flex w-full flex-wrap gap-2 lg:w-auto lg:justify-end">{actions}</div>}
            {stats && stats.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-[1.1rem] border border-border bg-background/50 p-3 shadow-sm backdrop-blur-sm dark:bg-white/5 sm:min-w-[8rem] sm:rounded-2xl sm:p-4"
                  >
                    <p className="text-sm font-extrabold tracking-tight text-foreground sm:text-base">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground/60 sm:tracking-widest">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
