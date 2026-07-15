"use client"

import { useState } from "react"
import { Loader2, Sparkles, Wand2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { goalsApi, getApiErrorMessage } from "@/lib/api"
import type { Task } from "@/lib/tasks"

interface GoalCoachProps {
  goalId: string
  /** Steers the quick-fill note suggestions — "education" surfaces Korean-learning presets. */
  goalType?: string
  /** Called after tasks are generated so the parent can refetch + jump to Tasks. */
  onGenerated?: (tasks: Task[]) => void
}

const COUNTS = [5, 7, 10]

// Naming an actual app feature here matters: LearningPracticeCard matches
// these same keywords to turn the generated tasks into "Practice →" links.
const EDUCATION_NOTE_PRESETS = [
  "Focus on workplace vocabulary and daily phrases",
  "Mix in roleplay scenarios and listening practice",
  "Prioritize speaking practice and grammar corrections",
]

/**
 * AI Goal Coach — generates a plan of tasks for the goal via the backend
 * OpenAI endpoint (POST /goals/{id}/generate-tasks) and inserts them.
 */
export function GoalCoach({ goalId, goalType, onGenerated }: GoalCoachProps) {
  const [count, setCount] = useState(7)
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState<Task[] | null>(null)

  const generate = async () => {
    setLoading(true)
    try {
      const tasks = await goalsApi.generateTasks(goalId, { count, note: note.trim() || undefined })
      setGenerated(tasks)
      onGenerated?.(tasks)
      toast.success(`Added ${tasks.length} task${tasks.length === 1 ? "" : "s"}`, {
        description: "Open the Tasks tab to see them on your calendar.",
      })
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Could not generate tasks"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl border-border bg-card/50 p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight">AI Goal Coach</h3>
            <p className="text-sm font-medium text-muted-foreground">
              Generate a task plan for this goal, scheduled across your timeframe.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              How many tasks?
            </p>
            <div className="flex gap-2">
              {COUNTS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCount(c)}
                  className={cn(
                    "h-10 flex-1 rounded-xl border text-sm font-bold transition-colors",
                    count === c
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted/40"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Anything specific? (optional)
            </p>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. focus on speaking practice, beginner level…"
              className="h-11 rounded-xl"
            />
            {goalType === "education" && (
              <div className="mt-2 flex flex-wrap gap-2">
                {EDUCATION_NOTE_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setNote(preset)}
                    className="rounded-full border border-border bg-muted/30 px-3 py-1 text-[11px] font-bold text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button onClick={generate} disabled={loading} className="h-12 w-full gap-2 rounded-2xl text-base font-bold">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
            {loading ? "Generating…" : "Generate tasks"}
          </Button>
        </div>
      </Card>

      {generated && generated.length > 0 && (
        <Card className="rounded-3xl border-border bg-card/50 p-6 shadow-sm sm:p-8">
          <h4 className="mb-4 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Just added
          </h4>
          <ul className="space-y-2">
            {generated.map((t) => (
              <li key={t.id} className="flex items-center gap-3 rounded-xl border border-border bg-background/60 px-4 py-3">
                <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                <span className="min-w-0 flex-1 truncate text-sm font-bold text-foreground">
                  {t.title || t.description}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
