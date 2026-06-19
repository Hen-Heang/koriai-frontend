"use client"

import { useState } from "react"
import { Pencil, Trash2, Loader2, AlertTriangle } from "lucide-react"

interface NoteActionsProps {
  onEdit: () => void
  onDelete: () => Promise<void> | void
}

export function NoteActions({ onEdit, onDelete }: NoteActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete()
    } catch (err) {
      console.error(err)
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3">
        <AlertTriangle size={16} className="text-red-500" />
        <span className="text-xs font-bold text-red-600 dark:text-red-300">Delete this note?</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowConfirm(false)}
            className="rounded-lg bg-accent px-3 py-1 text-[10px] font-bold text-muted-foreground transition-colors hover:bg-accent/70"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded-lg bg-red-600 px-3 py-1 text-[10px] font-bold text-white shadow-lg transition-all hover:bg-red-500"
          >
            {isDeleting ? <Loader2 size={12} className="animate-spin" /> : "Delete"}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onEdit}
        className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-bold text-muted-foreground transition-all hover:border-blue-500/50 hover:text-blue-600 dark:hover:text-blue-400"
      >
        <Pencil size={14} />
        Edit
      </button>
      <button
        onClick={() => setShowConfirm(true)}
        className="rounded-xl border border-border bg-card p-1.5 text-muted-foreground transition-all hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-500"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}
