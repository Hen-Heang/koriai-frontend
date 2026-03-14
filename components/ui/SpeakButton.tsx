"use client"

import { useState } from "react"
import { Loader2, Volume2 } from "lucide-react"
import { ttsApi } from "@/lib/api"

interface SpeakButtonProps {
  text: string
  voice?: string
  className?: string
  playbackRate?: number
  title?: string
}

export function SpeakButton({
  text,
  voice = "nova",
  className = "",
  playbackRate = 1,
  title = "Listen to pronunciation",
}: SpeakButtonProps) {
  const [loading, setLoading] = useState(false)
  const [playing, setPlaying] = useState(false)

  async function handleSpeak() {
    if (loading || playing || !text) return
    setLoading(true)
    try {
      const url = await ttsApi.speak(text, voice)
      const audio = new Audio(url)
      audio.playbackRate = playbackRate
      setLoading(false)
      setPlaying(true)
      audio.play()
      audio.onended = () => {
        setPlaying(false)
        URL.revokeObjectURL(url)
      }
    } catch {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleSpeak}
      disabled={loading || playing}
      title={title}
      className={`inline-flex items-center justify-center rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50 ${className}`}
    >
      {loading ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Volume2 className={`size-3.5 ${playing ? "text-teal-500" : ""}`} />
      )}
    </button>
  )
}
