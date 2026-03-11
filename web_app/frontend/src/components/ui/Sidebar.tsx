import { useEffect, useState } from 'react'
import { MessageSquare, Trash2, Settings, Plus } from 'lucide-react'
import { conversationApi } from '@/api/client'
import { useChatStore } from '@/store/useChatStore'
import { usePersonalityStore } from '@/store/usePersonalityStore'
import type { ConversationSummary } from '@/types'

interface Props {
  isOpen: boolean
}

export function Sidebar({ isOpen }: Props) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const conversationId = useChatStore((s) => s.conversationId)
  const clearChat = useChatStore((s) => s.clearChat)
  const loadMessages = useChatStore((s) => s.loadMessages)
  const setConversationId = useChatStore((s) => s.setConversationId)
  const config = usePersonalityStore((s) => s.config)

  const fetchConversations = async () => {
    try {
      const list = await conversationApi.list()
      setConversations(list)
    } catch {
      // Backend may not be up yet
    }
  }

  useEffect(() => {
    fetchConversations()
  }, [])

  const handleSelect = async (id: string) => {
    try {
      const detail = await conversationApi.get(id)
      loadMessages(detail.messages)
      setConversationId(id)
    } catch { /* no-op */ }
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    try {
      await conversationApi.delete(id)
      setConversations((prev) => prev.filter((c) => c.id !== id))
      if (conversationId === id) clearChat()
    } catch { /* no-op */ }
  }

  const handleNew = () => {
    clearChat()
  }

  if (!isOpen) return null

  return (
    <div className="w-64 h-full flex flex-col border-r border-white/5 bg-black/40 backdrop-blur-sm">
      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <div className="text-lg font-bold tracking-widest" style={{ color: config.color }}>
          TRINITY
        </div>
      </div>

      {/* New Chat */}
      <button
        onClick={handleNew}
        className="flex items-center gap-2 mx-3 mt-3 px-3 py-2 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
      >
        <Plus size={16} />
        New Chat
      </button>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {conversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => handleSelect(conv.id)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-all cursor-pointer group ${
              conversationId === conv.id ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70 hover:bg-white/5'
            }`}
          >
            <MessageSquare size={14} className="shrink-0" />
            <span className="flex-1 truncate">
              {conv.summary || `${conv.personality.toUpperCase()} chat`}
            </span>
            <span className="text-[10px] text-white/20">{conv.message_count}</span>
            <Trash2
              size={12}
              className="shrink-0 opacity-0 group-hover:opacity-50 hover:!opacity-100 text-red-400 transition-opacity"
              onClick={(e) => handleDelete(e, conv.id)}
            />
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-white/5">
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/30 hover:text-white/60 hover:bg-white/5 transition-all w-full cursor-pointer">
          <Settings size={14} />
          Settings
        </button>
      </div>
    </div>
  )
}
