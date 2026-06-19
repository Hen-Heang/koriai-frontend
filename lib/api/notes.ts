import { api } from "./client"

// Study notes (markdown) backed by the Spring Boot backend. Mirrors the other
// domain services: every call unwraps the envelope with `r.data.data`.
//
// Expected backend endpoints (all under NEXT_PUBLIC_API_BASE_URL):
//   GET    /notes            → NoteMeta[]
//   GET    /notes/{slug}     → Note
//   POST   /notes            → Note            (body: NoteInput)
//   PUT    /notes/{slug}     → Note            (body: NoteInput)
//   DELETE /notes/{slug}     → void

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

export const notesApi = {
  list: () => api.get("/notes").then((r) => r.data.data) as Promise<NoteMeta[]>,
  get: (slug: string) =>
    api.get(`/notes/${encodeURIComponent(slug)}`).then((r) => r.data.data) as Promise<Note>,
  create: (data: NoteInput) =>
    api.post("/notes", data).then((r) => r.data.data) as Promise<Note>,
  update: (slug: string, data: Partial<NoteInput>) =>
    api.put(`/notes/${encodeURIComponent(slug)}`, data).then((r) => r.data.data) as Promise<Note>,
  remove: (slug: string) =>
    api.delete(`/notes/${encodeURIComponent(slug)}`).then((r) => r.data.data),
}
