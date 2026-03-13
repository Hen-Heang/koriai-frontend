import Link from "next/link"

import { ThemeToggle } from "@/components/theme-toggle"
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

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.12),_transparent_32%),linear-gradient(180deg,_#f8fafc_0%,_#ffffff_100%)] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] dark:bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.12),_transparent_24%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] sm:px-6 sm:py-16">
      <div className="w-full max-w-lg">
        <div className="mb-4 flex justify-end">
          <ThemeToggle />
        </div>
        <Card className="w-full rounded-[1.75rem] border-border/60 bg-white/90 shadow-xl shadow-slate-950/5 dark:border-white/10 dark:bg-slate-900/80 sm:rounded-[2rem]">
          <CardHeader>
            <CardTitle className="text-2xl sm:text-3xl dark:text-white">
              Create account
            </CardTitle>
            <p className="text-sm text-muted-foreground dark:text-slate-300">
              Start with a profile built for Korean chat, correction, and
              spaced repetition.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <FieldGroup>
              <Field orientation="responsive">
                <FieldLabel>Full name</FieldLabel>
                <FieldContent>
                  <Input placeholder="Your name" />
                </FieldContent>
              </Field>
              <Field orientation="responsive">
                <FieldLabel>Email</FieldLabel>
                <FieldContent>
                  <Input type="email" placeholder="you@example.com" />
                </FieldContent>
              </Field>
              <Field orientation="responsive">
                <FieldLabel>Learning goal</FieldLabel>
                <FieldContent>
                  <Input placeholder="TOPIK, work, daily life, conversation..." />
                  <FieldDescription>
                    This can personalize dashboards and scenario recommendations
                    later.
                  </FieldDescription>
                </FieldContent>
              </Field>
              <Field orientation="responsive">
                <FieldLabel>Password</FieldLabel>
                <FieldContent>
                  <Input type="password" placeholder="Create a password" />
                </FieldContent>
              </Field>
            </FieldGroup>
            <Button className="w-full">Create account</Button>
            <p className="text-sm text-muted-foreground dark:text-slate-300">
              Already registered?{" "}
              <Link
                href="/login"
                className="font-medium text-foreground underline underline-offset-4"
              >
                Login
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
