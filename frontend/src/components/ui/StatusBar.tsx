import { usePersonalityStore } from '@/store/usePersonalityStore'
import { Wifi, WifiOff, Mic, MicOff } from 'lucide-react'

interface Props {
  isConnected: boolean
  isMuted: boolean
  isListening: boolean
}

export function StatusBar({ isConnected, isMuted, isListening }: Props) {
  const config = usePersonalityStore((s) => s.config)

  return (
    <div className="flex items-center justify-between px-4 py-2 border-t border-white/5 bg-black/60 text-xs">
      <div className="flex items-center gap-2">
        <span
          className="w-2 h-2 rounded-full"
          style={{ background: config.color }}
        />
        <span className="text-white/50">
          <span style={{ color: config.color }} className="font-medium">{config.name}</span>
          {' '}&mdash; {config.tagline}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 text-white/30">
          {isMuted ? (
            <MicOff size={12} className="text-red-400" />
          ) : isListening ? (
            <Mic size={12} style={{ color: config.color }} />
          ) : (
            <Mic size={12} />
          )}
          <span>{isMuted ? 'Muted' : isListening ? 'Live' : 'Idle'}</span>
        </div>

        <div className="flex items-center gap-1 text-white/30">
          {isConnected ? (
            <Wifi size={12} className="text-green-400" />
          ) : (
            <WifiOff size={12} className="text-red-400" />
          )}
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>
    </div>
  )
}
