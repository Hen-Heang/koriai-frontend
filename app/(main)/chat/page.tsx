import { ChatWindow } from "@/components/chat/ChatWindow"

const messages = [
  {
    id: "chat-1",
    role: "assistant" as const,
    content: "안녕하세요. 오늘은 어떤 상황에서 한국어를 연습하고 싶어요?",
    translation: "Hello. What situation would you like to practice Korean for today?",
    createdAt: new Date().toISOString(),
  },
]

export default function ChatPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">Chat</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          AI Korean chat tutor
        </h1>
      </div>
      <ChatWindow
        title="General Practice"
        subtitle="Conversation mode with inline corrections and translation support."
        initialMessages={messages}
      />
    </div>
  )
}
