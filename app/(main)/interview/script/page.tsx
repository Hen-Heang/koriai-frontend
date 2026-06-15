"use client"

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardCopy,
  Cloud,
  CloudCheck,
  Download,
  FileText,
  ListTree,
  Plus,
  Trash2,
} from "lucide-react"

import { SpeakButton } from "@/components/ui/SpeakButton"
import { Button } from "@/components/ui/button"
import { interviewApi } from "@/lib/api"
import { buildScriptDocument, INTERVIEW_TOPICS } from "@/lib/interview"
import { cn } from "@/lib/utils"

const topic = INTERVIEW_TOPICS[0]
const STORAGE_KEY = `koriai-interview-script:${topic.id}`
// Custom (user-added) section definitions live separately from the section text
// so the existing per-topic text payload keeps syncing to the backend unchanged.
const CUSTOM_KEY = `koriai-interview-script-custom:${topic.id}`

/** A section the candidate adds themselves, beyond the fixed exam outline. */
type CustomSection = { id: string; title: string }

function countWords(text: string) {
  const trimmed = text.trim()
  return trimmed ? trimmed.split(/\s+/).length : 0
}

function loadInitial(): Record<string, string> {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, string>) : {}
  } catch {
    return {}
  }
}

function loadInitialCustom(): CustomSection[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(CUSTOM_KEY)
    return raw ? (JSON.parse(raw) as CustomSection[]) : []
  } catch {
    return []
  }
}

// Borderless, auto-growing textarea so each section flows like document body
// text instead of a boxed form field.
function DocTextarea({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (text: string) => void
  placeholder: string
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={1}
      className="w-full resize-none border-0 bg-transparent p-0 text-[15px] leading-[1.9] text-slate-800 outline-none placeholder:text-slate-300 focus:ring-0 dark:text-slate-200 dark:placeholder:text-slate-600"
    />
  )
}

