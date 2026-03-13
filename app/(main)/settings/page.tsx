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

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">
          Settings
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          Profile and preferences
        </h1>
      </div>

      <Card className="rounded-[2rem] border-border/60 bg-white/90 shadow-lg shadow-slate-950/5">
        <CardHeader>
          <CardTitle className="text-xl">Learning profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <FieldGroup>
            <Field orientation="responsive">
              <FieldLabel>Display name</FieldLabel>
              <FieldContent>
                <Input defaultValue="Minh" />
              </FieldContent>
            </Field>
            <Field orientation="responsive">
              <FieldLabel>Daily goal</FieldLabel>
              <FieldContent>
                <Input defaultValue="45 minutes" />
                <FieldDescription>
                  This will drive the dashboard ring and reminder strategy.
                </FieldDescription>
              </FieldContent>
            </Field>
            <Field orientation="responsive">
              <FieldLabel>Primary focus</FieldLabel>
              <FieldContent>
                <Input defaultValue="Conversation + writing correction" />
              </FieldContent>
            </Field>
          </FieldGroup>
          <div className="flex justify-end">
            <Button>Save preferences</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
