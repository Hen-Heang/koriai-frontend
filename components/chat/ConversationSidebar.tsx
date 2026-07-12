"use client"

import { useState } from "react"
import { formatDistanceToNowStrict } from "date-fns"
import { Check, MessageSquare, PanelLeftClose, Pencil, Plus, Trash2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { Conversation } from "@/hooks/useConversations"
import { cn } from "@/lib/utils"

interface ConversationSidebarProps {
  conversations: Conversation[]
  isLoading: boolean
  activeId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  isStartingNew?: boolean
  onRename: (id: string, title: string) => void
  onDelete: (id: string) => void
  /** When provided, renders a collapse button (desktop rail only). */
  onCollapse?: () => void
}

export function ConversationSidebar({
  conversations,
  isLoading,
  activeId,
  onSelect,
  onNew,
  isStartingNew,
  onRename,
  onDelete,
  onCollapse,
}: ConversationSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState("")
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const startEdit = (c: Conversation) => {
    setConfirmId(null)
    setEditingId(c.id)
    setEditingValue(c.title)
  }

  const commitEdit = () => {
    if (editingId !== null) onRename(editingId, editingValue)
    setEditingId(null)
    setEditingValue("")
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between px-3 py-3">
        <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Chats
        </h2>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={onNew}
            disabled={isStartingNew}
            title="New chat"
            className="h-8 w-8 rounded-lg border border-border/60 bg-background/50 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Plus size={16} strokeWidth={2.5} />
          </Button>
          {onCollapse && (
            <Button
              size="icon"
              variant="ghost"
              onClick={onCollapse}
              title="Hide history"
              className="h-8 w-8 rounded-lg text-muted-foreground/60 hover:bg-accent hover:text-foreground"
            >
              <PanelLeftClose size={16} strokeWidth={2.5} />
            </Button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 pb-3">
        {isLoading ? (
          <div className="space-y-2 px-1 pt-1">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        ) : conversations.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs font-medium text-muted-foreground">
            No chats yet. Start a new one.
          </p>
        ) : (
          conversations.map((c) => {
            const active = c.id === activeId
            if (editingId === c.id) {
              return (
                <div key={c.id} className="flex items-center gap-1 px-1">
                  <input
                    autoFocus
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitEdit()
                      if (e.key === "Escape") {
                        setEditingId(null)
                        setEditingValue("")
                      }
                    }}
                    className="min-w-0 flex-1 rounded-lg border border-blue-500/40 bg-background px-2 py-1.5 text-sm font-medium outline-none"
                  />
                  <button
                    type="button"
                    onClick={commitEdit}
                    aria-label="Save"
                    className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-500/10"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null)
                      setEditingValue("")
                    }}
                    aria-label="Cancel"
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent"
                  >
                    <X size={16} />
                  </button>
                </div>
              )
            }

            return (
              <div
                key={c.id}
                className={cn(
                  "group/conv flex items-center gap-1 rounded-xl px-1 transition-colors",
                  active ? "bg-blue-500/10" : "hover:bg-accent/50"
                )}
              >
                <button
                  type="button"
                  onClick={() => onSelect(c.id)}
                  className="flex min-w-0 flex-1 items-center gap-2.5 px-2 py-2.5 text-left"
                >
                  <MessageSquare
                    size={15}
                    className={cn(
                      "shrink-0",
                      active ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground/40"
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block truncate text-sm font-semibold",
                        active ? "text-foreground" : "text-foreground/70"
                      )}
                    >
                      {c.title || "Untitled chat"}
                    </span>
                    {(c.updatedAt || c.createdAt || c.messageCount != null) && (
                      <span className="block truncate text-[11px] font-medium text-muted-foreground/50">
                        {c.messageCount != null
                          ? c.messageCount > 0
                            ? `${c.messageCount} message${c.messageCount === 1 ? "" : "s"}`
                            : "New"
                          : null}
                        {c.messageCount != null && (c.updatedAt || c.createdAt) ? " · " : null}
                        {(c.updatedAt || c.createdAt) &&
                          formatDistanceToNowStrict(new Date(c.updatedAt || c.createdAt!), { addSuffix: true })}
                      </span>
                    )}
                  </span>
                </button>

                {confirmId === c.id ? (
                  <div className="flex shrink-0 items-center gap-1 pr-1">
                    <button
                      type="button"
                      onClick={() => {
                        onDelete(c.id)
                        setConfirmId(null)
                      }}
                      className="rounded-lg px-2 py-1 text-xs font-bold uppercase text-red-500 hover:bg-red-500/10"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmId(null)}
                      aria-label="Cancel delete"
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex shrink-0 items-center gap-0.5 pr-1 opacity-0 transition-opacity group-hover/conv:opacity-100">
                    <button
                      type="button"
                      aria-label="Rename chat"
                      onClick={() => startEdit(c)}
                      className="rounded-lg p-1.5 text-muted-foreground/50 hover:bg-accent hover:text-foreground"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      aria-label="Delete chat"
                      onClick={() => setConfirmId(c.id)}
                      className="rounded-lg p-1.5 text-muted-foreground/50 hover:bg-red-500/10 hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
