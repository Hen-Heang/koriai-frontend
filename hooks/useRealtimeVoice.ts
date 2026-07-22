"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { realtimeApi } from "@/lib/api"
import type { RealtimeBootstrap } from "@/lib/api/realtime"
import { buildBootstrapEvents, responseCreate } from "@/lib/realtime/events"
import {
  decideCorrection,
  DEFAULT_CORRECTION_POLICY,
  initialCorrectionState,
  type CorrectionPolicy,
} from "@/lib/realtime/correction-policy"
import { shouldAnalyzeKoreanTurn } from "@/lib/learning/korean-text"
import type { TurnAnalysis } from "@/lib/ai/schemas/turn-analysis"

const EMPTY_BOOTSTRAP: RealtimeBootstrap = { history: [], createInitialResponse: true }

export type RealtimeVoicePhase =
  | "idle"
  | "connecting"
  | "listening"
  | "thinking"
  | "speaking"
  | "error"

export interface RealtimeVoiceTurn {
  id: string
  role: "user" | "assistant"
  text: string
  interrupted?: boolean
}

// One analyzed learner voice turn: the spoken Korean plus its structured
// analysis. Used for the live correction notice and the post-session report.
export interface VoiceCorrection {
  itemId: string
  originalText: string
  analysis: TurnAnalysis
}

type RealtimeServerEvent = {
  type?: string
  item_id?: string
  response_id?: string
  delta?: string
  transcript?: string
  error?: { message?: string }
  response?: {
    status?: string
    status_details?: { error?: { message?: string } } | null
  }
}

type UseRealtimeVoiceOptions = {
  conversationId?: string
  technicalMode: boolean
  // How aggressively to surface live corrections (fluency / balanced / accuracy).
  correctionPolicy?: CorrectionPolicy
  onTurnComplete?: (role: "user" | "assistant", text: string) => void | Promise<void>
}

function readableVoiceError(error: unknown): string {
  if (error instanceof DOMException && error.name === "NotAllowedError") {
    return "Microphone access is blocked. Allow microphone permission and try again."
  }
  if (error instanceof DOMException && error.name === "NotFoundError") {
    return "No microphone was found on this device."
  }
  if (error instanceof Error && error.message) return error.message
  return "The live voice session could not start."
}

