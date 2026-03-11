import { useState } from 'react'
import { Mic, MicOff, Send } from 'lucide-react'
import { useChatStore } from '@/store/useChatStore'
import { usePersonalityStore } from '@/store/usePersonalityStore'
import { useVoice } from '@/hooks/useVoice'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

export function InputBar() {
  const [textInput, setTextInput] = useState('')
  const { isListening, isMuted, transcript, toggleMute } = useVoice(true)
  const sendMessage = useChatStore((s) => s.sendMessage)
  const config = usePersonalityStore((s) => s.config)

  useKeyboardShortcuts(toggleMute)

  const handleTextSend = () => {
    if (!textInput.trim()) return
    sendMessage({ content: textInput.trim(), personality: config.slug, source: 'text' })
    setTextInput('')
  }

  return (
    <div className="flex items-center gap-3 p-4 border-t border-white/5 bg-black/40 backdrop-blur-sm">
      <div className="flex-1 relative">
        <input
          type="text"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleTextSend()
            }
          }}
          placeholder={transcript || (isListening && !isMuted ? 'Listening...' : 'Type or speak...')}
          className="w-full bg-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-all duration-300"
          style={{
            boxShadow: `0 0 0 2px transparent`,
          }}
          onFocus={(e) => {
            e.currentTarget.style.boxShadow = `0 0 0 2px ${config.color}40`
          }}
          onBlur={(e) => {
            e.currentTarget.style.boxShadow = `0 0 0 2px transparent`
          }}
        />
        {isListening && !isMuted && (
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: config.color }}
          />
        )}
      </div>

      <button
        onClick={toggleMute}
        className="p-3 rounded-xl transition-all hover:bg-white/10 cursor-pointer"
        title={isMuted ? 'Unmute (Cmd+M)' : 'Mute (Cmd+M)'}
      >
        {isMuted ? (
          <MicOff size={20} className="text-red-400" />
        ) : (
          <Mic size={20} style={{ color: config.color }} />
        )}
      </button>

      <button
        onClick={handleTextSend}
        className="p-3 rounded-xl transition-all hover:bg-white/10 cursor-pointer"
        title="Send"
      >
        <Send size={20} style={{ color: textInput.trim() ? config.color : 'rgba(255,255,255,0.2)' }} />
      </button>
    </div>
  )
}
