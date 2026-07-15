import type { RecoveryEvent, RecoveryEventKind, RecoveryHabit, RecoveryPlan, RecoveryTrigger } from "@/lib/types"
import { supabase } from "@/lib/supabase"
import { requireUserId } from "@/lib/auth-store"

// Recovery over kori_focus_*. The table names predate the Growth-workspace
// rename (Focus -> Recovery) and hold live user data, so they were left
// alone — only the app-facing names changed. All access goes through this
// file — components and hooks never query Supabase directly.

type HabitRow = {
  id: string
  label: string
  replacement_behavior: string | null
  started_at: string
  active: boolean
  created_at: string
}

function toHabit(row: HabitRow): RecoveryHabit {
  return {
    id: row.id,
    label: row.label,
    replacementBehavior: row.replacement_behavior ?? undefined,
    startedAt: row.started_at,
    active: row.active,
    createdAt: row.created_at,
  }
}

type TriggerRow = {
  id: string
  label: string
  created_at: string
}

function toTrigger(row: TriggerRow): RecoveryTrigger {
  return { id: row.id, label: row.label, createdAt: row.created_at }
}

type EventRow = {
  id: string
  habit_id: string
  occurred_at: string
  kind: RecoveryEventKind
  intensity: number | null
  trigger_id: string | null
  emotion: string | null
  action_taken: string | null
  rode_out: boolean | null
  note: string | null
  created_at: string
}

function toEvent(row: EventRow): RecoveryEvent {
  return {
    id: row.id,
    habitId: row.habit_id,
    occurredAt: row.occurred_at,
    kind: row.kind,
    intensity: row.intensity ?? undefined,
    triggerId: row.trigger_id ?? undefined,
    emotion: row.emotion ?? undefined,
    actionTaken: row.action_taken ?? undefined,
    rodeOut: row.rode_out ?? undefined,
    note: row.note ?? undefined,
    createdAt: row.created_at,
  }
}

type PlanRow = {
  id: string
  habit_id: string
  if_text: string
  then_text: string
  source_event_id: string | null
  mastery: number
  next_review: string
  ease_factor: number
  interval_days: number
  repetitions: number
  lapses: number
  created_at: string
}

function toPlan(row: PlanRow): RecoveryPlan {
  return {
    id: row.id,
    habitId: row.habit_id,
    ifText: row.if_text,
    thenText: row.then_text,
    sourceEventId: row.source_event_id ?? undefined,
    mastery: row.mastery,
    nextReview: row.next_review,
    easeFactor: row.ease_factor,
    intervalDays: row.interval_days,
    repetitions: row.repetitions,
    lapses: row.lapses,
    createdAt: row.created_at,
  }
}

