"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { AlertCircle, Eye, EyeOff, Loader2, ArrowRight, UserPlus, Sparkles } from "lucide-react"
import { motion } from "motion/react"

import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Field,
  FieldContent,
  FieldLabel,
  FieldGroup,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { authApi, getApiErrorMessage } from "@/lib/api"
import { setAuth } from "@/lib/auth-store"

const KOREAN_LEVELS = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
]

const OCCUPATIONS = [
  { value: "Frontend Developer", label: "Frontend Developer" },
  { value: "Backend Developer", label: "Backend Developer" },
  { value: "Full-Stack Developer", label: "Full-Stack Developer" },
  { value: "QA Engineer", label: "QA Engineer" },
  { value: "DevOps Engineer", label: "DevOps Engineer" },
  { value: "Product Manager", label: "Product Manager" },
  { value: "Data Scientist", label: "Data Scientist" },
  { value: "Other", label: "Other" },
]

const LEARNING_GOALS = [
  { value: "Daily standup participation", label: "Daily standup participation" },
  { value: "Team meeting communication", label: "Team meeting communication" },
  { value: "Writing professional messages", label: "Writing professional messages" },
  { value: "Technical discussion in Korean", label: "Technical discussion in Korean" },
  { value: "General workplace communication", label: "General workplace communication" },
]

