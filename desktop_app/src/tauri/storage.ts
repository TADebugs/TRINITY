import { invoke } from '@tauri-apps/api/core'
import type { StateStorage } from 'zustand/middleware'

/**
 * Custom Zustand storage adapter that routes persist middleware
 * through Tauri invoke calls to SQLite (preferences table).
 *
 * Without this, Zustand falls back to localStorage which is
 * ephemeral in Tauri's WebView — works in dev, silently loses
 * state in production builds.
 */
export const tauriStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return await invoke<string | null>('get_preference', { key: `zustand:${name}` })
    } catch {
      return null
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await invoke('set_preference', { key: `zustand:${name}`, value })
  },
  removeItem: async (name: string): Promise<void> => {
    await invoke('delete_preference', { key: `zustand:${name}` })
  },
}
