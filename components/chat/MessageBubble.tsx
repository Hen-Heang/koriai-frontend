import { cn } from "@/lib/utils"
import type { ChatMessage } from "@/lib/types"
import { SpeakButton } from "@/components/ui/SpeakButton"

// ─── Inline parser ────────────────────────────────────────────────────────────
// Handles: **bold**, *italic*, `inline code`, plain text
type InlineToken =
  | { type: "bold"; text: string }
  | { type: "italic"; text: string }
  | { type: "code"; text: string }
  | { type: "text"; text: string }

function parseInline(raw: string): InlineToken[] {
  const tokens: InlineToken[] = []
  // Matches **bold**, *italic*, `code` in order
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`)/g
  let last = 0
  let match: RegExpExecArray | null

  while ((match = re.exec(raw)) !== null) {
    if (match.index > last) {
      tokens.push({ type: "text", text: raw.slice(last, match.index) })
    }
    if (match[0].startsWith("**")) {
      tokens.push({ type: "bold", text: match[2] })
    } else if (match[0].startsWith("*")) {
      tokens.push({ type: "italic", text: match[3] })
    } else {
      tokens.push({ type: "code", text: match[4] })
    }
    last = re.lastIndex
  }

  if (last < raw.length) {
    tokens.push({ type: "text", text: raw.slice(last) })
  }

  return tokens
}

function renderInline(raw: string, isUserBubble = false) {
  return parseInline(raw).map((token, i) => {
    switch (token.type) {
      case "bold":
        return <strong key={i} className="font-semibold">{token.text}</strong>
      case "italic":
        return <em key={i} className="italic">{token.text}</em>
      case "code":
        return (
          <code
            key={i}
            className={cn(
              "rounded px-1.5 py-0.5 font-mono text-[0.8em]",
              isUserBubble
                ? "bg-white/20 text-white"
                : "bg-violet-50 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"
            )}
          >
            {token.text}
          </code>
        )
      default:
        return <span key={i}>{token.text}</span>
    }
  })
}

// ─── Block parser ─────────────────────────────────────────────────────────────
type Block =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "bullet"; items: string[] }
  | { type: "ordered"; items: string[] }
  | { type: "hr" }
  | { type: "paragraph"; text: string }

function parseBlocks(content: string): Block[] {
  const lines = content.split("\n")
  const blocks: Block[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i].trimEnd()
    const trimmed = line.trim()

    // Blank line → skip
    if (!trimmed) {
      i++
      continue
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      blocks.push({ type: "hr" })
      i++
      continue
    }

    // Heading
    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/)
    if (headingMatch) {
      const level = Math.min(headingMatch[1].length, 3) as 1 | 2 | 3
      blocks.push({ type: "heading", level, text: headingMatch[2] })
      i++
      continue
    }

    // Bullet list — collect consecutive bullet lines
    if (/^[-*•]\s+/.test(trimmed)) {
      const items: string[] = []
      while (i < lines.length && /^[-*•]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*•]\s+/, ""))
        i++
      }
      blocks.push({ type: "bullet", items })
      continue
    }

    // Numbered list — collect consecutive numbered lines
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ""))
        i++
      }
      blocks.push({ type: "ordered", items })
      continue
    }

    // Paragraph — collect until blank line or structural element
    const paragraphLines: string[] = []
    while (i < lines.length) {
      const cur = lines[i].trim()
      if (
        !cur ||
        /^(#{1,3})\s+/.test(cur) ||
        /^[-*•]\s+/.test(cur) ||
        /^\d+\.\s+/.test(cur) ||
        /^(-{3,}|\*{3,}|_{3,})$/.test(cur)
      ) {
        break
      }
      paragraphLines.push(lines[i].trimEnd())
      i++
    }
    if (paragraphLines.length) {
      blocks.push({ type: "paragraph", text: paragraphLines.join(" ") })
    }
  }

  return blocks
}

function renderBlocks(content: string, isUserBubble = false) {
  const blocks = parseBlocks(content)

  return blocks.map((block, idx) => {
    switch (block.type) {
      case "heading": {
        const Tag = (`h${block.level}`) as "h1" | "h2" | "h3"
        const cls = cn(
          "font-semibold leading-tight",
          block.level === 1 && "text-base mt-1",
          block.level === 2 && "text-sm mt-1",
          block.level === 3 && "text-sm mt-0.5 text-muted-foreground"
        )
        return (
          <Tag key={idx} className={cls}>
            {renderInline(block.text, isUserBubble)}
          </Tag>
        )
      }

      case "bullet":
        return (
          <ul key={idx} className="space-y-1 pl-4 text-sm">
            {block.items.map((item, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-[0.35em] h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-50" />
                <span>{renderInline(item, isUserBubble)}</span>
              </li>
            ))}
          </ul>
        )

      case "ordered":
        return (
          <ol key={idx} className="space-y-1 pl-4 text-sm">
            {block.items.map((item, i) => (
              <li key={i} className="flex gap-2">
                <span className="shrink-0 font-mono text-xs font-semibold opacity-60 mt-[0.15em]">
                  {i + 1}.
                </span>
                <span>{renderInline(item, isUserBubble)}</span>
              </li>
            ))}
          </ol>
        )

      case "hr":
        return (
          <hr
            key={idx}
            className="border-current opacity-10"
          />
        )

      case "paragraph":
        return (
          <p key={idx} className="text-sm leading-7">
            {renderInline(block.text, isUserBubble)}
          </p>
        )
    }
  })
}

// ─── Component ────────────────────────────────────────────────────────────────
export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user"

  return (
    <div className={cn("flex items-start gap-3", isUser && "flex-row-reverse")}>
      {/* Avatar */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm",
          isUser
            ? "bg-emerald-500"
            : "bg-linear-to-br from-violet-500 to-indigo-600"
        )}
      >
        {isUser ? "You" : "AI"}
      </div>

      {/* Content column */}
      <div className={cn("flex max-w-[75%] flex-col gap-1.5", isUser && "items-end")}>
        {/* Bubble */}
        <article
          className={cn(
            "rounded-2xl px-4 py-3 shadow-sm",
            isUser
              ? "rounded-tr-sm bg-emerald-500 text-white dark:bg-emerald-600"
              : "rounded-tl-sm border border-border/60 bg-card text-foreground dark:border-white/10 dark:bg-slate-900/80"
          )}
        >
          <div className="space-y-2.5">
            {renderBlocks(message.content, isUser)}
          </div>
        </article>

        {/* Correction card */}
        {message.correction ? (
          <div className="w-full rounded-xl border border-amber-200/70 bg-amber-50/80 p-3 text-sm dark:border-amber-400/20 dark:bg-amber-500/10">
            <p className="font-semibold text-amber-800 dark:text-amber-300">Correction</p>
            <p className="mt-1 text-amber-700 dark:text-amber-400/90">
              {renderInline(message.correction)}
            </p>
            {message.translation ? (
              <p className="mt-1.5 text-xs text-amber-600/80 dark:text-amber-400/70">
                Translation: {message.translation}
              </p>
            ) : null}
          </div>
        ) : null}

        {/* Speak + Timestamp */}
        <div className={cn("flex items-center gap-1 px-1", isUser && "flex-row-reverse")}>
          {!isUser && <SpeakButton text={message.content} />}
          <span className="text-[11px] text-muted-foreground/60">
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>
    </div>
  )
}
