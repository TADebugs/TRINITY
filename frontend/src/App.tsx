import { useState } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { useWebSocket } from '@/hooks/useWebSocket'
import { useVoice } from '@/hooks/useVoice'
import { PersonalitySelector } from '@/components/personality/PersonalitySelector'
import { PersonalityOrb } from '@/components/personality/PersonalityOrb'
import { ChatWindow } from '@/components/chat/ChatWindow'
import { InputBar } from '@/components/chat/InputBar'
import { ToolResultCard } from '@/components/chat/ToolResultCard'
import { Sidebar } from '@/components/ui/Sidebar'
import { StatusBar } from '@/components/ui/StatusBar'
import { AuthScreen } from '@/components/auth/AuthScreen'
import { PanelLeftClose, PanelLeft } from 'lucide-react'

export default function App() {
  const token = useAuthStore((s) => s.token)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  if (!token) {
    return <AuthScreen />
  }

  return <AuthenticatedApp sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
}

function AuthenticatedApp({
  sidebarOpen,
  setSidebarOpen,
}: {
  sidebarOpen: boolean
  setSidebarOpen: (v: boolean) => void
}) {
  const { isConnected, lastToolResult } = useWebSocket()
  const { isListening, isMuted } = useVoice(true)

  return (
    <div className="flex h-screen bg-[#0a0a0a] overflow-hidden">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} />

      {/* Main */}
      <div className="flex-1 flex flex-col relative">
        {/* Top bar */}
        <div className="flex items-center border-b border-white/5 bg-black/40 backdrop-blur-sm">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-3 text-white/30 hover:text-white/60 transition-colors cursor-pointer"
          >
            {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
          </button>
          <div className="flex-1">
            <PersonalitySelector />
          </div>
        </div>

        {/* Chat area with orb background */}
        <div className="flex-1 flex flex-col relative overflow-hidden min-h-0">
          <PersonalityOrb />
          <div className="relative z-10 flex-1 flex flex-col min-h-0">
            <ChatWindow />

            {/* Tool result if present */}
            {lastToolResult && (
              <div className="px-4">
                <ToolResultCard tool={lastToolResult} />
              </div>
            )}

            <InputBar />
          </div>
        </div>

        {/* Status bar */}
        <StatusBar isConnected={isConnected} isMuted={isMuted} isListening={isListening} />
      </div>
    </div>
  )
}
