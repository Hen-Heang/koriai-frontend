"use client"

import { memo, useMemo, useState } from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { ChatMessage } from "@/lib/types"
import { SpeakButton } from "@/components/ui/SpeakButton"
import { motion } from "motion/react"
import { Check, CheckCircle2, Copy, Languages, Sparkles } from "lucide-react"
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

function SmartText({ text, enabled = true }: { text: string; enabled?: boolean }) {
  // While a reply is still streaming we render plain text instead of wrapping
  // every word in a Radix popover — mounting hundreds of poppers per token
  // flush is what makes long streaming replies feel janky.
  if (!enabled) return <>{text}</>

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

function renderInline(raw: string, isUserBubble = false, peek = true) {
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
        return <SmartText key={i} text={token.text} enabled={peek} />
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

function renderBlocks(content: string, isUserBubble = false, peek = true) {
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
            {renderInline(block.text, isUserBubble, peek)}
          </Tag>
        )
      }
      case "bullet":
        return (
          <ul key={idx} className="space-y-1.5 pl-4 text-[14px]">
            {block.items.map((item, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-current opacity-40" />
                <span className="leading-relaxed">{renderInline(item, isUserBubble, peek)}</span>
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
                <span className="leading-relaxed">{renderInline(item, isUserBubble, peek)}</span>
              </li>
            ))}
          </ol>
        )
      case "hr":
        return <hr key={idx} className="border-border/40 my-4" />
      case "paragraph":
        return (
          <p key={idx} className="text-[14px] font-medium leading-relaxed">
            {renderInline(block.text, isUserBubble, peek)}
          </p>
        )
    }
  })
}

// ─── Component ────────────────────────────────────────────────────────────────
function MessageBubbleImpl({ message, live = false }: { message: ChatMessage; live?: boolean }) {
  const isUser = message.role === "user"
  const [copied, setCopied] = useState(false)

  // Parse markdown once per content change instead of on every parent re-render.
  // `live` (a reply still streaming in) renders plain text — interactive
  // word-lookup is switched on once the message finishes.
  const body = useMemo(
    () => renderBlocks(message.content, isUser, !live),
    [message.content, isUser, live]
  )

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error("Couldn't copy to clipboard")
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className={cn(
        "group -mx-4 flex w-[calc(100%+2rem)] gap-4 px-4 py-8 sm:-mx-8 sm:w-[calc(100%+4rem)] sm:px-8 sm:py-10",
        !isUser && "bg-accent/5 dark:bg-slate-900/40"
      )}
    >
      <div className="mx-auto flex w-full max-w-3xl gap-4 sm:gap-6">
        {/* Avatar Section */}
        <div className="shrink-0 pt-1">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-xl text-[10px] font-black text-white shadow-sm sm:h-9 sm:w-9",
              isUser
                ? "bg-slate-500"
                : "bg-linear-to-br from-blue-500 to-indigo-600"
            )}
          >
            {isUser ? (
              <span className="text-[14px]">👤</span>
            ) : (
              <Sparkles size={18} strokeWidth={2.5} />
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex items-center justify-between">
             <span className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
               {isUser ? "You" : "KoriAI Tutor"}
             </span>
             <span className="text-[10px] font-bold text-muted-foreground/20">
               {new Date(message.createdAt).toLocaleTimeString([], {
                 hour: "2-digit",
                 minute: "2-digit",
               })}
             </span>
          </div>

          <article className="prose prose-sm dark:prose-invert max-w-none text-foreground leading-relaxed">
            <div className="space-y-4">
              {body}
            </div>
          </article>

          {/* Correction card - High End Inline */}
          {message.correction ? (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mt-2 overflow-hidden rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] shadow-sm"
            >
              <div className="flex items-center gap-2 border-b border-amber-500/10 bg-amber-500/5 px-4 py-2.5">
                <CheckCircle2 size={14} className="text-amber-600 dark:text-amber-400" strokeWidth={2.5} />
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-300">Suggested Improvement</p>
              </div>
              <div className="p-4">
                <div className="text-[14px] font-bold leading-relaxed text-amber-900 dark:text-amber-100">
                  {renderInline(message.correction)}
                </div>
                {message.translation && (
                  <div className="mt-3 flex items-start gap-3 rounded-xl bg-white/50 p-3 dark:bg-black/30">
                    <Languages size={14} className="mt-0.5 shrink-0 text-amber-600/60" />
                    <p className="text-[12px] font-medium leading-relaxed text-amber-800/80 dark:text-amber-200/70 italic">
                      {message.translation}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : null}

          {/* Action row - Minimal / Appears on hover */}
          {!isUser && (
            <div className="mt-2 flex items-center gap-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
              <SpeakButton
                text={message.content}
                className="h-8 w-8 rounded-lg border border-border/60 bg-background/50 p-0 text-muted-foreground hover:bg-accent hover:text-foreground"
              />
              <button
                type="button"
                onClick={handleCopy}
                aria-label={copied ? "Copied" : "Copy message"}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-background/50 text-muted-foreground transition-all hover:bg-accent hover:text-foreground active:scale-90"
              >
                {copied ? (
                  <Check size={15} strokeWidth={2.5} className="text-blue-500" />
                ) : (
                  <Copy size={15} strokeWidth={2.5} />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// Memoized so a token arriving on the streaming reply only re-renders that one
// bubble — earlier messages keep a stable object reference and are skipped.
export const MessageBubble = memo(MessageBubbleImpl)
