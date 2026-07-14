import {
  BarChart3,
  BookOpen,
  BookOpenText,
  ClipboardList,
  Drama,
  Gauge,
  GraduationCap,
  Headphones,
  History,
  Languages,
  Map,
  MessageCircle,
  NotebookPen,
  RotateCcw,
  ScanText,
  Sparkles,
  Target,
  Trophy,
  Wand2,
} from "lucide-react"

// Single source of truth for the whole nav surface — sidebar, mobile bottom
// bar, and the "More" sheet all render from this. Adding a new module later
// (Career, Fitness, ...) means adding one workspace entry here, not touching
// the shell.

export type NavLink = {
  href: string
  label: string
  icon: React.ElementType
  soon?: boolean
}

export type Workspace = {
  id: string
  label: string
  icon: React.ElementType
  links: NavLink[]
}

export const workspaces: Workspace[] = [
  {
    id: "learning",
    label: "Learning",
    icon: Sparkles,
    links: [
      { href: "/practice", label: "Today", icon: Sparkles },
      { href: "/vocab", label: "Vocabulary", icon: BookOpen },
      { href: "/learn", label: "Foundations", icon: Languages },
      { href: "/reading", label: "Reading", icon: BookOpenText },
      { href: "/listening", label: "Listening", icon: Headphones },
      { href: "/scenarios", label: "Scenarios", icon: Drama },
      { href: "/interview", label: "Exam Prep", icon: GraduationCap },
    ],
  },
  {
    id: "productivity",
    label: "Productivity",
    icon: Target,
    links: [
      { href: "/dashboard", label: "Dashboard", icon: Gauge },
      { href: "/goals", label: "Goals", icon: Target },
      { href: "/roadmap", label: "Roadmap", icon: Map },
      { href: "/notes", label: "Notes", icon: NotebookPen },
    ],
  },
  {
    id: "ai",
    label: "AI",
    icon: MessageCircle,
    links: [
      { href: "/chat", label: "Chat", icon: MessageCircle },
      { href: "/chat?mode=analyze", label: "Analyze", icon: ScanText },
      { href: "/chat?mode=generate", label: "Generate", icon: Wand2 },
      { href: "/chat?mode=corrections", label: "Corrections", icon: RotateCcw },
    ],
  },
  {
    id: "progress",
    label: "Progress",
    icon: Trophy,
    links: [
      { href: "/achievements", label: "Achievements", icon: Trophy },
      { href: "/statistics", label: "Statistics", icon: BarChart3 },
      { href: "/history", label: "History", icon: History },
    ],
  },
]

export const homeLink: NavLink = { href: "/home", label: "Home", icon: Gauge }
export const settingsLink: NavLink = { href: "/settings", label: "Settings", icon: ClipboardList }

// Mobile bottom bar — most-used daily surfaces, one per workspace plus Home.
export const bottomTabs: NavLink[] = [
  homeLink,
  { href: "/practice", label: "Learn", icon: Sparkles },
  { href: "/goals", label: "Plan", icon: Target },
  { href: "/chat", label: "AI", icon: MessageCircle },
]

// All navigable links, used for page-title lookup in the desktop top bar.
export const allLinks: NavLink[] = [
  homeLink,
  ...workspaces.flatMap((w) => w.links),
  { href: "/account", label: "Account", icon: ClipboardList },
  settingsLink,
]

// Base href without query string, so "/chat?mode=analyze" still matches
// pathname "/chat" for active-state and "More" grouping purposes.
export function linkPath(href: string): string {
  return href.split("?")[0]
}

export function isLinkActive(pathname: string, href: string): boolean {
  const path = linkPath(href)
  return pathname === path || pathname.startsWith(`${path}/`)
}

// Which workspace (if any) the current route belongs to — drives the
// desktop sidebar's contextual view. A route outside all workspaces
// (e.g. /settings, /account) returns undefined.
export function getWorkspaceForPath(pathname: string): Workspace | undefined {
  return workspaces.find((w) => w.links.some((l) => isLinkActive(pathname, l.href)))
}

// Flat list of links not already pinned to a bottom tab, grouped by
// workspace — feeds the mobile "More" sheet.
export const moreWorkspaces: Workspace[] = workspaces.map((w) => ({
  ...w,
  links: w.links.filter(
    (l) => !bottomTabs.some((t) => linkPath(t.href) === linkPath(l.href))
  ),
}))

// Plain route prefixes per workspace id, for last-visited tracking in the
// shell layout (lib/last-visited.ts).
export const workspaceRoutePrefixes: Record<string, string[]> = {
  learning: workspaces.find((w) => w.id === "learning")!.links.map((l) => linkPath(l.href)),
  productivity: workspaces.find((w) => w.id === "productivity")!.links.map((l) => linkPath(l.href)),
  progress: workspaces.find((w) => w.id === "progress")!.links.map((l) => linkPath(l.href)),
}
