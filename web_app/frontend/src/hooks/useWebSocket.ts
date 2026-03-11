import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/store/useAuthStore'
import { useChatStore, setSocketEmit } from '@/store/useChatStore'
import { usePersonalityStore } from '@/store/usePersonalityStore'
import type { ToolStatus } from '@/types'

export function useWebSocket() {
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const token = useAuthStore((s) => s.token)
  const appendToken = useChatStore((s) => s.appendToken)
  const finalizeStream = useChatStore((s) => s.finalizeStream)
  const setTyping = useChatStore((s) => s.setTyping)
  const switchToSlug = usePersonalityStore((s) => s.switchToSlug)

  // Track latest tool results for ToolResultCard
  const [lastToolResult, setLastToolResult] = useState<ToolStatus | null>(null)

  useEffect(() => {
    if (!token) {
      socketRef.current?.disconnect()
      socketRef.current = null
      setSocketEmit(null)
      setIsConnected(false)
      return
    }

    const socket = io('/', {
      auth: { token },
      transports: ['websocket'],
    })

    socket.on('connect', () => {
      setIsConnected(true)
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
    })

    socket.on('token', (data: { token: string }) => {
      appendToken(data.token)
    })

    socket.on('message_done', (data: { content: string; message_id: string; conversation_id: string }) => {
      finalizeStream(data.content, data.message_id, data.conversation_id)
    })

    socket.on('typing', (data: { isTyping: boolean }) => {
      setTyping(data.isTyping)
    })

    socket.on('personality_switched', (data: { personality: string }) => {
      const slug = data.personality.toLowerCase() as 'aria' | 'echo' | 'nexus'
      switchToSlug(slug)
    })

    socket.on('tool_result', (data: ToolStatus) => {
      setLastToolResult(data)
    })

    socket.on('error', (data: { code: string; message: string }) => {
      console.error(`[WS Error] ${data.code}: ${data.message}`)
    })

    socketRef.current = socket
    setSocketEmit((event, payload) => socket.emit(event, payload))

    return () => {
      socket.disconnect()
      socketRef.current = null
      setSocketEmit(null)
      setIsConnected(false)
    }
  }, [token, appendToken, finalizeStream, setTyping, switchToSlug])

  const emitSwitchPersonality = (personality: string) => {
    socketRef.current?.emit('switch_personality', { personality })
  }

  return { isConnected, lastToolResult, emitSwitchPersonality, socket: socketRef }
}
