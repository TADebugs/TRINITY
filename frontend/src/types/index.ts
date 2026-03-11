// ── Personality ──
export type PersonalityName = 'ARIA' | 'ECHO' | 'NEXUS'
export type PersonalitySlug = 'aria' | 'echo' | 'nexus'
export type MessageSource = 'voice' | 'text'
export type MessageRole = 'user' | 'assistant'

export interface PersonalityConfig {
  name: PersonalityName
  slug: PersonalitySlug
  color: string
  accent: string
  tagline: string
}

// ── User ──
export interface UserProfile {
  id: string
  email: string
  display_name: string
  created_at: string
}

// ── Message ──
export interface Message {
  id: string
  role: MessageRole
  content: string
  personality: PersonalitySlug
  source: MessageSource
  timestamp: number
  isStreaming?: boolean
}

// ── Conversation ──
export interface ConversationSummary {
  id: string
  personality: PersonalitySlug
  started_at: string
  ended_at: string | null
  summary: string | null
  message_count: number
}

export interface ConversationDetail extends ConversationSummary {
  messages: Message[]
}

// ── Chat ──
export interface ChatRequest {
  message: string
  personality: PersonalitySlug
  conversation_id?: string
  history: { role: string; content: string }[]
}

// ── Memory ──
export interface MemoryEntry {
  key: string
  value: unknown
  scope: 'personal' | 'shared'
  personality: PersonalitySlug | null
  updated_at: string
}

// ── Tools ──
export interface ToolRequest {
  tool_name: string
  params: Record<string, unknown>
  personality: PersonalitySlug
}

export interface ToolStatus {
  task_id: string
  status: 'pending' | 'running' | 'done' | 'failed'
  result?: unknown
  error?: string
  duration_ms?: number
}

// ── Auth ──
export interface RegisterRequest {
  email: string
  display_name: string
  password: string
}

export interface AuthResponse {
  token: string
  user: { id: string; name: string }
}

export interface LoginResponse {
  access_token: string
  token_type: 'bearer'
}
