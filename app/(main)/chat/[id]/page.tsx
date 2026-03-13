import { ChatWindow } from "@/components/chat/ChatWindow"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type ChatDetailPageProps = {
  params: Promise<{ id: string }>
}

export default async function ChatDetailPage({ params }: ChatDetailPageProps) {
  const { id } = await params

  return (
    <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
      <ChatWindow
        title={`Conversation ${id}`}
        subtitle="Detailed view for a specific AI conversation thread."
        initialMessages={[
          {
            id: `conversation-${id}`,
            role: "assistant",
            content: "이번 대화에서는 자기소개와 한국 생활 적응에 대해 연습해봅시다.",
            createdAt: new Date().toISOString(),
          },
        ]}
      />
      <Card className="rounded-[2rem] border-border/60 bg-white/90 shadow-lg shadow-slate-950/5">
        <CardHeader>
          <CardTitle className="text-xl">Conversation details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>Thread id: {id}</p>
          <p>Focus: self-introduction, adaptation, and speaking confidence.</p>
          <p>
            Later you can attach backend history, prompt versions, and saved
            vocabulary here.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
