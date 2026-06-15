"use client"

import { useEffect, useRef, useState } from "react"

// Minimal typing for the browser Web Speech API (no DOM lib types ship for it).
type BrowserRecognitionErrorEvent = {
  error?: string
}

type BrowserRecognition = {
  continuous: boolean
  interimResults: boolean
  lang: string
  onstart: (() => void) | null
  onresult:
    | ((event: {
        results: ArrayLike<ArrayLike<{ transcript: string }>>
        resultIndex: number
      }) => void)
    | null
  onend: (() => void) | null
  onerror: ((event: BrowserRecognitionErrorEvent) => void) | null
  start: () => void
  stop: () => void
}

declare global {
  interface Window {
    SpeechRecognition?: new () => BrowserRecognition
    webkitSpeechRecognition?: new () => BrowserRecognition
  }
}

export type RecognitionStatus = "idle" | "listening" | "finished"

type UseSpeechRecognitionOptions = {
  lang?: string
  /** Called with the final transcript when a capture completes. */
  onResult?: (transcript: string) => void
}

/**
 * Wraps the browser ko-KR speech recognition used across speaking-style
 * features. Returns the live transcript plus controls; falls back gracefully
 * to manual entry when the API is unavailable (e.g. Firefox, some webviews).
 */
export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}) {
  const { lang = "ko-KR", onResult } = options

  const [status, setStatus] = useState<RecognitionStatus>("idle")
  const [transcript, setTranscript] = useState("")
  const [error, setError] = useState("")
  const recognitionRef = useRef<BrowserRecognition | null>(null)
  const onResultRef = useRef(onResult)

  useEffect(() => {
    onResultRef.current = onResult
  }, [onResult])

  const supported =
    typeof window !== "undefined" &&
    Boolean(window.SpeechRecognition ?? window.webkitSpeechRecognition)

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const Recognition =
      window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!Recognition) {
      return
    }

    const recognition = new Recognition()
    recognition.lang = lang
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => {
      setStatus("listening")
      setError("")
    }

    recognition.onresult = (event) => {
      const result = event.results[event.resultIndex]
      const spokenText = Array.from(result)
        .map((item) => item.transcript)
        .join(" ")
        .trim()

      setTranscript(spokenText)
      setStatus("finished")
      onResultRef.current?.(spokenText)
    }

    recognition.onend = () => {
      setStatus((current) => (current === "listening" ? "idle" : current))
    }

    recognition.onerror = (event) => {
      setStatus("idle")

      if (event.error === "not-allowed") {
        setError(
          "Microphone permission is blocked. Allow microphone access in the browser and try again."
        )
        return
      }

      if (event.error === "no-speech") {
        setError(
          "No speech was detected. Try holding the phone closer and speaking once clearly."
        )
        return
      }

      setError(
        "Speech capture failed. You can still type or edit the transcript manually."
      )
    }

    recognitionRef.current = recognition

    return () => {
      recognition.stop()
      recognitionRef.current = null
    }
  }, [lang])

  function start() {
    if (!recognitionRef.current) {
      setError(
        "Speech recognition is not available here. Use the manual transcript box instead."
      )
      return false
    }

    setError("")
    setTranscript("")

    try {
      recognitionRef.current.start()
      return true
    } catch {
      setStatus("idle")
      setError("Could not start microphone capture. Wait a moment and try again.")
      return false
    }
  }

  function stop() {
    recognitionRef.current?.stop()
    setStatus("idle")
  }

  function reset() {
    recognitionRef.current?.stop()
    setStatus("idle")
    setTranscript("")
    setError("")
  }

  return {
    supported,
    status,
    transcript,
    setTranscript,
    error,
    setError,
    start,
    stop,
    reset,
  }
}
