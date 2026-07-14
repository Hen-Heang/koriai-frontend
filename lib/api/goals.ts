// ── Goal tracking (ported from Orbit / DailyGoalMap) ─────────────────────────
// Back on Orbit's original Supabase tables (goals / tasks / goal_members /
// goal_stars / notifications) and SECURITY DEFINER RPCs, since KoriAI now shares
// the Orbit Supabase project. Scoping comes from RLS + auth.uid().
import type { Goal } from "@/lib/goals"
import type { Task } from "@/lib/tasks"
import { supabase } from "@/lib/supabase"
import { getUserId, requireUserId } from "@/lib/auth-store"
import { aiPost, authHeaders } from "./ai-client"
import { readSseStream } from "./sse"

export interface CreateGoalPayload {
  title: string
  description?: string
  target_date?: string | null
  no_duration?: boolean
  status?: string
  metadata: Goal["metadata"]
}

export type UpdateGoalPayload = Partial<CreateGoalPayload>

// Goal member (camelCase, shape kept from the Spring GoalMemberResponse; ids are
// Supabase auth UUIDs now).
export interface GoalMemberDto {
  id: string
  goalId: string
  userId: string
  role: "creator" | "member" | string
  displayName: string | null
  email: string | null
  joinedAt: string | null
  lastSeen: string | null
}

type GoalRow = Goal & {
  goal_stars?: { user_id: string }[]
  tasks?: { id: string; completed: boolean }[]
}

// Nested selects → isStarred / taskCounts enrichment in one query.
const GOAL_SELECT = "*, goal_stars(user_id), tasks(id, completed)"

function enrichGoal(row: GoalRow): Goal {
  const me = getUserId()
  const { goal_stars, tasks, ...goal } = row
  const total = tasks?.length ?? 0
  const completed = tasks?.filter((t) => t.completed).length ?? 0
  return {
    ...goal,
    isStarred: Boolean(goal_stars?.some((s) => s.user_id === me)),
    taskCounts: { total, completed, incomplete: total - completed },
  } as Goal
}

