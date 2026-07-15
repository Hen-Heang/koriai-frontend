"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"

import { recoveryApi } from "@/lib/api"
import { getUserId } from "@/lib/auth-store"
import { daysSinceLastEvent, lastEventTimestamp, ratePlan, rodeOutCount, type PlanOutcome } from "@/lib/recovery"
import { isDue } from "@/lib/srs"
import { useLogActivity } from "@/hooks/useLogActivity"
import type { RecoveryEventKind } from "@/lib/types"

export const recoveryHabitsQueryKey = (userId?: string | null) => ["recovery", "habits", userId] as const
export const recoveryTriggersQueryKey = (userId?: string | null) => ["recovery", "triggers", userId] as const
export const recoveryEventsQueryKey = (habitId?: string | null) => ["recovery", "events", habitId] as const
export const recoveryPlansQueryKey = (habitId?: string | null) => ["recovery", "plans", habitId] as const

// Triggers are global per user (not per-habit) — the same "after a stressful
// meeting" trigger can apply across habits, so it's one flat, reusable list.
export function useRecoveryTriggers() {
  const userId = getUserId()
  const queryClient = useQueryClient()
  const key = recoveryTriggersQueryKey(userId)

  const { data, isPending, isError } = useQuery({
    queryKey: key,
    queryFn: recoveryApi.getTriggers,
    enabled: userId != null,
  })

  const addTrigger = async (label: string) => {
    const trigger = await recoveryApi.addTrigger(label)
    await queryClient.invalidateQueries({ queryKey: key })
    return trigger
  }

  const updateTrigger = async (id: string, label: string) => {
    const trigger = await recoveryApi.updateTrigger(id, label)
    await queryClient.invalidateQueries({ queryKey: key })
    return trigger
  }

  const deleteTrigger = async (id: string) => {
    await recoveryApi.removeTrigger(id)
    await queryClient.invalidateQueries({ queryKey: key })
  }

  return {
    triggers: data ?? [],
    loading: isPending,
    error: isError ? "Failed to load triggers." : "",
    addTrigger,
    updateTrigger,
    deleteTrigger,
  }
}

// Phase 1 UI works with one habit at a time: whichever is active. If the
// user ever tracks more than one, callers can switch which id they pass to
// useRecoveryEvents/useRecoveryPlans — the query keys are already habit-scoped.
export function useRecoveryHabits() {
  const userId = getUserId()
  const queryClient = useQueryClient()
  const key = recoveryHabitsQueryKey(userId)

  const { data, isPending, isError } = useQuery({
    queryKey: key,
    queryFn: recoveryApi.getHabits,
    enabled: userId != null,
  })

  const habits = data ?? []
  const activeHabit = habits.find((h) => h.active) ?? null

  const addHabit = async (input: { label: string; replacementBehavior?: string }) => {
    const habit = await recoveryApi.addHabit(input)
    await queryClient.invalidateQueries({ queryKey: key })
    return habit
  }

  const updateHabit = async (
    id: string,
    data: { label?: string; replacementBehavior?: string | null; active?: boolean },
  ) => {
    const habit = await recoveryApi.updateHabit(id, data)
    await queryClient.invalidateQueries({ queryKey: key })
    return habit
  }

  const deleteHabit = async (id: string) => {
    await recoveryApi.removeHabit(id)
    await queryClient.invalidateQueries({ queryKey: key })
  }

  return {
    habits,
    activeHabit,
    loading: isPending,
    error: isError ? "Failed to load habits." : "",
    addHabit,
    updateHabit,
    deleteHabit,
  }
}

export function useRecoveryEvents(habitId: string | null) {
  const queryClient = useQueryClient()
  const key = recoveryEventsQueryKey(habitId)
  const { logActivity } = useLogActivity("recovery")

  const { data, isPending, isError } = useQuery({
    queryKey: key,
    queryFn: () => recoveryApi.getEvents(habitId as string),
    enabled: habitId != null,
  })

  const events = data ?? []
  const lastSlip = [...events]
    .filter((e) => e.kind === "slip")
    .sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1))[0]

  const logEvent = async (input: {
    kind: RecoveryEventKind
    intensity?: number
    triggerId?: string
    emotion?: string
    actionTaken?: string
    rodeOut?: boolean
    note?: string
  }) => {
    if (!habitId) throw new Error("No active habit")
    const event = await recoveryApi.logEvent(habitId, input)
    await queryClient.invalidateQueries({ queryKey: key })
    void logActivity()
    return event
  }

  const annotateEvent = async (id: string, note: string) => {
    const event = await recoveryApi.updateEventNote(id, note)
    await queryClient.invalidateQueries({ queryKey: key })
    return event
  }

  const updateEvent = async (
    id: string,
    data: { intensity?: number; triggerId?: string | null; emotion?: string | null; rodeOut?: boolean; note?: string | null },
  ) => {
    const event = await recoveryApi.updateEvent(id, data)
    await queryClient.invalidateQueries({ queryKey: key })
    return event
  }

  const deleteEvent = async (id: string) => {
    await recoveryApi.removeEvent(id)
    await queryClient.invalidateQueries({ queryKey: key })
  }

  return {
    events,
    daysSinceLastEvent: daysSinceLastEvent(events),
    lastEventAt: lastEventTimestamp(events),
    rodeOutCount: rodeOutCount(events),
    lastSlipAt: lastSlip?.occurredAt ?? null,
    loading: isPending,
    error: isError ? "Failed to load check-ins." : "",
    logEvent,
    annotateEvent,
    updateEvent,
    deleteEvent,
  }
}

export function useRecoveryPlans(habitId: string | null) {
  const queryClient = useQueryClient()
  const key = recoveryPlansQueryKey(habitId)
  const { logActivity } = useLogActivity("recovery")

  const { data, isPending, isError } = useQuery({
    queryKey: key,
    queryFn: () => recoveryApi.getPlans(habitId as string),
    enabled: habitId != null,
  })

  const plans = data ?? []
  const duePlans = plans.filter((p) => isDue(p.nextReview))

  const addPlan = async (input: { ifText: string; thenText: string; sourceEventId?: string }) => {
    if (!habitId) throw new Error("No active habit")
    const plan = await recoveryApi.addPlan(habitId, input)
    await queryClient.invalidateQueries({ queryKey: key })
    return plan
  }

  // Runs the plan through the PlanOutcome -> ReviewRating adapter (lib/recovery.ts)
  // then persists the resulting SRS state via recoveryApi.ratePlan.
  const reviewPlan = async (id: string, outcome: PlanOutcome) => {
    const plan = plans.find((p) => p.id === id)
    if (!plan) throw new Error("Plan not found")
    const next = ratePlan(plan, outcome)
    const updated = await recoveryApi.ratePlan(id, next)
    await queryClient.invalidateQueries({ queryKey: key })
    void logActivity()
    return updated
  }

  const updatePlan = async (id: string, data: { ifText?: string; thenText?: string }) => {
    const plan = await recoveryApi.updatePlan(id, data)
    await queryClient.invalidateQueries({ queryKey: key })
    return plan
  }

  const deletePlan = async (id: string) => {
    await recoveryApi.removePlan(id)
    await queryClient.invalidateQueries({ queryKey: key })
  }

  return {
    plans,
    duePlans,
    loading: isPending,
    error: isError ? "Failed to load plans." : "",
    addPlan,
    reviewPlan,
    updatePlan,
    deletePlan,
  }
}
