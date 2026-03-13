import { ChatWindow } from "@/components/chat/ChatWindow"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type ScenarioDetailPageProps = {
  params: Promise<{ id: string }>
}

export default async function ScenarioDetailPage({
  params,
}: ScenarioDetailPageProps) {
  const { id } = await params

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <ChatWindow
        title={`Scenario: ${id}`}
        subtitle="The AI should stay in character and keep the role-play focused on the selected context."
        initialMessages={[
          {
            id: `${id}-intro`,
            role: "assistant",
            content: `지금부터 ${id} 상황을 시작할게요. 먼저 당신이 하고 싶은 말을 한국어로 해보세요.`,
            createdAt: new Date().toISOString(),
          },
        ]}
      />
      <Card className="rounded-[2rem] border-border/60 bg-white/90 shadow-lg shadow-slate-950/5">
        <CardHeader>
          <CardTitle className="text-xl">Scenario briefing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <Badge variant="secondary">Role-play mode</Badge>
          <p className="text-muted-foreground">
            Use this panel for system prompt summary, vocabulary hints, level
            target, and progress objectives.
          </p>
          <div className="rounded-2xl bg-muted/70 p-4">
            <p className="font-medium text-foreground">Suggested flow</p>
            <p className="mt-2 text-muted-foreground">
              Greeting, need statement, clarification, follow-up questions,
              polite closing.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
