import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'

// Types
export interface Conversation {
  id: string
  personality: string
  title: string | null
  created_at: string
  updated_at: string
}

export interface PersonalityConfig {
  name: string
  slug: string
  color: string
  accent: string
  tagline: string
  local_model: string
}

export interface ProviderStatus {
  mode: string
  provider: string
  model: string
}

export interface OllamaModel {
  name: string
  size: number
  modified_at: string
}

// Chat
export async function sendMessage(message: string, personality: string, history: unknown[]) {
  return invoke('send_message', { message, personality, history })
}

export async function onToken(callback: (token: string) => void) {
  return listen<string>('chat_token', (event) => callback(event.payload))
}

export async function onMessageDone(callback: (data: { content: string; id: string; conversation_id: string }) => void) {
  return listen('message_done', (event) => callback(event.payload as any))
}

// Conversations
export async function listConversations() {
  return invoke<Conversation[]>('list_conversations')
}

export async function getConversation(id: string) {
  return invoke<Conversation>('get_conversation', { id })
}

export async function deleteConversation(id: string) {
  return invoke('delete_conversation', { id })
}

// Personality
export async function switchPersonality(name: string) {
  return invoke('switch_personality', { name })
}

export async function getPersonalityConfig(name: string) {
  return invoke<PersonalityConfig>('get_personality_config', { name })
}

// Provider
export async function getProviderStatus() {
  return invoke<ProviderStatus>('get_provider_status')
}

export async function setProviderMode(mode: 'auto' | 'cloud' | 'local') {
  return invoke('set_provider_mode', { mode })
}

// Ollama
export async function listModels() {
  return invoke<OllamaModel[]>('list_models')
}

export async function pullModel(name: string) {
  return invoke('pull_model', { name })
}

export async function checkOllamaStatus() {
  return invoke<boolean>('check_ollama_status')
}

export async function onPullProgress(callback: (progress: { status: string; completed: number; total: number }) => void) {
  return listen('ollama_pull_progress', (event) => callback(event.payload as any))
}

// Settings (non-sensitive prefs in SQLite)
export async function getPreference(key: string) {
  return invoke<string | null>('get_preference', { key })
}

export async function setPreference(key: string, value: string) {
  return invoke('set_preference', { key, value })
}

export async function deletePreference(key: string) {
  return invoke('delete_preference', { key })
}

// Memory
export async function getMemory(key: string, personality?: string) {
  return invoke<string | null>('get_memory', { key, personality })
}

export async function setMemory(key: string, value: string, personality?: string) {
  return invoke('set_memory', { key, value, personality })
}

export async function listMemories(personality?: string) {
  return invoke<Array<{ key: string; value: string; personality: string | null }>>('list_memories', { personality })
}
