"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { AlertCircle, Eye, EyeOff, Loader2, ArrowRight, ShieldCheck } from "lucide-react"
import { motion } from "motion/react"

import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { authApi, getApiErrorMessage } from "@/lib/api"
import { setAuth } from "@/lib/auth-store"
import { GoogleSignInButton } from "@/components/google-sign-in-button"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const data = await authApi.login({ email, password })
      setAuth(data.accessToken, data.userId, data.email)
      router.push("/goals")
    } catch (error) {
      setError(getApiErrorMessage(error, "Invalid email or password."))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12 selection:bg-blue-500/30 sm:px-6">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-24 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-blue-500/10 blur-[100px] dark:bg-blue-500/5" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-sky-500/10 blur-[100px] dark:bg-sky-500/5" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[440px]"
      >
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl shadow-lg shadow-blue-600/20 transition-transform group-hover:scale-105">
              <Image src="/hengo-icon.svg" alt="" width={40} height={40} className="h-full w-full" />
            </div>
            <span className="text-xl font-black tracking-tight text-foreground">Hengo</span>
          </Link>
          <ThemeToggle />
        </div>

        <Card className="overflow-hidden rounded-[2.5rem] border-border bg-card/80 shadow-2xl backdrop-blur-xl dark:bg-slate-900/60">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-500" />
          
          <CardHeader className="space-y-2 pb-8 pt-10">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
              <ShieldCheck size={14} strokeWidth={3} />
              Secure Login
            </div>
            <CardTitle className="text-3xl font-black tracking-tight text-foreground">
              Welcome back
            </CardTitle>
            <p className="text-sm font-medium leading-relaxed text-muted-foreground">
              Continue your journey to Korean fluency with your personal AI tutor.
            </p>
          </CardHeader>

          <CardContent className="space-y-8 pb-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              <FieldGroup className="space-y-4">
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
                      autoFocus
                      className="h-12 rounded-2xl border-border bg-accent/5 px-4 focus:bg-background transition-all"
                    />
                  </FieldContent>
                </Field>
                <Field>
                  <div className="flex items-center justify-between">
                    <FieldLabel className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">Password</FieldLabel>
                    <Link href="#" className="text-[11px] font-bold text-blue-600 hover:text-blue-500 dark:text-blue-400">
                      Forgot?
                    </Link>
                  </div>
                  <FieldContent>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        autoComplete="current-password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
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

              <Button 
                type="submit" 
                disabled={loading}
                className="h-14 w-full rounded-2xl bg-blue-600 text-base font-black text-white shadow-xl shadow-blue-600/20 transition-all hover:bg-blue-500 active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="mr-2 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={18} className="ml-2" />
                  </>
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/60" />
              </div>
              <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
                <span className="bg-card px-4 text-muted-foreground/60">Or continue with</span>
              </div>
            </div>

            <GoogleSignInButton onError={setError} redirectTo="/goals" />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/60" />
              </div>
              <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
                <span className="bg-card px-4 text-muted-foreground/60">New to Hengo?</span>
              </div>
            </div>

            <Button
              asChild 
              variant="outline" 
              className="h-14 w-full rounded-2xl border-border bg-background/50 font-bold hover:bg-accent active:scale-[0.98]"
            >
              <Link href="/register">Create an account</Link>
            </Button>
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-[11px] font-medium text-muted-foreground">
          By signing in, you agree to our{" "}
          <Link href="#" className="underline underline-offset-2 hover:text-foreground">Terms</Link> and{" "}
          <Link href="#" className="underline underline-offset-2 hover:text-foreground">Privacy Policy</Link>.
        </p>
      </motion.div>
    </main>
  )
}
