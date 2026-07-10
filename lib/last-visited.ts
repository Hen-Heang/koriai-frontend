// Tracks the last route visited inside the Learning and Productivity
// workspaces so Home's "Continue where you left off" cards can deep-link
// back into whatever the user was actually doing, not just a fixed page.

const STORAGE_KEY = "hengo-last-visited"

export type WorkspaceId = "learning" | "productivity"

type LastVisited = Partial<Record<WorkspaceId, string>>

function read(): LastVisited {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as LastVisited) : {}
  } catch {
    return {}
  }
}

export function recordLastVisited(workspace: WorkspaceId, href: string) {
  try {
    const next = { ...read(), [workspace]: href }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    /* storage unavailable */
  }
}

export function getLastVisited(workspace: WorkspaceId, fallback: string): string {
  return read()[workspace] ?? fallback
}
