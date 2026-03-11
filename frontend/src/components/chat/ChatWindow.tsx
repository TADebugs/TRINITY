import { useRef, useEffect } from 'react'
import { useChatStore } from '@/store/useChatStore'
import { usePersonalityStore } from '@/store/usePersonalityStore'
import { MessageBubble } from './MessageBubble'
import type { Message } from '@/types'

export function ChatWindow() {
  const messages = useChatStore((s) => s.messages)
  const isTyping = useChatStore((s) => s.isTyping)
  const streamingContent = useChatStore((s) => s.streamingContent)
  const config = usePersonalityStore((s) => s.config)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll on new messages or streaming content
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, streamingContent])

  // Build a streaming message to show tokens as they arrive
  const streamingMessage: Message | null = streamingContent
    ? {
        id: 'streaming',
        role: 'assistant',
        content: streamingContent,
        personality: config.slug,
        source: 'text',
        timestamp: Date.now(),
        isStreaming: true,
      }
    : null

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      {messages.length === 0 && !streamingMessage && (
        <div className="flex flex-col items-center justify-center h-full text-white/20 select-none">
          <div className="text-4xl font-bold tracking-widest mb-2" style={{ color: `${config.color}30` }}>
            TRINITY
          </div>
          <div className="text-sm">
            Talk to <span style={{ color: config.color }}>{config.name}</span> — type or speak
          </div>
        </div>
      )}

      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}

      {streamingMessage && <MessageBubble message={streamingMessage} />}

      {isTyping && !streamingContent && (
        <div className="flex justify-start mb-3">
          <div
            className="rounded-2xl px-4 py-3 border border-white/5"
            style={{ background: `${config.color}08`, borderColor: `${config.color}20` }}
          >
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{
                    background: config.color,
                    animationDelay: `${i * 150}ms`,
                    animationDuration: '800ms',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
