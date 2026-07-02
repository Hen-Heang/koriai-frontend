"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { notesApi, type NoteInput, type NoteMeta } from "@/lib/api"
import { getUserId } from "@/lib/auth-store"

export const notesQueryKey = (userId?: string | null) => ["notes", userId] as const
export const noteQueryKey = (slug: string) => ["note", slug] as const

// List of note metadata for the library/index page.
export function useNotes() {
  const userId = getUserId()
  const { data, isPending, isError } = useQuery({
    queryKey: notesQueryKey(userId),
    queryFn: notesApi.list,
    enabled: userId != null,
  })

  return {
    notes: (data ?? []) as NoteMeta[],
    loading: isPending,
    error: isError ? "Failed to load notes." : "",
  }
}

// Single note (content + meta) for the reader/editor.
export function useNote(slug: string) {
  const { data, isPending, isError } = useQuery({
    queryKey: noteQueryKey(slug),
    queryFn: () => notesApi.get(slug),
    enabled: Boolean(slug),
  })

  return {
    note: data ?? null,
    loading: isPending,
    error: isError ? "Note not found." : "",
  }
}

export function useNoteMutations() {
  const queryClient = useQueryClient()
  const userId = getUserId()
  const invalidateList = () =>
    queryClient.invalidateQueries({ queryKey: notesQueryKey(userId) })

  const create = useMutation({
    mutationFn: (data: NoteInput) => notesApi.create(data),
    onSuccess: () => invalidateList(),
  })

  const update = useMutation({
    mutationFn: ({ slug, data }: { slug: string; data: Partial<NoteInput> }) =>
      notesApi.update(slug, data),
    onSuccess: (_res, { slug }) => {
      invalidateList()
      queryClient.invalidateQueries({ queryKey: noteQueryKey(slug) })
    },
  })

  const remove = useMutation({
    mutationFn: (slug: string) => notesApi.remove(slug),
    onSuccess: () => invalidateList(),
  })

  return { create, update, remove }
}
