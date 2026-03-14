"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react"

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
      router.push("/dashboard")
    } catch (error) {
      setError(getApiErrorMessage(error, "Invalid email or password."))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.12),transparent_32%),linear-gradient(180deg,#eef6ff_0%,#ffffff_100%)] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] dark:bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.12),_transparent_24%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] sm:px-6 sm:py-16">
      <div className="w-full max-w-md">
        <div className="mb-4 flex justify-end">
          <ThemeToggle />
        </div>
        <Card className="w-full rounded-[1.75rem] border-border/60 bg-white/90 shadow-xl shadow-slate-950/5 dark:border-white/10 dark:bg-slate-900/80 sm:rounded-[2rem]">
          <CardHeader>
            <div className="mb-2 flex items-center gap-2">
              <Image
                src="/koriai-logo.svg"
                alt="KoriAI logo"
                width={28}
                height={28}
                className="rounded-md"
              />
              <span className="text-sm font-semibold tracking-widest uppercase text-teal-600 dark:text-teal-400">
                Kori AI
              </span>
            </div>
            <CardTitle className="text-2xl font-bold sm:text-3xl dark:text-white">
              Welcome back
            </CardTitle>
            <p className="text-sm text-muted-foreground dark:text-slate-400">
              Continue your Korean practice streak and resume your AI sessions.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <FieldGroup>
                <Field>
                  <FieldLabel>Email</FieldLabel>
                  <FieldContent>
                    <Input
                      type="email"
                      name="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </FieldContent>
                </Field>
                <Field>
                  <FieldLabel>Password</FieldLabel>
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
                        className="pr-9"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </FieldContent>
                </Field>
              </FieldGroup>

              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
                  <AlertCircle className="size-4 shrink-0" />
                  {error}
                </div>
              )}

              <Button className="w-full h-10 text-base" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Signing in…
                  </>
                ) : "Sign in"}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t dark:border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <p className="text-center text-sm text-muted-foreground dark:text-slate-400">
              New here?{" "}
              <Link
                href="/register"
                className="font-semibold text-teal-600 hover:underline dark:text-teal-400"
              >
                Create an account
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
