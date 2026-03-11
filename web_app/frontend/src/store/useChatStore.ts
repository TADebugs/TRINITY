import { create } from 'zustand'
import type { Message, PersonalitySlug, MessageSource } from '@/types'

interface SendMessageParams {
  content: string
  personality: PersonalitySlug
  source: MessageSource
}

interface ChatState {
  messages: Message[]
  isTyping: boolean
  streamingContent: string
  streamingMessageId: string | null
  conversationId: string | null

  addMessage: (msg: Message) => void
  appendToken: (token: string) => void
  finalizeStream: (content: string, messageId: string, conversationId: string) => void
  setTyping: (v: boolean) => void
  clearChat: () => void
  setConversationId: (id: string | null) => void
  sendMessage: (params: SendMessageParams) => void
  loadMessages: (messages: Message[]) => void
}

// Socket reference set by useWebSocket hook
let emitFn: ((event: string, data: unknown) => void) | null = null
export const setSocketEmit = (fn: ((event: string, data: unknown) => void) | null) => {
  emitFn = fn
}

export const useChatStore = create<ChatState>()((set, get) => ({
  messages: [],
  isTyping: false,
  streamingContent: '',
  streamingMessageId: null,
  conversationId: null,

  addMessage: (msg) =>
    set((state) => ({ messages: [...state.messages, msg] })),

  appendToken: (token) =>
    set((state) => ({ streamingContent: state.streamingContent + token })),

  finalizeStream: (content, messageId, conversationId) =>
    set((state) => {
      const finalMsg: Message = {
        id: messageId,
        role: 'assistant',
        content,
        personality: state.messages.length > 0
          ? state.messages[state.messages.length - 1].personality
          : 'aria',
        source: 'text',
        timestamp: Date.now(),
        isStreaming: false,
      }
      return {
        messages: [...state.messages, finalMsg],
        streamingContent: '',
        streamingMessageId: null,
        conversationId,
        isTyping: false,
      }
    }),

  setTyping: (v) => set({ isTyping: v }),

  clearChat: () =>
    set({ messages: [], streamingContent: '', streamingMessageId: null, conversationId: null }),

  setConversationId: (id) => set({ conversationId: id }),

  sendMessage: (params) => {
    const { content, personality, source } = params
    const state = get()

    // Add user message to local state immediately
    const userMsg: Message = {
      id: `local-${Date.now()}`,
      role: 'user',
      content,
      personality,
      source,
      timestamp: Date.now(),
    }
    set((s) => ({ messages: [...s.messages, userMsg] }))

    // Build history for the backend
    const history = state.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }))

    // Emit via WebSocket (primary transport)
    if (emitFn) {
      emitFn('chat_message', {
        message: content,
        personality,
        history,
        conversation_id: state.conversationId,
      })
    }
  },

  loadMessages: (messages) => set({ messages }),
}))
