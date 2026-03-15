"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowRight, Theater, WandSparkles, Sparkles } from "lucide-react"
import { motion } from "motion/react"

import { PageHero } from "@/components/app/page-hero"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { scenarioApi } from "@/lib/api"
import type { Scenario } from "@/lib/types"
import { cn } from "@/lib/utils"

function normalizeLevel(rawLevel: unknown): Scenario["level"] {
  if (rawLevel === "Advanced" || rawLevel === "ADVANCED") {
    return "Advanced"
  }
  if (rawLevel === "Intermediate" || rawLevel === "INTERMEDIATE") {
    return "Intermediate"
  }
  return "Beginner"
}

function normalizeScenario(raw: unknown): Scenario {
  const source = (raw ?? {}) as Record<string, unknown>
  return {
    id: String(source.id ?? ""),
    title: String(source.title ?? ""),
    category: String(source.category ?? "general"),
    level: normalizeLevel(source.level),
    summary: String(source.summary ?? ""),
    goal: String(source.goal ?? ""),
  }
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
} as const

export default function ScenariosPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    scenarioApi
      .getList()
      .then((data) => {
        const list = Array.isArray(data) ? data : []
        setScenarios(list.map((item) => normalizeScenario(item)))
      })
      .catch(() => setError("Failed to load scenarios."))
      .finally(() => setLoading(false))
  }, [])

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 pb-12"
    >
      <motion.div variants={itemVariants}>
        <PageHero
          eyebrow="Scenarios"
          title="Interactive Simulation"
          description="Practice Korean inside guided role-play situations with clear objectives and level-based complexity."
          stats={[
            { label: "Available", value: loading ? "..." : `${scenarios.length}` },
            { label: "Format", value: "Role-play" },
            { label: "Difficulty", value: "Adaptive" },
          ]}
        />
      </motion.div>

      {error && (
        <motion.div variants={itemVariants} className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm font-bold text-destructive">
          {error}
        </motion.div>
      )}

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-[2.5rem] border border-border bg-card p-6 shadow-xl">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-4">
                  <Skeleton className="h-12 w-12 rounded-2xl" />
                  <div>
                    <Skeleton className="h-7 w-40" />
                    <Skeleton className="mt-2 h-4 w-24" />
                  </div>
                </div>
                <Skeleton className="h-6 w-20 rounded-lg" />
              </div>
              <Skeleton className="mt-8 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-5/6" />
              <div className="mt-6 rounded-2xl border border-border bg-accent/5 p-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="mt-3 h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-4/5" />
              </div>
              <Skeleton className="mt-8 h-12 w-full rounded-2xl" />
            </div>
          ))}
        </div>
      ) : null}

      {!loading && !scenarios.length ? (
        <motion.div variants={itemVariants} className="flex flex-col items-center justify-center rounded-[2.5rem] border border-dashed border-border bg-accent/5 p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-[2rem] bg-muted/10 text-muted-foreground/40 mb-6">
            <Theater size={32} />
          </div>
          <p className="text-lg font-black text-foreground">No scenarios found</p>
          <p className="mt-2 max-w-sm text-sm font-medium text-muted-foreground leading-relaxed">
            Role-play seeds will appear here as guided sessions for specific real-world situations.
          </p>
        </motion.div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {scenarios.map((scenario) => (
          <motion.div key={scenario.id} variants={itemVariants}>
            <Card
              className="group relative flex h-full flex-col overflow-hidden rounded-[2.5rem] border-border bg-card shadow-xl transition-all hover:-translate-y-2 hover:shadow-2xl dark:bg-slate-900/40"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 to-indigo-500 opacity-0 transition-opacity group-hover:opacity-100" />
              
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400 shadow-sm ring-1 ring-violet-500/20 group-hover:scale-110 transition-transform">
                      <Theater size={22} strokeWidth={2.5} />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-black leading-tight tracking-tight text-foreground">{scenario.title}</CardTitle>
                      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/60">
                        {scenario.category}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className={cn(
                    "rounded-lg px-2 py-0.5 text-[10px] font-black uppercase border-none",
                    scenario.level === "Beginner" ? "bg-emerald-500/10 text-emerald-600" :
                    scenario.level === "Intermediate" ? "bg-amber-500/10 text-amber-600" :
                    "bg-rose-500/10 text-rose-600"
                  )}>
                    {scenario.level}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="flex flex-1 flex-col justify-between gap-6 pt-2">
                <div className="space-y-4">
                  <p className="text-[14px] font-medium leading-relaxed text-muted-foreground">
                    {scenario.summary}
                  </p>
                  
                  <div className="rounded-2xl border border-border bg-accent/5 p-4 shadow-inner">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={12} className="text-violet-500" strokeWidth={3} />
                      <p className="text-[10px] font-black uppercase tracking-widest text-foreground/60">Goal</p>
                    </div>
                    <p className="text-[13px] font-bold leading-relaxed text-foreground/80">{scenario.goal}</p>
                  </div>
                </div>

                <Button asChild className="h-12 w-full rounded-2xl bg-linear-to-r from-violet-600 to-indigo-600 text-sm font-black text-white shadow-lg shadow-violet-600/20 transition-all hover:from-violet-500 hover:to-indigo-500 active:scale-95">
                  <Link href={`/scenarios/${scenario.id}`} className="flex items-center justify-center gap-2">
                    <WandSparkles size={16} strokeWidth={2.5} />
                    Start Session
                    <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" strokeWidth={3} />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
