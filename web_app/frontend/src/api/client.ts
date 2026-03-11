import axios from 'axios'
import type {
  AuthResponse,
  LoginResponse,
  RegisterRequest,
  ConversationSummary,
  ConversationDetail,
  Message,
  MemoryEntry,
  ToolStatus,
  PersonalitySlug,
} from '@/types'

const api = axios.create({ baseURL: '/api' })

// Attach JWT from localStorage on every request
api.interceptors.request.use((config) => {
  const raw = localStorage.getItem('trinity-auth')
  if (raw) {
    try {
      const { state } = JSON.parse(raw)
      if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`
      }
    } catch { /* no-op */ }
  }
  return config
})

// ── Auth ──
export const authApi = {
  register: (data: RegisterRequest) =>
    api.post<AuthResponse>('/auth/register', data).then((r) => r.data),

  login: (email: string, password: string) => {
    const form = new URLSearchParams()
    form.append('username', email)
    form.append('password', password)
    return api
      .post<LoginResponse>('/auth/login', form, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      .then((r) => r.data)
  },

  me: () => api.get('/auth/me').then((r) => r.data),
}

// ── Conversations ──
export const conversationApi = {
  list: (limit = 20, offset = 0) =>
    api
      .get<{ conversations: ConversationSummary[] }>('/conversations', {
        params: { limit, offset },
      })
      .then((r) => r.data.conversations),

  get: (id: string) =>
    api
      .get<{ conversation: ConversationDetail }>(`/conversations/${id}`)
      .then((r) => r.data.conversation),

  messages: (id: string, limit = 50, before?: string) =>
    api
      .get<{ messages: Message[]; has_more: boolean }>(
        `/conversations/${id}/messages`,
        { params: { limit, before } },
      )
      .then((r) => r.data),

  delete: (id: string) => api.delete(`/conversations/${id}`),
}

// ── Memory ──
export const memoryApi = {
  list: (personality?: PersonalitySlug) =>
    api
      .get<{ memories: MemoryEntry[] }>('/memory', {
        params: personality ? { personality } : {},
      })
      .then((r) => r.data.memories),

  get: (key: string, personality?: PersonalitySlug) =>
    api
      .get<MemoryEntry>(`/memory/${key}`, {
        params: personality ? { personality } : {},
      })
      .then((r) => r.data),

  set: (key: string, value: unknown, personality?: PersonalitySlug) =>
    api.put(`/memory/${key}`, { value, personality }),
}

// ── Tools ──
export const toolApi = {
  execute: (tool_name: string, params: Record<string, unknown>, personality: PersonalitySlug) =>
    api
      .post<ToolStatus>('/tools/execute', { tool_name, params, personality })
      .then((r) => r.data),

  status: (taskId: string) =>
    api.get<ToolStatus>(`/tools/status/${taskId}`).then((r) => r.data),

  available: (personality: PersonalitySlug) =>
    api
      .get<{ enabled: string[]; disabled: string[] }>(
        `/tools/available/${personality}`,
      )
      .then((r) => r.data),
}

export default api