export const recoveryApi = {
  getHabits: async (): Promise<RecoveryHabit[]> => {
    const { data, error } = await supabase
      .from("kori_focus_habits")
      .select("*")
      .order("created_at", { ascending: false })
    if (error) throw error
    return (data as HabitRow[]).map(toHabit)
  },

  addHabit: async (data: { label: string; replacementBehavior?: string }): Promise<RecoveryHabit> => {
    const { data: row, error } = await supabase
      .from("kori_focus_habits")
      .insert({
        user_id: requireUserId(),
        label: data.label,
        replacement_behavior: data.replacementBehavior ?? null,
      })
      .select()
      .single()
    if (error) throw error
    return toHabit(row as HabitRow)
  },

  updateHabit: async (
    id: string,
    data: { label?: string; replacementBehavior?: string | null; active?: boolean },
  ): Promise<RecoveryHabit> => {
    const { data: row, error } = await supabase
      .from("kori_focus_habits")
      .update({
        ...(data.label !== undefined ? { label: data.label } : {}),
        ...(data.replacementBehavior !== undefined ? { replacement_behavior: data.replacementBehavior } : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
      })
      .eq("id", id)
      .select()
      .single()
    if (error) throw error
    return toHabit(row as HabitRow)
  },

  removeHabit: async (id: string) => {
    const { error } = await supabase.from("kori_focus_habits").delete().eq("id", id)
    if (error) throw error
    return { deleted: true }
  },

  getTriggers: async (): Promise<RecoveryTrigger[]> => {
    const { data, error } = await supabase
      .from("kori_focus_triggers")
      .select("*")
      .order("created_at", { ascending: false })
    if (error) throw error
    return (data as TriggerRow[]).map(toTrigger)
  },

  addTrigger: async (label: string): Promise<RecoveryTrigger> => {
    const { data: row, error } = await supabase
      .from("kori_focus_triggers")
      .insert({ user_id: requireUserId(), label })
      .select()
      .single()
    if (error) throw error
    return toTrigger(row as TriggerRow)
  },

  updateTrigger: async (id: string, label: string): Promise<RecoveryTrigger> => {
    const { data: row, error } = await supabase
      .from("kori_focus_triggers")
      .update({ label })
      .eq("id", id)
      .select()
      .single()
    if (error) throw error
    return toTrigger(row as TriggerRow)
  },

  removeTrigger: async (id: string) => {
    const { error } = await supabase.from("kori_focus_triggers").delete().eq("id", id)
    if (error) throw error
    return { deleted: true }
  },

  // Most recent events first, for a single habit — daysSinceLastEvent and
  // rodeOutCount (lib/recovery.ts) both take this as input.
  getEvents: async (habitId: string, limit = 200): Promise<RecoveryEvent[]> => {
    const { data, error } = await supabase
      .from("kori_focus_events")
      .select("*")
      .eq("habit_id", habitId)
      .order("occurred_at", { ascending: false })
      .limit(limit)
    if (error) throw error
    return (data as EventRow[]).map(toEvent)
  },

  logEvent: async (
    habitId: string,
    data: {
      kind: RecoveryEventKind
      intensity?: number
      triggerId?: string
      emotion?: string
      actionTaken?: string
      rodeOut?: boolean
      note?: string
    },
  ): Promise<RecoveryEvent> => {
    const { data: row, error } = await supabase
      .from("kori_focus_events")
      .insert({
        user_id: requireUserId(),
        habit_id: habitId,
        kind: data.kind,
        intensity: data.intensity ?? null,
        trigger_id: data.triggerId ?? null,
        emotion: data.emotion ?? null,
        action_taken: data.actionTaken ?? null,
        rode_out: data.rodeOut ?? null,
        note: data.note ?? null,
      })
      .select()
      .single()
    if (error) throw error
    return toEvent(row as EventRow)
  },

  // Attaches the debrief reflection to the slip event it followed, so it
  // isn't lost — the plan (below) is the actionable takeaway, this is context.
  updateEventNote: async (id: string, note: string): Promise<RecoveryEvent> => {
    const { data: row, error } = await supabase
      .from("kori_focus_events")
      .update({ note })
      .eq("id", id)
      .select()
      .single()
    if (error) throw error
    return toEvent(row as EventRow)
  },

  // General edit for a logged event — correcting a mis-tapped intensity,
  // wrong emotion chip, etc. after the fact.
  updateEvent: async (
    id: string,
    data: { intensity?: number; triggerId?: string | null; emotion?: string | null; rodeOut?: boolean; note?: string | null },
  ): Promise<RecoveryEvent> => {
    const { data: row, error } = await supabase
      .from("kori_focus_events")
      .update({
        ...(data.intensity !== undefined ? { intensity: data.intensity } : {}),
        ...(data.triggerId !== undefined ? { trigger_id: data.triggerId } : {}),
        ...(data.emotion !== undefined ? { emotion: data.emotion } : {}),
        ...(data.rodeOut !== undefined ? { rode_out: data.rodeOut } : {}),
        ...(data.note !== undefined ? { note: data.note } : {}),
      })
      .eq("id", id)
      .select()
      .single()
    if (error) throw error
    return toEvent(row as EventRow)
  },

  removeEvent: async (id: string) => {
    const { error } = await supabase.from("kori_focus_events").delete().eq("id", id)
    if (error) throw error
    return { deleted: true }
  },

  getPlans: async (habitId: string): Promise<RecoveryPlan[]> => {
    const { data, error } = await supabase
      .from("kori_focus_plans")
      .select("*")
      .eq("habit_id", habitId)
      .order("next_review", { ascending: true })
    if (error) throw error
    return (data as PlanRow[]).map(toPlan)
  },

  addPlan: async (
    habitId: string,
    data: { ifText: string; thenText: string; sourceEventId?: string },
  ): Promise<RecoveryPlan> => {
    const { data: row, error } = await supabase
      .from("kori_focus_plans")
      .insert({
        user_id: requireUserId(),
        habit_id: habitId,
        if_text: data.ifText,
        then_text: data.thenText,
        source_event_id: data.sourceEventId ?? null,
      })
      .select()
      .single()
    if (error) throw error
    return toPlan(row as PlanRow)
  },

  // Edits the plan's own wording — distinct from ratePlan, which only
  // touches SRS scheduling fields after a rehearsal.
  updatePlan: async (id: string, data: { ifText?: string; thenText?: string }): Promise<RecoveryPlan> => {
    const { data: row, error } = await supabase
      .from("kori_focus_plans")
      .update({
        ...(data.ifText !== undefined ? { if_text: data.ifText } : {}),
        ...(data.thenText !== undefined ? { then_text: data.thenText } : {}),
      })
      .eq("id", id)
      .select()
      .single()
    if (error) throw error
    return toPlan(row as PlanRow)
  },

  removePlan: async (id: string) => {
    const { error } = await supabase.from("kori_focus_plans").delete().eq("id", id)
    if (error) throw error
    return { deleted: true }
  },

  // Applies an SRS grading result (from lib/recovery.ts's rating adapter over
  // lib/srs.ts) to a plan after the user rehearses it.
  ratePlan: async (
    id: string,
    next: { easeFactor: number; intervalDays: number; repetitions: number; lapses: number; mastery: number; nextReview: string },
  ): Promise<RecoveryPlan> => {
    const { data: row, error } = await supabase
      .from("kori_focus_plans")
      .update({
        ease_factor: next.easeFactor,
        interval_days: next.intervalDays,
        repetitions: next.repetitions,
        lapses: next.lapses,
        mastery: next.mastery,
        next_review: next.nextReview,
      })
      .eq("id", id)
      .select()
      .single()
    if (error) throw error
    return toPlan(row as PlanRow)
  },
}
