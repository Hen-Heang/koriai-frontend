"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  User,
  Mail,
  BrainCircuit,
  Cpu,
  CheckCircle2,
  LogOut,
  ChevronRight,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { userApi } from "@/lib/api"
import { clearAuth, getUserId } from "@/lib/auth-store"
import { cn } from "@/lib/utils"

const levels = [
  { value: "BEGINNER", label: "Beginner", desc: "Just starting out", emoji: "🌱" },
  { value: "INTERMEDIATE", label: "Intermediate", desc: "Can hold basic conversations", emoji: "🌿" },
  { value: "ADVANCED", label: "Advanced", desc: "Fluent in most situations", emoji: "🌳" },
]

const models = [
  { value: "gpt-4o-mini", label: "GPT-4o mini", desc: "Fast & efficient" },
  { value: "gpt-4o", label: "GPT-4o", desc: "Balanced performance" },
  { value: "gpt-5-mini", label: "GPT-5 mini", desc: "Latest generation" },
]

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-slate-200/70 bg-white shadow-sm dark:border-white/8 dark:bg-[#0e1724]">
      {children}
    </div>
  )
}

function SectionRow({ children, last }: { children: React.ReactNode; last?: boolean }) {
  return (
    <div className={cn("px-5 py-4", !last && "border-b border-slate-100 dark:border-white/[0.06]")}>
      {children}
    </div>
  )
}

