"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  User,
  Mail,
  BrainCircuit,
  Cpu,
  CheckCircle2,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Zap,
  Activity,
  Globe,
  Briefcase,
  History,
} from "lucide-react"
import { motion } from "motion/react"

import { PageHero } from "@/components/app/page-hero"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { userApi } from "@/lib/api"
import { clearAuth, getUserId } from "@/lib/auth-store"
import { cn } from "@/lib/utils"

const levels = [
  { value: "BEGINNER", label: "Beginner", desc: "Just starting out", emoji: "🌱" },
  { value: "INTERMEDIATE", label: "Intermediate", desc: "Basic conversations", emoji: "🌿" },
  { value: "ADVANCED", label: "Advanced", desc: "Fluent situations", emoji: "🌳" },
]

const models = [
  { value: "gpt-4o-mini", label: "GPT-4o mini", desc: "Fast & efficient" },
  { value: "gpt-4o", label: "GPT-4o", desc: "Balanced performance" },
  { value: "gpt-5-mini", label: "GPT-5 mini", desc: "Latest generation" },
]

function SectionCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm dark:bg-slate-900/40", className)}>
      {children}
    </div>
  )
}

function SectionRow({ children, last }: { children: React.ReactNode; last?: boolean }) {
  return (
    <div className={cn("px-6 py-5", !last && "border-b border-border/60")}>
      {children}
    </div>
  )
}

