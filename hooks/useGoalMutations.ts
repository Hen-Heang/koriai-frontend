"use client"

import { useState } from "react"
import { toast } from "sonner"

import { goalsApi, getApiErrorMessage } from "@/lib/api"
import { getUserId } from "@/lib/auth-store"
import type { Goal, GoalMetadata } from "@/lib/goals"

// Combines Orbit's useCreateGoal + useUpdateGoal over the api layer. Supabase
// inserts/RPC and AI task-generation are dropped; AI generation is a deferred
// seam (see INTEGRATION.md) surfaced via the `generateTasksWithAI` flag, which
// currently no-ops with a toast rather than silently disappearing.

export interface CreateGoalPayload {
  title: string
  description?: string
  target_date?: Date | null
  no_duration?: boolean
  start_date?: Date
  metadata: GoalMetadata
}

export interface UpdateGoalPayload {
  title: string
  description: string
  target_date?: Date | null
  no_duration?: boolean
  start_date?: Date
  metadata: GoalMetadata
}

export interface GoalMutationOptions {
  generateTasksWithAI?: boolean
  aiPrompt?: string
  requestedTaskCount?: number
}

const toDateOnly = (d?: Date | null) =>
  d && !isNaN(d.getTime()) ? d.toISOString().split("T")[0] : null

// AI task generation seam — re-enable when the AI backend is wired (deferred).
function notifyAiSeam(options: GoalMutationOptions) {
  if (options.generateTasksWithAI) {
    toast.info("AI task generation is coming soon", {
      description: "Your goal was saved. Add tasks manually for now.",
    })
  }
}

export function useCreateGoal() {
  const [isLoading, setIsLoading] = useState(false)

  const createGoal = async (
    payload: CreateGoalPayload,
    options: GoalMutationOptions = {}
  ): Promise<{ success: boolean; goal?: Goal; error?: string }> => {
    setIsLoading(true)
    try {
      if (getUserId() == null) throw new Error("No authenticated user found")

      const metadata: GoalMetadata = {
        version: 1,
        ...payload.metadata,
        start_date: payload.start_date
          ? toDateOnly(payload.start_date) ?? undefined
          : payload.metadata.start_date,
      }

      const goal = await goalsApi.create({
        title: payload.title,
        description: payload.description || "",
        target_date: payload.no_duration ? null : toDateOnly(payload.target_date),
        no_duration: payload.no_duration ?? !payload.target_date,
        status: "active",
        metadata,
      })

      notifyAiSeam(options)
      toast.success("Success!", { description: "Your goal has been created." })
      return { success: true, goal }
    } catch (error) {
      const message = getApiErrorMessage(error, "Could not create goal")
      console.error("Error creating goal:", error)
      toast.error("Error creating goal", { description: message })
      return { success: false, error: message }
    } finally {
      setIsLoading(false)
    }
  }

  return { createGoal, isLoading }
}

export function useUpdateGoal() {
  const [isLoading, setIsLoading] = useState(false)

  const updateGoal = async (
    goalId: string,
    payload: UpdateGoalPayload,
    options: GoalMutationOptions = {}
  ): Promise<{ success: boolean; goal?: Goal; message?: string }> => {
    setIsLoading(true)
    try {
      const metadata: GoalMetadata = {
        version: 1,
        ...payload.metadata,
        start_date: payload.start_date
          ? toDateOnly(payload.start_date) ?? undefined
          : payload.metadata.start_date,
      }

      const goal = await goalsApi.update(goalId, {
        title: payload.title,
        description: payload.description || "",
        target_date: payload.no_duration ? null : toDateOnly(payload.target_date),
        no_duration: !!payload.no_duration,
        metadata,
      })

      notifyAiSeam(options)
      toast.success("Success!", { description: "Your goal has been updated." })
      return { success: true, goal }
    } catch (error) {
      const message = getApiErrorMessage(error, "Failed to update goal. Please try again.")
      console.error("Error updating goal:", error)
      toast.error("Error", { description: message })
      return { success: false, message }
    } finally {
      setIsLoading(false)
    }
  }

  return { updateGoal, isLoading }
}