export const goalsApi = {
  list: async (status?: string): Promise<Goal[]> => {
    let query = supabase.from("goals").select(GOAL_SELECT).order("created_at", { ascending: false })
    if (status) query = query.eq("status", status)
    const { data, error } = await query
    if (error) throw error
    return (data as unknown as GoalRow[]).map(enrichGoal)
  },

  get: async (id: string): Promise<Goal> => {
    const { data, error } = await supabase.from("goals").select(GOAL_SELECT).eq("id", id).single()
    if (error) throw error
    return enrichGoal(data as unknown as GoalRow)
  },

  create: async (data: CreateGoalPayload): Promise<Goal> => {
    const userId = requireUserId()
    const { data: row, error } = await supabase
      .from("goals")
      .insert({
        user_id: userId,
        title: data.title,
        description: data.description ?? "",
        target_date: data.target_date ?? null,
        no_duration: data.no_duration ?? false,
        status: data.status ?? "active",
        metadata: data.metadata,
      })
      .select()
      .single()
    if (error) throw error
    // Creator membership row (used by the members list / shared goals).
    const { error: joinError } = await supabase.rpc("join_goal", {
      p_goal_id: row.id,
      p_user_id: userId,
      p_role: "creator",
    })
    if (joinError) throw joinError
    return goalsApi.get(row.id)
  },

  update: async (id: string, data: UpdateGoalPayload): Promise<Goal> => {
    const { error } = await supabase
      .from("goals")
      .update({
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.target_date !== undefined ? { target_date: data.target_date } : {}),
        ...(data.no_duration !== undefined ? { no_duration: data.no_duration } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.metadata !== undefined ? { metadata: data.metadata } : {}),
      })
      .eq("id", id)
    if (error) throw error
    return goalsApi.get(id)
  },

  remove: async (id: string) => {
    const { error } = await supabase.from("goals").delete().eq("id", id)
    if (error) throw error
  },

  // Share-link / join-by-code — Orbit's SECURITY DEFINER RPCs (they can read a
  // goal the caller isn't a member of yet).
  previewByShareCode: async (code: string): Promise<Goal> => {
    const { data, error } = await supabase.rpc("get_goal_by_share_code", { p_share_code: code })
    if (error) throw error
    const row = Array.isArray(data) ? data[0] : data
    if (!row) throw new Error("Invalid share code")
    return row as Goal
  },

  joinByShareCode: async (code: string): Promise<Goal> => {
    const goal = await goalsApi.previewByShareCode(code)
    const { error } = await supabase.rpc("join_goal", {
      p_goal_id: goal.id,
      p_user_id: requireUserId(),
      p_role: "member",
    })
    if (error) throw error
    return goalsApi.get(goal.id)
  },

  regenerateShareCode: async (id: string): Promise<{ shareCode: string }> => {
    const { data, error } = await supabase.rpc("regenerate_goal_share_code", { p_goal_id: id })
    if (error) throw error
    const code = Array.isArray(data) ? data[0] : data
    return { shareCode: typeof code === "string" ? code : String(code ?? "") }
  },

  getMembers: async (id: string): Promise<GoalMemberDto[]> => {
    const { data, error } = await supabase.rpc("get_goal_members", { p_goal_id: id })
    if (error) throw error
    type Row = {
      id: string
      goal_id: string
      user_id: string
      role: string
      display_name?: string | null
      email?: string | null
      joined_at?: string | null
      last_seen?: string | null
    }
    return ((data ?? []) as Row[]).map((m) => ({
      id: m.id,
      goalId: m.goal_id,
      userId: m.user_id,
      role: m.role,
      displayName: m.display_name ?? null,
      email: m.email ?? null,
      joinedAt: m.joined_at ?? null,
      lastSeen: m.last_seen ?? null,
    }))
  },

  leaveGoal: async (id: string) => {
    const { error } = await supabase
      .from("goal_members")
      .delete()
      .eq("goal_id", id)
      .eq("user_id", requireUserId())
    if (error) throw error
  },

  removeMember: async (id: string, userId: string) => {
    const { data: member, error } = await supabase
      .from("goal_members")
      .select("id")
      .eq("goal_id", id)
      .eq("user_id", userId)
      .maybeSingle()
    if (error) throw error
    if (!member) return
    const { error: rpcError } = await supabase.rpc("remove_goal_member", { p_member_id: member.id })
    if (rpcError) throw rpcError
  },

  toggleStar: async (id: string): Promise<{ isStarred: boolean }> => {
    const userId = requireUserId()
    const { data: existing, error } = await supabase
      .from("goal_stars")
      .select("goal_id")
      .eq("goal_id", id)
      .eq("user_id", userId)
      .maybeSingle()
    if (error) throw error
    if (existing) {
      const { error: delError } = await supabase
        .from("goal_stars")
        .delete()
        .eq("goal_id", id)
        .eq("user_id", userId)
      if (delError) throw delError
      return { isStarred: false }
    }
    const { error: insError } = await supabase
      .from("goal_stars")
      .insert({ goal_id: id, user_id: userId })
    if (insError) throw insError
    return { isStarred: true }
  },

  getTasks: async (id: string): Promise<Task[]> => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("goal_id", id)
      .order("start_date", { ascending: true })
    if (error) throw error
    return data as Task[]
  },

  // AI-generate tasks for a goal (server AI key via app/api/ai); inserts and
  // returns the created tasks.
  generateTasks: async (id: string, body?: { count?: number; note?: string }): Promise<Task[]> => {
    const userId = requireUserId()
    const goal = await goalsApi.get(id)
    const { tasks } = await aiPost<{
      tasks: Array<{
        title: string
        description?: string
        start_date: string
        end_date: string
        duration_minutes?: number | null
      }>
    }>("/goals/generate-tasks", {
      goalTitle: goal.title,
      goalDescription: goal.description,
      targetDate: goal.target_date,
      metadata: goal.metadata,
      count: body?.count,
      note: body?.note,
    })
    const { data, error } = await supabase
      .from("tasks")
      .insert(
        tasks.map((t) => ({
          user_id: userId,
          goal_id: id,
          title: t.title,
          description: t.description ?? "",
          start_date: t.start_date,
          end_date: t.end_date,
          duration_minutes: t.duration_minutes ?? null,
        })),
      )
      .select()
    if (error) throw error
    return data as Task[]
  },

  // Per-goal AI coach chat — SSE stream from the Next.js route (same
  // token / done / error event protocol the Spring stream used).
  coachStream: async (
    id: string,
    message: string,
    history: { role: "user" | "assistant"; content: string }[],
    onToken: (token: string) => void,
    onDone: () => void,
    signal?: AbortSignal,
  ): Promise<void> => {
    const response = await fetch(`/api/ai/goals/coach`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify({ goalId: id, message, history }),
      signal,
    })
    if (!response.ok) throw new Error(`Coach stream failed: ${response.status}`)

    await readSseStream(response, (event, raw) => {
      if (event === "token") {
        try {
          onToken(JSON.parse(raw).token)
        } catch {
          /* ignore malformed chunk */
        }
      } else if (event === "done") {
        onDone()
      } else if (event === "error") {
        let msg = "Coach is unavailable right now."
        try {
          msg = JSON.parse(raw).message || msg
        } catch {
          /* ignore */
        }
        throw new Error(msg)
      }
    })
  },

  // Sends a goal invitation: a pending row in Orbit's notifications table that
  // the receiver answers via notificationsApi.respond.
  invite: async (id: string, receiverId: string) => {
    const { error } = await supabase.from("notifications").insert({
      type: "goal_invitation",
      goal_id: id,
      sender_id: requireUserId(),
      receiver_id: receiverId,
      invitation_status: "pending",
    })
    if (error) throw error
  },
}

