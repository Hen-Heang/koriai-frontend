"use client"

import { cn } from "@/lib/utils"
import type { ChatMessage } from "@/lib/types"
import { SpeakButton } from "@/components/ui/SpeakButton"
import { motion } from "motion/react"
import { CheckCircle2, Languages } from "lucide-react"
import { SmartPeek } from "@/components/ui/SmartPeek"

// ─── Inline parser ────────────────────────────────────────────────────────────
type InlineToken =
  | { type: "bold"; text: string }
  | { type: "italic"; text: string }
  | { type: "code"; text: string }
  | { type: "text"; text: string }

function parseInline(raw: string): InlineToken[] {
  const tokens: InlineToken[] = []
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

function SmartText({ text }: { text: string }) {
  // Split by whitespace but keep the whitespace in the results
  const words = text.split(/(\s+)/)
  
  return words.map((word, i) => {
    if (!word.trim()) return <span key={i}>{word}</span>
    
    // Remove punctuation for the lookup but keep it for display
    const cleanWord = word.replace(/[.,!??"']/g, "")
    
    return (
      <SmartPeek key={i} word={cleanWord}>
        {word}
      </SmartPeek>
    )
  })
}

function renderInline(raw: string, isUserBubble = false) {
  return parseInline(raw).map((token, i) => {
    switch (token.type) {
      case "bold":
        return <strong key={i} className="font-bold">{token.text}</strong>
      case "italic":
        return <em key={i} className="italic">{token.text}</em>
      case "code":
        return (
          <code
            key={i}
            className={cn(
              "rounded-md px-1.5 py-0.5 font-mono text-[0.85em]",
              isUserBubble
                ? "bg-white/20 text-white"
                : "bg-muted text-foreground ring-1 ring-border/50"
            )}
          >
            {token.text}
          </code>
        )
      default:
        return <SmartText key={i} text={token.text} />
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

    if (!trimmed) {
      i++
      continue
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      blocks.push({ type: "hr" })
      i++
      continue
    }

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/)
    if (headingMatch) {
      const level = Math.min(headingMatch[1].length, 3) as 1 | 2 | 3
      blocks.push({ type: "heading", level, text: headingMatch[2] })
      i++
      continue
    }

    if (/^[-*•]\s+/.test(trimmed)) {
      const items: string[] = []
      while (i < lines.length && /^[-*•]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*•]\s+/, ""))
        i++
      }
      blocks.push({ type: "bullet", items })
      continue
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ""))
        i++
      }
      blocks.push({ type: "ordered", items })
      continue
    }

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
        return (
          <Tag key={idx} className={cn(
            "font-black tracking-tight",
            block.level === 1 ? "text-lg" : "text-base",
            "mt-2 mb-1"
          )}>
            {renderInline(block.text, isUserBubble)}
          </Tag>
        )
      }
      case "bullet":
        return (
          <ul key={idx} className="space-y-1.5 pl-4 text-[14px]">
            {block.items.map((item, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-current opacity-40" />
                <span className="leading-relaxed">{renderInline(item, isUserBubble)}</span>
              </li>
            ))}
          </ul>
        )
      case "ordered":
        return (
          <ol key={idx} className="space-y-1.5 pl-4 text-[14px]">
            {block.items.map((item, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="shrink-0 font-black text-[10px] opacity-40 mt-1">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{renderInline(item, isUserBubble)}</span>
              </li>
            ))}
          </ol>
        )
      case "hr":
        return <hr key={idx} className="border-border/40 my-4" />
      case "paragraph":
        return (
          <p key={idx} className="text-[14px] font-medium leading-relaxed">
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
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className={cn("flex items-end gap-2.5", isUser && "flex-row-reverse")}
    >
      {/* Avatar - Compact */}
      <div
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[10px] font-black text-white shadow-sm mb-1",
          isUser
            ? "bg-emerald-600"
            : "bg-linear-to-br from-violet-500 to-indigo-600"
        )}
      >
        {isUser ? "U" : "AI"}
      </div>

      {/* Content column */}
      <div
        className={cn(
          "flex min-w-0 flex-col gap-1.5",
          isUser ? "max-w-[85%] items-end sm:max-w-[70%]" : "max-w-[85%] sm:max-w-[75%]"
        )}
      >
        {/* Bubble */}
        <article
          className={cn(
            "w-full rounded-[1.5rem] px-4 py-3 shadow-sm",
            isUser
              ? "rounded-br-md bg-emerald-600 text-white"
              : "rounded-bl-md border border-border bg-card text-foreground dark:bg-slate-900/60"
          )}
        >
          <div className="space-y-3">
            {renderBlocks(message.content, isUser)}
          </div>
        </article>

        {/* Correction card - High End */}
        {message.correction ? (
          <div className="w-full overflow-hidden rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] shadow-sm">
            <div className="flex items-center gap-2 border-b border-amber-500/10 bg-amber-500/5 px-3 py-2">
              <CheckCircle2 size={14} className="text-amber-600 dark:text-amber-400" strokeWidth={2.5} />
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-300">Correction</p>
            </div>
            <div className="p-3">
              <div className="text-[13px] font-bold leading-relaxed text-amber-900 dark:text-amber-100">
                {renderInline(message.correction)}
              </div>
              {message.translation && (
                <div className="mt-2 flex items-start gap-2 rounded-lg bg-white/40 p-2 dark:bg-black/20">
                  <Languages size={12} className="mt-0.5 shrink-0 text-amber-600/60" />
                  <p className="text-[11px] font-medium leading-normal text-amber-800/80 dark:text-amber-200/70">
                    {message.translation}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Action row - Minimal */}
        <div className={cn("flex items-center gap-3 px-1", isUser && "flex-row-reverse")}>
          {!isUser && <SpeakButton text={message.content} className="h-6 w-6 rounded-lg bg-accent/50 p-0 text-muted-foreground hover:bg-accent hover:text-foreground" />}
          <span className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground/40">
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>
    </motion.div>
  )
}
