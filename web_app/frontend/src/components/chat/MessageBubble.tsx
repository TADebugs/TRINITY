import { PERSONALITIES } from '@/store/usePersonalityStore'
import { Mic, Type } from 'lucide-react'
import type { Message, PersonalityName } from '@/types'

const SLUG_TO_NAME: Record<string, PersonalityName> = {
  aria: 'ARIA',
  echo: 'ECHO',
  nexus: 'NEXUS',
}

interface Props {
  message: Message
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user'
  const personalityName = SLUG_TO_NAME[message.personality] || 'ARIA'
  const personality = PERSONALITIES[personalityName]
  const color = personality.color

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-white/10 text-white'
            : 'border border-white/5'
        }`}
        style={
          !isUser
            ? { background: `${color}08`, borderColor: `${color}20` }
            : undefined
        }
      >
        {!isUser && (
          <div className="text-xs font-medium mb-1.5 flex items-center gap-1.5" style={{ color }}>
            {personalityName}
          </div>
        )}

        <div className="text-sm leading-relaxed whitespace-pre-wrap break-words select-text cursor-text">
          {message.content}
          {message.isStreaming && (
            <span className="inline-block w-1.5 h-4 ml-0.5 animate-pulse rounded-sm" style={{ background: color }} />
          )}
        </div>

        <div className="flex items-center gap-1 mt-1.5 justify-end">
          {message.source === 'voice' ? (
            <Mic size={10} className="text-white/20" />
          ) : (
            <Type size={10} className="text-white/20" />
          )}
          <span className="text-[10px] text-white/20">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  )
}