export interface CreateTaskPayload {
  title?: string
  description?: string
  goal_id?: string | null
  start_date: string
  end_date: string
  daily_start_time?: string | null
  daily_end_time?: string | null
  is_anytime?: boolean | null
  duration_minutes?: number | null
  color?: string | null
  tags?: string[]
  completed?: boolean
}

export type UpdateTaskPayload = Partial<CreateTaskPayload>

export const tasksApi = {
  // Range query backs both the calendar and the "today" widget.
  // goalId omitted = all the user's tasks; goalId null = personal tasks only.
  range: async (params: { from?: string; to?: string; goalId?: string | null }): Promise<Task[]> => {
    let query = supabase.from("tasks").select("*").order("start_date", { ascending: true })
    if (params.from) query = query.gte("end_date", params.from)
    if (params.to) query = query.lte("start_date", params.to)
    if (params.goalId === null) query = query.is("goal_id", null)
    else if (params.goalId) query = query.eq("goal_id", params.goalId)
    const { data, error } = await query
    if (error) throw error
    return data as Task[]
  },

  create: async (data: CreateTaskPayload): Promise<Task> => {
    const { data: row, error } = await supabase
      .from("tasks")
      .insert({ user_id: requireUserId(), ...data })
      .select()
      .single()
    if (error) throw error
    return row as Task
  },

  update: async (id: string, data: UpdateTaskPayload): Promise<Task> => {
    const { data: row, error } = await supabase
      .from("tasks")
      .update({ ...data, updated_by: getUserId() })
      .eq("id", id)
      .select()
      .single()
    if (error) throw error
    return row as Task
  },

  remove: async (id: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id)
    if (error) throw error
  },
}

// Goal notifications over Orbit's notifications table; the enriched feed
// (sender display name, goal title) comes from Orbit's RPC.
export interface GoalNotification {
  id: string
  type: string
  goalId: string | null
  senderId: string | null
  receiverId: string | null
  invitationStatus: string | null
  read: boolean
  url: string | null
  senderDisplayName: string | null
  goalTitle: string | null
  createdAt: string | null
}

export const notificationsApi = {
  list: async (onlyUnread = false): Promise<GoalNotification[]> => {
    const { data, error } = await supabase.rpc("get_enriched_notifications", {
      p_user_id: requireUserId(),
      p_limit: 50,
      p_before: null,
      p_only_unread: onlyUnread,
      p_only_invites: false,
    })
    if (error) throw error
    type Row = {
      id: string
      type: string
      goal_id: string | null
      sender_id: string | null
      receiver_id: string | null
      invitation_status: string | null
      read_at: string | null
      url: string | null
      sender_display_name?: string | null
      goal_title?: string | null
      created_at: string | null
    }
    return ((data ?? []) as Row[]).map((n) => ({
      id: n.id,
      type: n.type,
      goalId: n.goal_id,
      senderId: n.sender_id,
      receiverId: n.receiver_id,
      invitationStatus: n.invitation_status,
      read: Boolean(n.read_at),
      url: n.url,
      senderDisplayName: n.sender_display_name ?? null,
      goalTitle: n.goal_title ?? null,
      createdAt: n.created_at,
    }))
  },

  markRead: async (id: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id)
    if (error) throw error
  },

  respond: async (id: string, accept: boolean) => {
    const { data: notification, error } = await supabase
      .from("notifications")
      .select("goal_id")
      .eq("id", id)
      .single()
    if (error) throw error
    const { error: updateError } = await supabase
      .from("notifications")
      .update({
        invitation_status: accept ? "accepted" : "declined",
        read_at: new Date().toISOString(),
      })
      .eq("id", id)
    if (updateError) throw updateError
    if (accept && notification.goal_id) {
      const { error: joinError } = await supabase.rpc("join_goal", {
        p_goal_id: notification.goal_id,
        p_user_id: requireUserId(),
        p_role: "member",
      })
      if (joinError) throw joinError
    }
  },
}