const NATIVE_LANGUAGES = [
  "Khmer", "English", "Chinese", "Japanese", "Vietnamese",
  "Thai", "Indonesian", "Filipino", "Malay", "Other",
]

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [koreanLevel, setKoreanLevel] = useState("BEGINNER")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [country, setCountry] = useState("")
  const [nativeLanguage, setNativeLanguage] = useState("")
  const [occupation, setOccupation] = useState("")
  const [yearsOfExperience, setYearsOfExperience] = useState("")
  const [learningGoal, setLearningGoal] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (step === 1) {
      setStep(2)
      return
    }
    setError("")
    setLoading(true)
    try {
      const data = await authApi.register({
        email,
        password,
        displayName,
        koreanLevel,
        country: country || undefined,
        nativeLanguage: nativeLanguage || undefined,
        occupation: occupation || undefined,
        yearsOfExperience: yearsOfExperience ? Number(yearsOfExperience) : undefined,
        learningGoal: learningGoal || undefined,
      })
      setAuth(data.accessToken, data.userId, data.email)
      router.push("/dashboard")
    } catch (error) {
      setError(getApiErrorMessage(error, "Registration failed. Email may already be in use."))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12 selection:bg-emerald-500/30 sm:px-6">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-24 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[100px] dark:bg-emerald-500/5" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-violet-500/10 blur-[100px] dark:bg-violet-500/5" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[520px]"
      >
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 transition-transform group-hover:scale-105">
              <Image src="/koriai-logo.svg" alt="" width={24} height={24} className="invert brightness-0" />
            </div>
            <span className="text-xl font-black tracking-tight text-foreground">KoriAI</span>
          </Link>
          <ThemeToggle />
        </div>

        <Card className="overflow-hidden rounded-[2.5rem] border-border bg-card/80 shadow-2xl backdrop-blur-xl dark:bg-slate-900/60">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-violet-500" />

          <CardHeader className="space-y-2 pb-6 pt-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
                <UserPlus size={14} strokeWidth={3} />
                Step {step} of 2
              </div>
              <div className="flex gap-1.5">
                <div className={`h-1.5 w-8 rounded-full transition-colors ${step >= 1 ? "bg-emerald-500" : "bg-border"}`} />
                <div className={`h-1.5 w-8 rounded-full transition-colors ${step >= 2 ? "bg-emerald-500" : "bg-border"}`} />
              </div>
            </div>
            <CardTitle className="text-3xl font-black tracking-tight text-foreground">
              {step === 1 ? "Create account" : "Your profile"}
            </CardTitle>
            <p className="text-sm font-medium leading-relaxed text-muted-foreground">
              {step === 1
                ? "Built for foreign engineers working in Korean tech companies."
                : "Help the AI tutor personalise content for your background."}
            </p>
          </CardHeader>

          <CardContent className="space-y-8 pb-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              {step === 1 && (
                <FieldGroup className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field>
                      <FieldLabel className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">Full Name</FieldLabel>
                      <FieldContent>
                        <Input
                          name="displayName"
                          autoComplete="name"
                          placeholder="Your name"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          required
                          autoFocus
                          className="h-12 rounded-2xl border-border bg-accent/5 px-4 focus:bg-background transition-all"
                        />
                      </FieldContent>
                    </Field>
                    <Field>
                      <FieldLabel className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">Korean Level</FieldLabel>
                      <FieldContent>
                        <select
                          value={koreanLevel}
                          onChange={(e) => setKoreanLevel(e.target.value)}
                          className="h-12 w-full rounded-2xl border border-border bg-accent/5 px-3 py-1 text-sm font-bold text-foreground outline-none transition-all focus:bg-background focus:ring-2 focus:ring-emerald-500/20 dark:bg-white/5"
                        >
                          {KOREAN_LEVELS.map((l) => (
                            <option key={l.value} value={l.value}>{l.label}</option>
                          ))}
                        </select>
                      </FieldContent>
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">Email Address</FieldLabel>
                    <FieldContent>
                      <Input
                        type="email"
                        name="email"
                        autoComplete="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-12 rounded-2xl border-border bg-accent/5 px-4 focus:bg-background transition-all"
                      />
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">Password</FieldLabel>
                    <FieldContent>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          autoComplete="new-password"
                          placeholder="At least 8 characters"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={8}
                          className="h-12 rounded-2xl border-border bg-accent/5 pl-4 pr-12 focus:bg-background transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </FieldContent>
                  </Field>
                </FieldGroup>
              )}

              {step === 2 && (
                <FieldGroup className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field>
                      <FieldLabel className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">Country</FieldLabel>
                      <FieldContent>
                        <Input
                          placeholder="e.g. Cambodia"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className="h-12 rounded-2xl border-border bg-accent/5 px-4 focus:bg-background transition-all"
                        />
                      </FieldContent>
                    </Field>
                    <Field>
                      <FieldLabel className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">Native Language</FieldLabel>
                      <FieldContent>
                        <select
                          value={nativeLanguage}
                          onChange={(e) => setNativeLanguage(e.target.value)}
                          className="h-12 w-full rounded-2xl border border-border bg-accent/5 px-3 py-1 text-sm font-bold text-foreground outline-none transition-all focus:bg-background focus:ring-2 focus:ring-emerald-500/20 dark:bg-white/5"
                        >
                          <option value="">Select language</option>
                          {NATIVE_LANGUAGES.map((l) => (
                            <option key={l} value={l}>{l}</option>
                          ))}
                        </select>
                      </FieldContent>
                    </Field>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field>
                      <FieldLabel className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">Occupation</FieldLabel>
                      <FieldContent>
                        <select
                          value={occupation}
                          onChange={(e) => setOccupation(e.target.value)}
                          className="h-12 w-full rounded-2xl border border-border bg-accent/5 px-3 py-1 text-sm font-bold text-foreground outline-none transition-all focus:bg-background focus:ring-2 focus:ring-emerald-500/20 dark:bg-white/5"
                        >
                          <option value="">Select role</option>
                          {OCCUPATIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </FieldContent>
                    </Field>
                    <Field>
                      <FieldLabel className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">Years of Experience</FieldLabel>
                      <FieldContent>
                        <Input
                          type="number"
                          min={0}
                          max={50}
                          placeholder="e.g. 3"
                          value={yearsOfExperience}
                          onChange={(e) => setYearsOfExperience(e.target.value)}
                          className="h-12 rounded-2xl border-border bg-accent/5 px-4 focus:bg-background transition-all"
                        />
                      </FieldContent>
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">Learning Goal</FieldLabel>
                    <FieldContent>
                      <select
                        value={learningGoal}
                        onChange={(e) => setLearningGoal(e.target.value)}
                        className="h-12 w-full rounded-2xl border border-border bg-accent/5 px-3 py-1 text-sm font-bold text-foreground outline-none transition-all focus:bg-background focus:ring-2 focus:ring-emerald-500/20 dark:bg-white/5"
                      >
                        <option value="">Select your main goal</option>
                        {LEARNING_GOALS.map((g) => (
                          <option key={g.value} value={g.value}>{g.label}</option>
                        ))}
                      </select>
                    </FieldContent>
                  </Field>
                </FieldGroup>
              )}

              <div className="flex items-start gap-2 rounded-2xl bg-emerald-500/5 p-3 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                <Sparkles size={14} className="mt-0.5 shrink-0" />
                <p>
                  {step === 1
                    ? "Your Korean level helps our AI adjust vocabulary and grammar complexity to match your fluency."
                    : "Your background helps the AI focus on developer vocabulary, standup phrases, and workplace scenarios relevant to you."}
                </p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm font-bold text-destructive"
                >
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <p className="leading-relaxed">{error}</p>
                </motion.div>
              )}

              <div className="flex gap-3">
                {step === 2 && (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-14 flex-1 rounded-2xl font-bold"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-14 flex-1 rounded-2xl bg-emerald-600 text-base font-black text-white shadow-xl shadow-emerald-600/20 transition-all hover:bg-emerald-500 active:scale-[0.98]"
                >
                  {loading ? (
                    <>
                      <Loader2 size={20} className="mr-2 animate-spin" />
                      Creating account…
                    </>
                  ) : step === 1 ? (
                    <>
                      Next
                      <ArrowRight size={18} className="ml-2" />
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight size={18} className="ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/60" />
              </div>
              <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
                <span className="bg-card px-4 text-muted-foreground/60">Already have an account?</span>
              </div>
            </div>

            <Button
              asChild
              variant="outline"
              className="h-14 w-full rounded-2xl border-border bg-background/50 font-bold hover:bg-accent active:scale-[0.98]"
            >
              <Link href="/login">Sign in to your profile</Link>
            </Button>
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-[11px] font-medium text-muted-foreground">
          By creating an account, you agree to our{" "}
          <Link href="#" className="underline underline-offset-2 hover:text-foreground">Terms</Link> and{" "}
          <Link href="#" className="underline underline-offset-2 hover:text-foreground">Privacy Policy</Link>.
        </p>
      </motion.div>
    </main>
  )
}
