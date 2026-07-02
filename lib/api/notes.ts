import { supabase } from "@/lib/supabase"
import { requireUserId } from "@/lib/auth-store"

// Study notes (markdown) over kori_notes, keyed by (user, slug).

export interface NoteMeta {
  id?: string
  slug: string
  title: string
  description: string
  icon: string
  category?: string
  tags?: string[]
  updatedAt?: string
}

export interface Note extends NoteMeta {
  content: string
}

export interface NoteInput {
  slug: string
  title: string
  description?: string
  category?: string
  content: string
  icon?: string
  tags?: string[]
}

type NoteRow = {
  id: string
  slug: string
  title: string
  description: string
  icon: string
  category: string | null
  tags: string[]
  content: string
  updated_at: string
}

function toMeta(row: NoteRow): NoteMeta {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    icon: row.icon,
    category: row.category ?? undefined,
    tags: row.tags ?? [],
    updatedAt: row.updated_at,
  }
}

function toNote(row: NoteRow): Note {
  return { ...toMeta(row), content: row.content }
}

export const notesApi = {
  list: async (): Promise<NoteMeta[]> => {
    const { data, error } = await supabase
      .from("kori_notes")
      .select("id, slug, title, description, icon, category, tags, updated_at")
      .order("updated_at", { ascending: false })
    if (error) throw error
    return (data as unknown as NoteRow[]).map(toMeta)
  },

  get: async (slug: string): Promise<Note> => {
    const { data, error } = await supabase
      .from("kori_notes")
      .select("*")
      .eq("slug", slug)
      .single()
    if (error) throw error
    return toNote(data as NoteRow)
  },

  create: async (data: NoteInput): Promise<Note> => {
    const userId = requireUserId()
    const { data: row, error } = await supabase
      .from("kori_notes")
      .insert({
        user_id: userId,
        slug: data.slug,
        title: data.title,
        description: data.description ?? "",
        category: data.category ?? null,
        content: data.content,
        icon: data.icon ?? "FileText",
        tags: data.tags ?? [],
      })
      .select()
      .single()
    if (error) throw error
    return toNote(row as NoteRow)
  },

  update: async (slug: string, data: Partial<NoteInput>): Promise<Note> => {
    const { data: row, error } = await supabase
      .from("kori_notes")
      .update({
        ...(data.slug !== undefined ? { slug: data.slug } : {}),
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.category !== undefined ? { category: data.category } : {}),
        ...(data.content !== undefined ? { content: data.content } : {}),
        ...(data.icon !== undefined ? { icon: data.icon } : {}),
        ...(data.tags !== undefined ? { tags: data.tags } : {}),
      })
      .eq("slug", slug)
      .select()
      .single()
    if (error) throw error
    return toNote(row as NoteRow)
  },

  remove: async (slug: string) => {
    const { error } = await supabase.from("kori_notes").delete().eq("slug", slug)
    if (error) throw error
  },
}

/* ── Spring backend implementation (kept for later restore) ──────────────────
import { api } from "./client"

export const notesApi = {
  list: () => api.get("/notes").then((r) => r.data.data),
  get: (slug: string) => api.get(`/notes/${encodeURIComponent(slug)}`).then((r) => r.data.data),
  create: (data: NoteInput) => api.post("/notes", data).then((r) => r.data.data),
  update: (slug: string, data: Partial<NoteInput>) => api.put(`/notes/${encodeURIComponent(slug)}`, data).then((r) => r.data.data),
  remove: (slug: string) => api.delete(`/notes/${encodeURIComponent(slug)}`).then((r) => r.data.data),
}
────────────────────────────────────────────────────────────────────────────── */
