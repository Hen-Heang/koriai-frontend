"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { userApi } from "@/lib/api"
import { getUserId } from "@/lib/auth-store"

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [koreanLevel, setKoreanLevel] = useState("BEGINNER")
  const [preferredModel, setPreferredModel] = useState("gpt-5-mini")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    const userId = getUserId()
    if (!userId) return

    userApi
      .getById(userId)
      .then((data) => {
        setDisplayName(data.displayName ?? "")
        setEmail(data.email ?? "")
        setKoreanLevel(data.koreanLevel ?? "BEGINNER")
        setPreferredModel(data.preferredModel ?? "gpt-5-mini")
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const userId = getUserId()
    if (!userId) return

    setSaving(true)
    setMessage("")
    try {
      await userApi.updateProfile(userId, displayName, koreanLevel)
      await userApi.updatePreferredModel(userId, preferredModel)
      setMessage("Saved successfully.")
    } catch {
      setMessage("Failed to save. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">Settings</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">Profile and preferences</h1>
        </div>
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">Settings</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Profile and preferences</h1>
      </div>

      <Card className="rounded-[2rem] border-border/60 bg-white/90 shadow-lg shadow-slate-950/5 dark:border-white/10 dark:bg-slate-950/55">
        <CardHeader>
          <CardTitle className="text-xl">Learning profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            <FieldGroup>
              <Field orientation="responsive">
                <FieldLabel>Email</FieldLabel>
                <FieldContent>
                  <Input value={email} disabled className="opacity-60" />
                  <FieldDescription>Email cannot be changed.</FieldDescription>
                </FieldContent>
              </Field>
              <Field orientation="responsive">
                <FieldLabel>Display name</FieldLabel>
                <FieldContent>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                  />
                </FieldContent>
              </Field>
              <Field orientation="responsive">
                <FieldLabel>Korean level</FieldLabel>
                <FieldContent>
                  <select
                    value={koreanLevel}
                    onChange={(e) => setKoreanLevel(e.target.value)}
                    className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100"
                  >
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                  </select>
                </FieldContent>
              </Field>
              <Field orientation="responsive">
                <FieldLabel>Preferred AI model</FieldLabel>
                <FieldContent>
                  <Input
                    value={preferredModel}
                    onChange={(e) => setPreferredModel(e.target.value)}
                    placeholder="gpt-5-mini"
                  />
                  <FieldDescription>Model used for chat and corrections.</FieldDescription>
                </FieldContent>
              </Field>
            </FieldGroup>
            {message && (
              <p className={`text-sm ${message.includes("Failed") ? "text-red-500" : "text-emerald-600"}`}>
                {message}
              </p>
            )}
            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save preferences"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}