function SectionHeader({ icon: Icon, title, description, color = "text-emerald-600" }: {
  icon: React.ElementType
  title: string
  description: string
  color?: string
}) {
  return (
    <div className="flex items-center gap-4">
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent/5 ring-1 ring-border/50", color)}>
        <Icon size={20} strokeWidth={2.5} />
      </div>
      <div>
        <p className="text-sm font-black text-foreground uppercase tracking-wider">{title}</p>
        <p className="text-[12px] font-medium text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
} as const

export default function SettingsPage() {
  const router = useRouter()
  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [koreanLevel, setKoreanLevel] = useState("BEGINNER")
  const [country, setCountry] = useState("")
  const [nativeLanguage, setNativeLanguage] = useState("")
  const [occupation, setOccupation] = useState("")
  const [yearsOfExperience, setYearsOfExperience] = useState("")
  const [learningGoal, setLearningGoal] = useState("")
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
        setCountry(data.country ?? "")
        setNativeLanguage(data.nativeLanguage ?? "")
        setOccupation(data.occupation ?? "")
        setYearsOfExperience(data.yearsOfExperience != null ? String(data.yearsOfExperience) : "")
        setLearningGoal(data.learningGoal ?? "")
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
      await userApi.updateProfile(userId, {
        displayName,
        koreanLevel,
        country: country || undefined,
        nativeLanguage: nativeLanguage || undefined,
        occupation: occupation || undefined,
        yearsOfExperience: yearsOfExperience ? Number(yearsOfExperience) : undefined,
        learningGoal: learningGoal || undefined,
      })
      await userApi.updatePreferredModel(userId, activeModel)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError("Failed to save. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  function handleClose() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()
      return
    }
    router.push("/dashboard")
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
      <div className="grid gap-6 xl:grid-cols-[0.7fr_1.3fr]">
        <div className="space-y-6">
          <div className="rounded-[2.5rem] border border-border bg-card p-6 shadow-sm">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="mt-4 h-11 w-48" />
            <Skeleton className="mt-3 h-5 w-full max-w-sm" />
            <div className="mt-6 flex gap-3">
              <Skeleton className="h-10 w-28 rounded-xl" />
            </div>
          </div>
          <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-5">
              <Skeleton className="h-16 w-16 rounded-2xl" />
              <div className="flex-1">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="mt-2 h-4 w-40" />
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          {[1, 2].map((item) => (
            <div key={item} className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-2xl" />
                <div>
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="mt-2 h-4 w-44" />
                </div>
              </div>
              <div className="mt-6 space-y-4">
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-2xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.form
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      onSubmit={handleSave}
      className="grid gap-6 pb-12 xl:grid-cols-[0.75fr_1.25fr]"
    >
      {/* Left Sidebar */}
      <div className="space-y-6 xl:sticky xl:top-8 xl:self-start">
        <motion.div variants={itemVariants}>
          <PageHero
            eyebrow="Account"
            title="Settings"
            description="Manage your profile, language level, and defaults."
            actions={
              <Button type="button" variant="outline" className="h-10 rounded-xl font-bold active:scale-95" onClick={handleClose}>
                <ArrowLeft size={14} strokeWidth={3} className="mr-2" />
                Back
              </Button>
            }
            className="p-6"
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <SectionCard className="border-emerald-500/10 bg-emerald-500/[0.02]">
            <SectionRow last>
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-500 to-teal-600 text-2xl font-black text-white shadow-xl shadow-emerald-500/20">
                    {initials}
                  </div>
                  <div className="absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-emerald-400">
                    <CheckCircle2 size={12} className="text-white" strokeWidth={4} />
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-lg font-black text-foreground">
                    {displayName || "Your name"}
                  </p>
                  <p className="truncate text-sm font-medium text-muted-foreground/60">{email}</p>
                </div>
              </div>
            </SectionRow>
          </SectionCard>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-3">
          <Button
            type="submit"
            disabled={saving}
            className="h-14 w-full rounded-2xl bg-emerald-600 text-base font-black text-white shadow-xl shadow-emerald-600/20 hover:bg-emerald-500 active:scale-95 disabled:opacity-60 transition-all"
          >
            {saving ? (
              <><Activity size={20} className="mr-2 animate-pulse" /> Saving...</>
            ) : (
              <><Zap size={20} className="mr-2" strokeWidth={2.5} /> Update Profile</>
            )}
          </Button>

          {saved && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-emerald-600 dark:text-emerald-400"
            >
              <CheckCircle2 size={16} strokeWidth={3} />
              <span className="text-sm font-bold tracking-tight">Changes saved successfully</span>
            </motion.div>
          )}
          {error && (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm font-bold text-destructive text-center">
              {error}
            </div>
          )}
        </motion.div>

        <motion.div variants={itemVariants}>
          <SectionCard>
            <button
              type="button"
              onClick={() => router.push("/history")}
              className="group flex w-full items-center justify-between px-6 py-5 text-left transition-all hover:bg-violet-500/5 active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-500 ring-1 ring-violet-500/20 transition-transform group-hover:scale-110">
                  <History size={18} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-sm font-black text-foreground uppercase tracking-wider">
                    Study History
                  </p>
                  <p className="text-[11px] font-medium text-muted-foreground/60">
                    Corrections, calendar &amp; grammar patterns
                  </p>
                </div>
              </div>
              <ChevronRight size={16} strokeWidth={2.5} className="text-muted-foreground/30 transition-transform group-hover:translate-x-1" />
            </button>
          </SectionCard>
        </motion.div>

        <motion.div variants={itemVariants}>
          <SectionCard>
            <button
              type="button"
              onClick={handleSignOut}
              className="group flex w-full items-center justify-between px-6 py-5 text-left transition-all hover:bg-red-500/5 active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500/10 text-red-500 ring-1 ring-red-500/20 transition-transform group-hover:scale-110">
                  <LogOut size={18} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-sm font-black text-red-600 uppercase tracking-wider">
                    Sign out
                  </p>
                  <p className="text-[11px] font-medium text-muted-foreground/60">
                    End your active session
                  </p>
                </div>
              </div>
              <ChevronRight size={16} strokeWidth={2.5} className="text-muted-foreground/30 transition-transform group-hover:translate-x-1" />
            </button>
          </SectionCard>
        </motion.div>
      </div>

      {/* Right Content */}
      <div className="space-y-6">
        <motion.div variants={itemVariants}>
          <SectionCard>
            <SectionRow>
              <SectionHeader icon={User} title="Profile Details" description="Personal information and public identity" color="text-emerald-500" />
            </SectionRow>

            <SectionRow>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1">
                    Display name
                  </label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    className="h-12 rounded-2xl border-border bg-accent/5 px-4 font-bold focus:bg-background transition-all"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1">
                    Email address
                  </label>
                  <div className="flex items-center gap-3 rounded-2xl border border-border bg-accent/5 px-4 py-3 opacity-60">
                    <Mail size={16} className="text-muted-foreground" strokeWidth={2.5} />
                    <span className="flex-1 truncate text-sm font-bold text-foreground">
                      {email}
                    </span>
                    <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                      <ShieldCheck size={10} strokeWidth={3} />
                      Verified
                    </span>
                  </div>
                </div>
              </div>
            </SectionRow>
          </SectionCard>
        </motion.div>

        <motion.div variants={itemVariants}>
          <SectionCard>
            <SectionRow>
              <SectionHeader icon={Globe} title="Background" description="Your origin and native language" color="text-sky-500" />
            </SectionRow>
            <SectionRow last>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1">Country</label>
                  <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. Cambodia" className="h-12 rounded-2xl border-border bg-accent/5 px-4 font-bold focus:bg-background transition-all" />
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1">Native Language</label>
                  <select value={nativeLanguage} onChange={(e) => setNativeLanguage(e.target.value)} className="h-12 w-full rounded-2xl border border-border bg-accent/5 px-3 py-1 text-sm font-bold text-foreground outline-none transition-all focus:bg-background focus:ring-2 focus:ring-emerald-500/20 dark:bg-white/5">
                    <option value="">Select language</option>
                    {["Khmer", "English", "Chinese", "Japanese", "Vietnamese", "Thai", "Indonesian", "Filipino", "Malay", "Other"].map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
            </SectionRow>
          </SectionCard>
        </motion.div>

        <motion.div variants={itemVariants}>
          <SectionCard>
            <SectionRow>
              <SectionHeader icon={Briefcase} title="Work Details" description="Your role and experience in tech" color="text-amber-500" />
            </SectionRow>
            <SectionRow last>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1">Occupation</label>
                  <select value={occupation} onChange={(e) => setOccupation(e.target.value)} className="h-12 w-full rounded-2xl border border-border bg-accent/5 px-3 py-1 text-sm font-bold text-foreground outline-none transition-all focus:bg-background focus:ring-2 focus:ring-emerald-500/20 dark:bg-white/5">
                    <option value="">Select role</option>
                    {["Frontend Developer", "Backend Developer", "Full-Stack Developer", "QA Engineer", "DevOps Engineer", "Product Manager", "Data Scientist", "Other"].map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1">Years of Experience</label>
                  <Input type="number" min={0} max={50} value={yearsOfExperience} onChange={(e) => setYearsOfExperience(e.target.value)} placeholder="e.g. 3" className="h-12 rounded-2xl border-border bg-accent/5 px-4 font-bold focus:bg-background transition-all" />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1">Learning Goal</label>
                  <select value={learningGoal} onChange={(e) => setLearningGoal(e.target.value)} className="h-12 w-full rounded-2xl border border-border bg-accent/5 px-3 py-1 text-sm font-bold text-foreground outline-none transition-all focus:bg-background focus:ring-2 focus:ring-emerald-500/20 dark:bg-white/5">
                    <option value="">Select your main goal</option>
                    {["Daily standup participation", "Team meeting communication", "Writing professional messages", "Technical discussion in Korean", "General workplace communication"].map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>
            </SectionRow>
          </SectionCard>
        </motion.div>

        <motion.div variants={itemVariants}>
          <SectionCard>
            <SectionRow>
              <SectionHeader
                icon={BrainCircuit}
                title="Learning Level"
                description="Adjusts AI complexity to match your fluency"
                color="text-violet-500"
              />
            </SectionRow>

            <SectionRow last>
              <div className="grid gap-3">
                {levels.map((level) => {
                  const active = koreanLevel === level.value
                  return (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => setKoreanLevel(level.value)}
                      className={cn(
                        "group relative flex w-full items-center gap-4 rounded-2xl border px-5 py-4 text-left transition-all active:scale-[0.98]",
                        active
                          ? "border-emerald-500/40 bg-emerald-500/5 shadow-inner ring-1 ring-emerald-500/20"
                          : "border-border bg-accent/5 hover:border-emerald-500/20 hover:bg-background"
                      )}
                    >
                      <div className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl transition-transform group-hover:scale-110",
                        active ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-background shadow-sm"
                      )}>
                        {level.emoji}
                      </div>
                      <div className="flex-1">
                        <p className={cn(
                          "text-sm font-black tracking-tight",
                          active ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {level.label}
                        </p>
                        <p className="text-[11px] font-medium text-muted-foreground/60">{level.desc}</p>
                      </div>
                      {active ? (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
                          <CheckCircle2 size={14} strokeWidth={3} />
                        </div>
                      ) : (
                        <ChevronRight size={16} strokeWidth={2.5} className="text-muted-foreground/20 transition-transform group-hover:translate-x-1" />
                      )}
                    </button>
                  )
                })}
              </div>
            </SectionRow>
          </SectionCard>
        </motion.div>

        <motion.div variants={itemVariants}>
          <SectionCard>
            <SectionRow>
              <SectionHeader
                icon={Cpu}
                title="Model Intelligence"
                description="Powering your conversation and feedback"
                color="text-sky-500"
              />
            </SectionRow>

            <SectionRow last>
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {models.map((model) => {
                    const active = preferredModel === model.value && !customModel
                    return (
                      <button
                        key={model.value}
                        type="button"
                        onClick={() => { setPreferredModel(model.value); setCustomModel("") }}
                        className={cn(
                          "group relative flex flex-col gap-1 rounded-2xl border px-5 py-4 text-left transition-all active:scale-[0.98]",
                          active
                            ? "border-sky-500/40 bg-sky-500/5 shadow-inner ring-1 ring-sky-500/20"
                            : "border-border bg-accent/5 hover:border-sky-500/20 hover:bg-background"
                        )}
                      >
                        <p className={cn(
                          "text-sm font-black tracking-tight",
                          active ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {model.label}
                        </p>
                        <p className="text-[11px] font-medium text-muted-foreground/60">{model.desc}</p>
                        {active && (
                          <div className="absolute right-3 top-3 h-1.5 w-1.5 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.6)]" />
                        )}
                      </button>
                    )
                  })}
                </div>

                <div className="pt-2">
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1">
                    Advanced Custom Model
                  </label>
                  <Input
                    value={customModel}
                    onChange={(e) => setCustomModel(e.target.value)}
                    placeholder="e.g. gpt-4-turbo"
                    className="h-12 rounded-2xl border-border bg-accent/5 px-4 font-mono text-xs focus:bg-background transition-all"
                  />
                </div>
              </div>
            </SectionRow>
          </SectionCard>
        </motion.div>

        {/* Mobile-only copyright */}
        <motion.div variants={itemVariants} className="pt-4 text-center xl:hidden">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/30">
            © 2026 Hen Heang · FullStack Developer
          </p>
        </motion.div>
      </div>
    </motion.form>
  )
}
