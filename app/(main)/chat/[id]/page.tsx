import { ChatWindow } from "@/components/chat/ChatWindow"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type ChatDetailPageProps = {
  params: Promise<{ id: string }>
}

export default async function ChatDetailPage({ params }: ChatDetailPageProps) {
  const { id } = await params
  const conversationId = Number(id)

  return (
    <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
      <ChatWindow
        title={`Conversation ${id}`}
        subtitle="Detailed view for a specific AI conversation thread."
        conversationId={Number.isFinite(conversationId) ? conversationId : undefined}
      />
      <Card className="rounded-[2rem] border-border/60 bg-white/90 shadow-lg shadow-slate-950/5">
        <CardHeader>
          <CardTitle className="text-xl">Conversation details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>Thread id: {id}</p>
          <p>Messages and replies are loaded from your backend conversation history.</p>
          <p>
            This panel can be extended with prompt versions, metadata, and
            saved vocabulary extracted from this thread.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