export function useRealtimeVoice({
  conversationId,
  technicalMode,
  correctionPolicy = DEFAULT_CORRECTION_POLICY,
  onTurnComplete,
}: UseRealtimeVoiceOptions) {
  const [phase, setPhase] = useState<RealtimeVoicePhase>("idle")
  const [turns, setTurns] = useState<RealtimeVoiceTurn[]>([])
  const [userCaption, setUserCaption] = useState("")
  const [assistantCaption, setAssistantCaption] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [supported, setSupported] = useState(false)
  const [model, setModel] = useState<string | null>(null)
  const [learnerLevel, setLearnerLevel] = useState<string | null>(null)
  const [speechRate, setSpeechRate] = useState<number | null>(null)
  const [scenarioTitle, setScenarioTitle] = useState<string | null>(null)
  // Compact correction shown live during the session (per correction policy);
  // null when nothing is currently surfaced.
  const [liveCorrection, setLiveCorrection] = useState<VoiceCorrection | null>(null)

  const peerRef = useRef<RTCPeerConnection | null>(null)
  const bootstrapRef = useRef<RealtimeBootstrap>(EMPTY_BOOTSTRAP)
  const channelRef = useRef<RTCDataChannel | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const startAbortRef = useRef<AbortController | null>(null)
  const closingRef = useRef(false)
  const mountedRef = useRef(true)
  const onTurnCompleteRef = useRef(onTurnComplete)
  const persistedTurnIdsRef = useRef(new Set<string>())
  const currentUserRef = useRef<{ id: string; text: string } | null>(null)
  const currentAssistantRef = useRef<{ id: string; text: string } | null>(null)

  useEffect(() => {
    onTurnCompleteRef.current = onTurnComplete
  }, [onTurnComplete])

  useEffect(() => {
    setSupported(
      typeof window !== "undefined" &&
        typeof RTCPeerConnection !== "undefined" &&
        Boolean(navigator.mediaDevices?.getUserMedia),
    )
  }, [])

  const closeConnection = useCallback(() => {
    closingRef.current = true
    startAbortRef.current?.abort()
    startAbortRef.current = null

    channelRef.current?.close()
    channelRef.current = null

    peerRef.current?.close()
    peerRef.current = null

    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.srcObject = null
      audioRef.current.remove()
      audioRef.current = null
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      closeConnection()
    }
  }, [closeConnection])

  const commitTurn = useCallback(
    (turn: RealtimeVoiceTurn, persist: boolean) => {
      const text = turn.text.replace(/\s+/g, " ").trim()
      if (!text) return
      const normalized = { ...turn, text }

      setTurns((current) => {
        const existingIndex = current.findIndex((item) => item.id === normalized.id)
        if (existingIndex === -1) return [...current, normalized]
        return current.map((item, index) => (index === existingIndex ? normalized : item))
      })

      if (!persist || persistedTurnIdsRef.current.has(normalized.id)) return
      persistedTurnIdsRef.current.add(normalized.id)
      void onTurnCompleteRef.current?.(normalized.role, normalized.text)
    },
    [],
  )

  const handleServerEvent = useCallback(
    (event: RealtimeServerEvent) => {
      switch (event.type) {
        case "input_audio_buffer.speech_started": {
          const interrupted = currentAssistantRef.current
          if (interrupted?.text.trim()) {
            commitTurn(
              { id: interrupted.id, role: "assistant", text: interrupted.text, interrupted: true },
              false,
            )
          }
          currentAssistantRef.current = null
          currentUserRef.current = null
          setAssistantCaption("")
          setUserCaption("")
          setPhase("listening")
          break
        }
        case "input_audio_buffer.speech_stopped":
          setPhase("thinking")
          break
        case "conversation.item.input_audio_transcription.delta": {
          const id = event.item_id || "user-live"
          const previous = currentUserRef.current?.id === id ? currentUserRef.current.text : ""
          const text = previous + (event.delta || "")
          currentUserRef.current = { id, text }
          setUserCaption(text)
          break
        }
        case "conversation.item.input_audio_transcription.completed": {
          const id = event.item_id || currentUserRef.current?.id || crypto.randomUUID()
          const text = event.transcript || currentUserRef.current?.text || ""
          currentUserRef.current = null
          setUserCaption(text)
          commitTurn({ id, role: "user", text }, true)
          break
        }
        case "conversation.item.input_audio_transcription.failed":
          setError("I could not create a subtitle for that turn. Please try speaking again.")
          break
        case "response.created":
          setPhase("thinking")
          break
        case "response.output_audio_transcript.delta": {
          const id = event.item_id || event.response_id || "assistant-live"
          const previous = currentAssistantRef.current?.id === id ? currentAssistantRef.current.text : ""
          const text = previous + (event.delta || "")
          currentAssistantRef.current = { id, text }
          setAssistantCaption(text)
          setPhase("speaking")
          break
        }
        case "response.output_audio_transcript.done": {
          const id = event.item_id || currentAssistantRef.current?.id || crypto.randomUUID()
          const text = event.transcript || currentAssistantRef.current?.text || ""
          currentAssistantRef.current = null
          setAssistantCaption(text)
          commitTurn({ id, role: "assistant", text }, true)
          break
        }
        case "output_audio_buffer.started":
          setPhase("speaking")
          break
        case "output_audio_buffer.stopped":
          setPhase("listening")
          break
        case "response.done": {
          const responseError = event.response?.status_details?.error?.message
          if (event.response?.status === "failed" || responseError) {
            setError(responseError || "Hengo could not finish that reply.")
            setPhase("error")
          } else if (event.response?.status === "cancelled") {
            const interrupted = currentAssistantRef.current
            if (interrupted?.text.trim()) {
              commitTurn(
                { id: interrupted.id, role: "assistant", text: interrupted.text, interrupted: true },
                true,
              )
              currentAssistantRef.current = null
            }
            setPhase("listening")
          }
          break
        }
        case "error":
          setError(event.error?.message || "The realtime voice connection reported an error.")
          setPhase("error")
          break
      }
    },
    [commitTurn],
  )

  const start = useCallback(async () => {
    if (!conversationId || phase === "connecting" || (phase !== "idle" && phase !== "error")) return
    if (!navigator.mediaDevices?.getUserMedia || typeof RTCPeerConnection === "undefined") {
      setError("Live voice is not supported in this browser.")
      setPhase("error")
      return
    }

    closeConnection()
    closingRef.current = false
    setPhase("connecting")
    setError(null)
    setTurns([])
    setUserCaption("")
    setAssistantCaption("")
    setIsMuted(false)
    setLearnerLevel(null)
    setSpeechRate(null)
    setScenarioTitle(null)
    bootstrapRef.current = EMPTY_BOOTSTRAP
    persistedTurnIdsRef.current.clear()
    currentUserRef.current = null
    currentAssistantRef.current = null

    const controller = new AbortController()
    startAbortRef.current = controller

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      streamRef.current = mediaStream
      const credentials = await realtimeApi.createSession(
        conversationId,
        technicalMode,
        controller.signal,
      )

      if (controller.signal.aborted || !mountedRef.current) {
        mediaStream.getTracks().forEach((track) => track.stop())
        return
      }

      setModel(credentials.model)
      setLearnerLevel(credentials.learnerLevel)
      setSpeechRate(credentials.speechRate)
      setScenarioTitle(credentials.scenarioTitle)

      // Seed the visible transcript with the recent history the server returned
      // so a resumed or reconnected session shows continuity, and mark those
      // ids as already persisted so the completion handler never re-saves them.
      bootstrapRef.current = credentials.bootstrap
      const seededTurns: RealtimeVoiceTurn[] = credentials.bootstrap.history.map((message) => ({
        id: message.id,
        role: message.role,
        text: message.text,
      }))
      persistedTurnIdsRef.current = new Set(seededTurns.map((turn) => turn.id))
      if (seededTurns.length) setTurns(seededTurns)

      const peer = new RTCPeerConnection()
      peerRef.current = peer

      const remoteAudio = new Audio()
      remoteAudio.autoplay = true
      remoteAudio.setAttribute("playsinline", "true")
      audioRef.current = remoteAudio
      peer.ontrack = (trackEvent) => {
        remoteAudio.srcObject = trackEvent.streams[0]
        void remoteAudio.play().catch(() => {
          setError("Audio playback was blocked. End the session and start again to enable sound.")
        })
      }

      for (const track of mediaStream.getAudioTracks()) {
        peer.addTrack(track, mediaStream)
      }

      const channel = peer.createDataChannel("oai-events")
      channelRef.current = channel
      channel.addEventListener("message", (messageEvent) => {
        try {
          handleServerEvent(JSON.parse(String(messageEvent.data)) as RealtimeServerEvent)
        } catch {
          // Ignore malformed diagnostic events; normal audio can continue.
        }
      })
      channel.addEventListener("open", () => {
        if (!mountedRef.current) return
        // Replay recent history into the fresh realtime context, then let the
        // assistant speak first only when it's genuinely its turn (greet a new
        // conversation, or answer a pending learner message). Otherwise wait.
        const bootstrap = bootstrapRef.current
        for (const event of buildBootstrapEvents(bootstrap.history)) {
          channel.send(JSON.stringify(event))
        }
        if (bootstrap.createInitialResponse) {
          setPhase("thinking")
          channel.send(JSON.stringify(responseCreate()))
        } else {
          setPhase("listening")
        }
      })
      channel.addEventListener("close", () => {
        if (mountedRef.current && !closingRef.current && peer.connectionState !== "closed") {
          setError("The live voice connection ended.")
          setPhase("error")
        }
      })

      peer.addEventListener("connectionstatechange", () => {
        if (!mountedRef.current) return
        if (
          !closingRef.current &&
          (peer.connectionState === "failed" || peer.connectionState === "disconnected")
        ) {
          setError("The live voice connection was interrupted.")
          setPhase("error")
        }
      })

      const offer = await peer.createOffer()
      await peer.setLocalDescription(offer)
      const sdpResponse = await fetch("https://api.openai.com/v1/realtime/calls", {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${credentials.clientSecret}`,
          "Content-Type": "application/sdp",
        },
        signal: controller.signal,
      })

      if (!sdpResponse.ok) {
        throw new Error("OpenAI could not establish the live audio connection.")
      }

      await peer.setRemoteDescription({
        type: "answer",
        sdp: await sdpResponse.text(),
      })
      startAbortRef.current = null
    } catch (startError) {
      closeConnection()
      if (startError instanceof DOMException && startError.name === "AbortError") return
      if (!mountedRef.current) return
      setError(readableVoiceError(startError))
      setPhase("error")
    }
  }, [closeConnection, conversationId, handleServerEvent, phase, technicalMode])

  const stop = useCallback(() => {
    const userTurn = currentUserRef.current
    if (userTurn?.text.trim()) commitTurn({ ...userTurn, role: "user" }, true)
    const assistantTurn = currentAssistantRef.current
    if (assistantTurn?.text.trim()) {
      commitTurn({ ...assistantTurn, role: "assistant", interrupted: true }, true)
    }
    currentUserRef.current = null
    currentAssistantRef.current = null
    closeConnection()
    setPhase("idle")
    setError(null)
    setIsMuted(false)
  }, [closeConnection, commitTurn])

  const toggleMute = useCallback(() => {
    const track = streamRef.current?.getAudioTracks()[0]
    if (!track) return
    const nextMuted = track.enabled
    track.enabled = !nextMuted
    setIsMuted(nextMuted)
  }, [])

  return {
    supported,
    phase,
    isActive: phase !== "idle",
    turns,
    userCaption,
    assistantCaption,
    error,
    isMuted,
    model,
    learnerLevel,
    speechRate,
    scenarioTitle,
    start,
    stop,
    toggleMute,
  }
}
