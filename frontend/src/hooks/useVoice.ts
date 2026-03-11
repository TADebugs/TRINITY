import { useEffect, useRef, useState, useCallback } from 'react'
import { useChatStore } from '@/store/useChatStore'
import { usePersonalityStore } from '@/store/usePersonalityStore'
import type { PersonalitySlug } from '@/types'

// Web Speech API types (not in all TS libs)
type SpeechRecognitionType = typeof window extends { SpeechRecognition: infer T } ? T : never
interface SpeechWindow {
  SpeechRecognition?: { new(): any }
  webkitSpeechRecognition?: { new(): any }
}

export function useVoice(autoStart = true) {
  const [isListening, setIsListening] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef<any>(null)
  const isMutedRef = useRef(false)
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intentionalStopRef = useRef(false)
  const sendMessage = useChatStore((s) => s.sendMessage)
  const activeSlug = usePersonalityStore((s) => s.config.slug)
  const activeSlugRef = useRef<PersonalitySlug>(activeSlug)

  // Keep refs in sync
  useEffect(() => { activeSlugRef.current = activeSlug }, [activeSlug])
  useEffect(() => { isMutedRef.current = isMuted }, [isMuted])

  const stop = useCallback(() => {
    intentionalStopRef.current = true
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current)
      restartTimerRef.current = null
    }
    recognitionRef.current?.abort()
    recognitionRef.current = null
    setIsListening(false)
  }, [])

  const start = useCallback(() => {
    if (recognitionRef.current) return
    intentionalStopRef.current = false
    const w = window as SpeechWindow
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition
    if (!SR || isMutedRef.current) return

    const recognition = new SR()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => {
      recognitionRef.current = null
      // Only flicker the UI if the user intentionally stopped
      if (intentionalStopRef.current || isMutedRef.current) {
        setIsListening(false)
        return
      }
      // Auto-restart: keep isListening true so UI doesn't flicker
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current)
      restartTimerRef.current = setTimeout(() => {
        restartTimerRef.current = null
        if (!isMutedRef.current) start()
      }, 800)
    }

    recognition.onresult = (event: any) => {
      let interim = ''
      let final = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          final += result[0].transcript
        } else {
          interim += result[0].transcript
        }
      }

      setTranscript(interim)

      if (final.trim()) {
        setTranscript('')
        sendMessage({
          content: final.trim(),
          personality: activeSlugRef.current,
          source: 'voice',
        })
      }
    }

    recognition.onerror = (e: any) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        intentionalStopRef.current = true
        recognitionRef.current = null
        setIsMuted(true)
        setIsListening(false)
        return
      }
      // For transient errors (network, aborted, audio-capture, etc.)
      // clear the ref so onend's restart (or a manual start()) isn't blocked
      recognitionRef.current = null
    }

    recognition.start()
    recognitionRef.current = recognition
  }, [sendMessage])

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev
      if (next) {
        stop()
      } else {
        setTimeout(start, 100)
      }
      return next
    })
  }, [start, stop])

  useEffect(() => {
    if (autoStart && !isMuted) start()
    return () => stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { isListening, isMuted, transcript, toggleMute, start, stop }
}