function SectionHeader({ icon: Icon, title, description }: {
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/8">
        <Icon size={16} strokeWidth={1.7} className="text-slate-600 dark:text-slate-300" />
      </div>
      <div>
        <p className="text-[14px] font-semibold text-slate-900 dark:text-white">{title}</p>
        <p className="text-[12px] text-slate-500 dark:text-slate-400">{description}</p>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [koreanLevel, setKoreanLevel] = useState("BEGINNER")
  const [preferredModel, setPreferredModel] = useState("gpt-5-mini")
  const [customModel, setCustomModel] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const userId = getUserId()
    if (!userId) return
    userApi
      .getById(userId)
      .then((data) => {
        setDisplayName(data.displayName ?? "")
        setEmail(data.email ?? "")
        setKoreanLevel(data.koreanLevel ?? "BEGINNER")
        const model = data.preferredModel ?? "gpt-5-mini"
        setPreferredModel(model)
        if (!models.some((m) => m.value === model)) setCustomModel(model)
      })
      .finally(() => setLoading(false))
  }, [])

  const activeModel = customModel || preferredModel

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const userId = getUserId()
    if (!userId) return
    setSaving(true)
    setError("")
    setSaved(false)
    try {
      await userApi.updateProfile(userId, displayName, koreanLevel)
      await userApi.updatePreferredModel(userId, activeModel)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError("Failed to save. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  function handleSignOut() {
    clearAuth()
    router.replace("/login")
  }

  const initials = displayName
    ? displayName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : email?.[0]?.toUpperCase() ?? "?"

  if (loading) {
    return (
      <div className="grid gap-4 xl:grid-cols-[minmax(18rem,0.72fr)_minmax(0,1.28fr)]">
        <div className="space-y-4">
          <div className="h-8 w-44 animate-pulse rounded-xl bg-slate-100 dark:bg-white/8" />
          <div className="h-28 animate-pulse rounded-[1.5rem] bg-slate-100 dark:bg-white/8" />
        </div>
        <div className="space-y-4">
          <div className="h-44 animate-pulse rounded-[1.5rem] bg-slate-100 dark:bg-white/8" />
          <div className="h-52 animate-pulse rounded-[1.5rem] bg-slate-100 dark:bg-white/8" />
        </div>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSave}
      className="grid gap-4 pb-6 xl:grid-cols-[minmax(18rem,0.72fr)_minmax(0,1.28fr)]"
    >
      <div className="space-y-4 xl:sticky xl:top-7 xl:self-start">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
            Account
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Settings
          </h1>
          <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
            Manage your profile, study level, and default AI model in one place.
          </p>
        </div>

        <SectionCard>
          <SectionRow last>
            <div className="flex items-center gap-4">
              <div className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-[1.1rem] bg-gradient-to-br from-emerald-500 to-teal-600 text-xl font-bold text-white shadow-md shadow-emerald-500/20">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold text-slate-900 dark:text-white">
                  {displayName || "Your name"}
                </p>
                <p className="truncate text-[13px] text-slate-500 dark:text-slate-400">{email}</p>
                <span className="mt-1.5 inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                  {levels.find((l) => l.value === koreanLevel)?.label ?? koreanLevel}
                </span>
              </div>
            </div>
          </SectionRow>
        </SectionCard>

        {saved && (
          <div className="flex items-center gap-2.5 rounded-2xl bg-emerald-50 px-4 py-3 dark:bg-emerald-500/15">
            <CheckCircle2 size={15} strokeWidth={2} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="text-[13px] font-medium text-emerald-700 dark:text-emerald-300">
              Settings saved successfully.
            </span>
          </div>
        )}
        {error && (
          <div className="rounded-2xl bg-red-50 px-4 py-3 text-[13px] font-medium text-red-600 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={saving}
          className="h-12 w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-[15px] font-semibold text-white shadow-md shadow-emerald-500/20 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save settings"}
        </Button>

        <SectionCard>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-red-50/50 active:bg-red-50 dark:hover:bg-red-500/5"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-500/10">
                <LogOut size={16} strokeWidth={1.7} className="text-red-500" />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-red-600 dark:text-red-400">
                  Sign out
                </p>
                <p className="text-[12px] text-slate-400 dark:text-slate-500">
                  You&apos;ll need to log in again
                </p>
              </div>
            </div>
            <ChevronRight size={15} strokeWidth={1.6} className="text-slate-300 dark:text-slate-600" />
          </button>
        </SectionCard>
      </div>

      <div className="space-y-4">
        <SectionCard>
          <SectionRow>
            <SectionHeader icon={User} title="Profile" description="How you appear in KoriAI" />
          </SectionRow>

          <SectionRow>
            <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
              Display name
            </label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="rounded-xl"
            />
          </SectionRow>

          <SectionRow last>
            <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
              Email
            </label>
            <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 dark:border-white/8 dark:bg-white/[0.04]">
              <Mail size={14} strokeWidth={1.6} className="shrink-0 text-slate-400" />
              <span className="flex-1 truncate text-[14px] text-slate-400 dark:text-slate-500">
                {email}
              </span>
              <span className="shrink-0 text-[11px] text-slate-400 dark:text-slate-500">
                Read-only
              </span>
            </div>
          </SectionRow>
        </SectionCard>

        <SectionCard>
          <SectionRow>
            <SectionHeader
              icon={BrainCircuit}
              title="Korean level"
              description="Your AI tutor adjusts difficulty to match"
            />
          </SectionRow>

          <SectionRow last>
            <div className="space-y-2">
              {levels.map((level) => {
                const active = koreanLevel === level.value
                return (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => setKoreanLevel(level.value)}
                    className={cn(
                      "flex w-full items-center gap-3.5 rounded-2xl border px-4 py-3.5 text-left transition-all active:scale-[0.99]",
                      active
                        ? "border-emerald-300 bg-emerald-50 dark:border-emerald-500/40 dark:bg-emerald-500/10"
                        : "border-slate-200/70 hover:bg-slate-50 dark:border-white/[0.06] dark:hover:bg-white/[0.04]"
                    )}
                  >
                    <span className="text-xl leading-none">{level.emoji}</span>
                    <div className="flex-1">
                      <p className={cn(
                        "text-[13.5px] font-semibold",
                        active ? "text-emerald-800 dark:text-emerald-300" : "text-slate-800 dark:text-slate-200"
                      )}>
                        {level.label}
                      </p>
                      <p className="text-[12px] text-slate-500 dark:text-slate-400">{level.desc}</p>
                    </div>
                    {active
                      ? <CheckCircle2 size={18} strokeWidth={2} className="shrink-0 text-emerald-500" />
                      : <ChevronRight size={15} strokeWidth={1.6} className="shrink-0 text-slate-300 dark:text-slate-600" />
                    }
                  </button>
                )
              })}
            </div>
          </SectionRow>
        </SectionCard>

        <SectionCard>
          <SectionRow>
            <SectionHeader
              icon={Cpu}
              title="AI model"
              description="Used for chat, corrections, and diary coaching"
            />
          </SectionRow>

          <SectionRow last>
            <div className="space-y-2">
              {models.map((model) => {
                const active = preferredModel === model.value && !customModel
                return (
                  <button
                    key={model.value}
                    type="button"
                    onClick={() => { setPreferredModel(model.value); setCustomModel("") }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all active:scale-[0.99]",
                      active
                        ? "border-sky-300 bg-sky-50 dark:border-sky-500/40 dark:bg-sky-500/10"
                        : "border-slate-200/70 hover:bg-slate-50 dark:border-white/[0.06] dark:hover:bg-white/[0.04]"
                    )}
                  >
                    <div className="flex-1">
                      <p className={cn(
                        "text-[13.5px] font-semibold",
                        active ? "text-sky-800 dark:text-sky-300" : "text-slate-800 dark:text-slate-200"
                      )}>
                        {model.label}
                      </p>
                      <p className="text-[12px] text-slate-500 dark:text-slate-400">{model.desc}</p>
                    </div>
                    {active && <CheckCircle2 size={18} strokeWidth={2} className="shrink-0 text-sky-500" />}
                  </button>
                )
              })}

              <div className="pt-1">
                <label className="mb-1.5 block text-[12px] font-medium text-slate-400 dark:text-slate-500">
                  Custom model ID
                </label>
                <Input
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                  placeholder="e.g. gpt-4-turbo"
                  className="rounded-xl"
                />
              </div>
            </div>
          </SectionRow>
        </SectionCard>
      </div>
    </form>
  )
}
