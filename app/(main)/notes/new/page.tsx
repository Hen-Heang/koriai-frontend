"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { toast } from "sonner"
import { NoteEditor, type NoteEditorValues } from "@/components/notes/NoteEditor"
import { useNoteMutations } from "@/hooks/useNotes"

const EMPTY: NoteEditorValues = {
  slug: "",
  title: "",
  description: "",
  icon: "common",
  content: "# New note\n\nStart writing in **markdown**.\n",
}

export default function NewNotePage() {
  const router = useRouter()
  const { create } = useNoteMutations()

  const handleSave = async (values: NoteEditorValues) => {
    await create.mutateAsync({
      slug: values.slug,
      title: values.title,
      description: values.description,
      icon: values.icon,
      category: values.icon,
      content: values.content,
      tags: values.icon ? [values.icon] : [],
    })
    toast.success("Note created")
    router.push(`/notes/${values.slug}`)
  }

  return (
    <div className="mx-auto max-w-4xl py-4 sm:py-8">
      <Link
        href="/notes"
        className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft size={14} />
        All notes
      </Link>
      <NoteEditor
        mode="create"
        initial={EMPTY}
        onSave={handleSave}
        onCancel={() => router.push("/notes")}
      />
    </div>
  )
}
