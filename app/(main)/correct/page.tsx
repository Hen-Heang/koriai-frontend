import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

export default function CorrectPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">
          Correction
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          Sentence correction workspace
        </h1>
      </div>

      <Card className="rounded-[2rem] border-border/60 bg-white/90 shadow-lg shadow-slate-950/5">
        <CardHeader>
          <CardTitle className="text-xl">Submit writing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            className="min-h-48 resize-none rounded-3xl"
            placeholder="Paste a Korean sentence or paragraph to get corrections and explanations."
          />
          <div className="flex justify-end">
            <Button>Analyze sentence</Button>
          </div>
          <div className="rounded-3xl bg-muted/70 p-4 text-sm">
            <p className="font-medium text-foreground">Expected frontend behavior</p>
            <p className="mt-2 text-muted-foreground">
              Show the original sentence, corrected sentence, grammar notes, and a
              more natural native-like alternative.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