export default function InterviewScriptPage() {
  const outline = useMemo(() => topic.scriptOutline ?? [], [])
  const [values, setValues] = useState<Record<string, string>>(loadInitial)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [synced, setSynced] = useState(false)
  const [copied, setCopied] = useState(false)
  const [activeSection, setActiveSection] = useState<string>("")
  const [customSections, setCustomSections] = useState<CustomSection[]>(loadInitialCustom)
  const copyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const syncTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Avoid a hydration mismatch: the server has no localStorage, so render the
  // stored content only after mount (same technique as the app shell).
  const mounted = useSyncExternalStore(
    (callback) => {
      queueMicrotask(callback)
      return () => undefined
    },
    () => true,
    () => false
  )

  useEffect(() => {
    return () => {
      if (copyTimeout.current) clearTimeout(copyTimeout.current)
      if (syncTimeout.current) clearTimeout(syncTimeout.current)
    }
  }, [])

  // Best-effort hydrate from the account. If the backend isn't reachable or has
  // nothing yet, the local copy (already loaded) stands. Local edits win, so we
  // only adopt the remote copy when nothing has been written on this device.
  useEffect(() => {
    let active = true
    interviewApi
      .getScript(topic.id)
      .then((remote) => {
        if (!active || !remote?.sections) return
        if (Object.keys(remote.sections).length === 0) return
        setValues((prev) => (Object.keys(prev).length > 0 ? prev : remote.sections))
        setSynced(true)
      })
      .catch(() => {
        // Offline or endpoint not live yet — the local copy is the source of truth.
      })
    return () => {
      active = false
    }
  }, [])

  // Push the latest script to the account a moment after typing stops. Failures
  // are silent — the local autosave already guarantees the work is kept.
  function scheduleSync(next: Record<string, string>) {
    if (syncTimeout.current) clearTimeout(syncTimeout.current)
    syncTimeout.current = setTimeout(() => {
      interviewApi
        .saveScript(topic.id, next)
        .then(() => setSynced(true))
        .catch(() => {})
    }, 1500)
  }

  const fullDocument = useMemo(
    () => buildScriptDocument(topic, values, customSections),
    [values, customSections]
  )
  const totalWords = useMemo(
    () => Object.values(values).reduce((sum, text) => sum + countWords(text), 0),
    [values]
  )

  // Saving happens here in the change handler (not in an effect) so there is no
  // cascading render, and edits persist instantly.
  function updateSection(id: string, text: string) {
    const next = { ...values, [id]: text }
    setValues(next)
    setSynced(false)
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      setSavedAt(new Date())
    } catch {
      // Ignore quota / private-mode failures.
    }
    scheduleSync(next)
  }

  // ── Custom sections ──────────────────────────────────────────────────────
  // Their definitions are frontend-only (localStorage); the text they hold still
  // rides along in `values` and syncs to the account like every other section.
  function persistCustom(next: CustomSection[]) {
    setCustomSections(next)
    try {
      window.localStorage.setItem(CUSTOM_KEY, JSON.stringify(next))
    } catch {
      // Ignore quota / private-mode failures.
    }
  }

  function addCustomSection() {
    const id = `custom-${crypto.randomUUID()}`
    persistCustom([...customSections, { id, title: "" }])
    // Focus the new title field once it renders.
    setTimeout(() => document.getElementById(`title-${id}`)?.focus(), 0)
  }

  function renameCustomSection(id: string, title: string) {
    persistCustom(customSections.map((s) => (s.id === id ? { ...s, title } : s)))
  }

  function moveCustomSection(id: string, dir: "up" | "down") {
    const index = customSections.findIndex((s) => s.id === id)
    const target = dir === "up" ? index - 1 : index + 1
    if (index < 0 || target < 0 || target >= customSections.length) return
    const next = [...customSections]
    ;[next[index], next[target]] = [next[target], next[index]]
    persistCustom(next)
  }

  function removeCustomSection(id: string) {
    persistCustom(customSections.filter((s) => s.id !== id))
    if (values[id] === undefined) return
    // Drop its text too so it doesn't linger in the synced payload.
    const next = { ...values }
    delete next[id]
    setValues(next)
    setSynced(false)
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      setSavedAt(new Date())
    } catch {
      // ignore
    }
    scheduleSync(next)
  }

  async function copyAll() {
    if (!fullDocument) return
    try {
      await navigator.clipboard.writeText(fullDocument)
      setCopied(true)
      if (copyTimeout.current) clearTimeout(copyTimeout.current)
      copyTimeout.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard blocked — download is the fallback.
    }
  }

  function downloadTxt() {
    if (!fullDocument) return
    const blob = new Blob([fullDocument], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `interview-script-${topic.id}.txt`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  function clearAll() {
    if (!window.confirm("Clear the whole script? This cannot be undone.")) return
    setValues({})
    persistCustom([])
    setSynced(false)
    try {
      window.localStorage.removeItem(STORAGE_KEY)
      setSavedAt(new Date())
    } catch {
      // ignore
    }
    scheduleSync({})
  }

  const view = mounted ? values : {}
  const viewCustom = mounted ? customSections : []

  // Fixed exam outline first, then the candidate's own sections after it.
  const allSections = [
    ...outline.map((s) => ({
      id: s.id,
      titleKo: s.titleKo,
      titleEn: s.titleEn,
      hint: s.hint,
      custom: false as const,
    })),
    ...viewCustom.map((s) => ({
      id: s.id,
      titleKo: s.title,
      titleEn: "",
      hint: "",
      custom: true as const,
    })),
  ]
  const completedSections = allSections.filter((s) => (view[s.id] ?? "").trim()).length

  // Highlight the section nearest the top of the viewport in the outline rail,
  // the way Google Docs tracks the cursor's heading.
  useEffect(() => {
    if (!mounted) return
    const els = Array.from(
      document.querySelectorAll<HTMLElement>("[data-doc-section]")
    )
    if (els.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) {
          setActiveSection(visible[0].target.id.replace("sec-", ""))
        }
      },
      { rootMargin: "-15% 0px -75% 0px" }
    )
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [mounted, outline, customSections])

  function scrollToSection(id: string) {
    const el = document.getElementById(`sec-${id}`)
    if (!el) return
    el.scrollIntoView({ behavior: "smooth", block: "start" })
    el.querySelector("textarea")?.focus({ preventScroll: true })
    setActiveSection(id)
  }

  return (
    // Break out of the centered content column to get a full Google-Docs canvas.
    <div className="-mx-3.5 -mt-5 sm:-mx-6 lg:-mx-8 lg:-mt-8">
      {/* ── Docs-style title bar ── */}
      <div className="sticky top-0 z-30 border-b border-border/70 bg-background/90 px-3.5 py-2.5 backdrop-blur-xl sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1180px] items-center gap-3">
          <Link
            href="/interview"
            aria-label="Back to interview"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ArrowLeft size={18} />
          </Link>

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
            <FileText size={18} strokeWidth={2.5} />
          </div>

          {/* Doc name + live save status (the line Docs shows under the title) */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-black leading-tight text-foreground">
              {topic.labelKo}
            </p>
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
              {synced ? (
                <CloudCheck size={13} className="shrink-0 text-emerald-500" />
              ) : (
                <Cloud size={13} className="shrink-0 text-emerald-500" />
              )}
              <span className="truncate">
                {synced
                  ? "Saved to your account"
                  : savedAt
                    ? "Saved on this device"
                    : "Saves automatically as you type"}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={copyAll}
              disabled={!fullDocument}
              className="h-8 rounded-lg font-bold disabled:opacity-40"
            >
              {copied ? (
                <>
                  <Check size={15} className="mr-1.5 text-emerald-500" /> Copied
                </>
              ) : (
                <>
                  <ClipboardCopy size={15} className="mr-1.5" /> <span className="hidden sm:inline">Copy</span>
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={downloadTxt}
              disabled={!fullDocument}
              className="h-8 rounded-lg font-bold disabled:opacity-40"
            >
              <Download size={15} className="sm:mr-1.5" /> <span className="hidden sm:inline">Download</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={clearAll}
              disabled={!fullDocument}
              className="h-8 rounded-lg border-destructive/30 font-bold text-destructive hover:bg-destructive/5 disabled:opacity-40"
            >
              <Trash2 size={15} />
            </Button>
          </div>
        </div>
      </div>

      {/* ── Canvas: outline rail + paper ── */}
      <div className="min-h-[calc(100dvh-3.25rem)] bg-[#f9fbfd] px-2 py-6 dark:bg-black/40 sm:px-6 sm:py-10">
        <div className="mx-auto flex max-w-[1180px] justify-center gap-6 xl:gap-8">
          {/* Document outline (Docs left panel) */}
          <aside className="hidden w-56 shrink-0 lg:block">
            <div className="sticky top-20">
              <div className="mb-3 flex items-center gap-2 px-2 text-muted-foreground">
                <ListTree size={16} strokeWidth={2.5} />
                <span className="text-[11px] font-black uppercase tracking-[0.18em]">
                  Outline
                </span>
              </div>
              <nav className="space-y-0.5">
                {allSections.map((section, index) => {
                  const filled = (view[section.id] ?? "").trim().length > 0
                  const active = activeSection === section.id
                  const label = section.custom
                    ? section.titleKo.trim() || "Untitled section"
                    : section.titleEn
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => scrollToSection(section.id)}
                      className={cn(
                        "group flex w-full items-center gap-2.5 rounded-lg border-l-2 py-1.5 pl-3 pr-2 text-left transition-colors",
                        active
                          ? "border-emerald-500 bg-emerald-500/10"
                          : "border-transparent hover:bg-accent"
                      )}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 shrink-0 rounded-full transition-colors",
                          filled ? "bg-emerald-500" : "bg-muted-foreground/30"
                        )}
                      />
                      <span
                        className={cn(
                          "truncate text-[13px] font-bold transition-colors",
                          active ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground group-hover:text-foreground"
                        )}
                      >
                        {index + 1}. {label}
                      </span>
                    </button>
                  )
                })}
              </nav>
              <button
                type="button"
                onClick={addCustomSection}
                className="mt-2 flex w-full items-center gap-2 rounded-lg py-1.5 pl-3 pr-2 text-left text-[13px] font-bold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Plus size={14} strokeWidth={3} className="shrink-0" />
                Add section
              </button>
              <div className="mt-4 border-t border-border/60 px-3 pt-3">
                <p className="text-[11px] font-bold text-muted-foreground/70">
                  {completedSections}/{allSections.length} sections
                </p>
                <p className="text-[11px] font-bold text-muted-foreground/70">
                  {totalWords} {totalWords === 1 ? "word" : "words"}
                </p>
              </div>
            </div>
          </aside>

          {/* The paper */}
          <article className="w-full max-w-[816px] rounded-sm bg-white px-6 py-10 shadow-[0_1px_3px_rgba(60,64,67,0.15),0_4px_24px_rgba(60,64,67,0.1)] ring-1 ring-black/5 dark:bg-slate-900 dark:ring-white/10 sm:px-14 sm:py-16 lg:px-[96px]">
            {/* Document title */}
            <header className="border-b border-border/60 pb-6">
              <h1 className="text-[1.7rem] font-black leading-tight tracking-tight text-foreground sm:text-3xl">
                {topic.labelKo}
              </h1>
              <p className="mt-2 text-sm font-medium text-muted-foreground">
                {topic.label} · Interview script · Submit by Aug 21
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wider text-muted-foreground/60">
                {completedSections}/{allSections.length} sections · {totalWords} words
              </p>
            </header>

            {/* Body */}
            <div className="mt-8 space-y-9">
              {allSections.map((section, index) => {
                const sectionWords = countWords(view[section.id] ?? "")
                const active = activeSection === section.id
                return (
                  <section
                    key={section.id}
                    id={`sec-${section.id}`}
                    data-doc-section
                    className={cn(
                      "scroll-mt-20 rounded-r-lg border-l-2 pl-4 transition-colors",
                      active ? "border-emerald-500/60" : "border-transparent"
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      {section.custom ? (
                        <div className="flex min-w-0 flex-1 items-baseline gap-2">
                          <span className="text-lg font-black text-foreground">{index + 1}.</span>
                          <input
                            id={`title-${section.id}`}
                            value={section.titleKo}
                            onChange={(e) => renameCustomSection(section.id, e.target.value)}
                            placeholder="Section title…"
                            className="min-w-0 flex-1 border-0 bg-transparent p-0 text-lg font-black text-foreground outline-none placeholder:font-bold placeholder:text-muted-foreground/40 focus:ring-0"
                          />
                        </div>
                      ) : (
                        <h2 className="text-lg font-black text-foreground">
                          {index + 1}. {section.titleKo}
                          <span className="ml-2 text-sm font-bold text-muted-foreground/70">
                            {section.titleEn}
                          </span>
                        </h2>
                      )}
                      <div className="flex shrink-0 items-center gap-2">
                        {sectionWords > 0 && (
                          <span className="text-[11px] font-bold tabular-nums text-muted-foreground/50">
                            {sectionWords}w
                          </span>
                        )}
                        {(view[section.id] ?? "").trim() && (
                          <SpeakButton
                            text={view[section.id]}
                            title="Listen to what you wrote"
                            className="shrink-0"
                          />
                        )}
                        {section.custom && (
                          <div className="flex items-center">
                            <button
                              type="button"
                              onClick={() => moveCustomSection(section.id, "up")}
                              aria-label="Move section up"
                              className="flex h-7 w-6 items-center justify-center rounded-md text-muted-foreground/40 transition-colors hover:bg-accent hover:text-foreground"
                            >
                              <ChevronUp size={15} strokeWidth={2.5} />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveCustomSection(section.id, "down")}
                              aria-label="Move section down"
                              className="flex h-7 w-6 items-center justify-center rounded-md text-muted-foreground/40 transition-colors hover:bg-accent hover:text-foreground"
                            >
                              <ChevronDown size={15} strokeWidth={2.5} />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeCustomSection(section.id)}
                              aria-label="Delete section"
                              className="flex h-7 w-6 items-center justify-center rounded-md text-muted-foreground/40 transition-colors hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 size={14} strokeWidth={2.5} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    {section.hint && (
                      <p className="mt-1.5 text-xs font-medium italic leading-relaxed text-muted-foreground/80">
                        💡 {section.hint}
                      </p>
                    )}
                    <div className="mt-3">
                      <DocTextarea
                        value={view[section.id] ?? ""}
                        onChange={(text) => updateSection(section.id, text)}
                        placeholder="여기에 한국어로 작성하세요…"
                      />
                    </div>
                    <div className="mt-2 border-b border-dashed border-border/50" />
                  </section>
                )
              })}

              {/* Add a new custom section to the end of the document */}
              <button
                type="button"
                onClick={addCustomSection}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3.5 text-sm font-bold text-muted-foreground transition-colors hover:border-emerald-500/40 hover:bg-emerald-500/5 hover:text-emerald-600"
              >
                <Plus size={16} strokeWidth={2.5} /> Add section
              </button>
            </div>
          </article>
        </div>
      </div>
    </div>
  )
}
