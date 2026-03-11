import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PersonalityName, PersonalityConfig, PersonalitySlug } from '@/types'

const PERSONALITIES: Record<PersonalityName, PersonalityConfig> = {
  ARIA: { name: 'ARIA', slug: 'aria', color: '#4A90D9', accent: '#2563EB', tagline: 'Assistant Mode' },
  ECHO: { name: 'ECHO', slug: 'echo', color: '#9B59B6', accent: '#7C3AED', tagline: 'Creative Mode' },
  NEXUS: { name: 'NEXUS', slug: 'nexus', color: '#27AE60', accent: '#16A34A', tagline: 'Developer Mode' },
}

const SLUG_TO_NAME: Record<PersonalitySlug, PersonalityName> = {
  aria: 'ARIA',
  echo: 'ECHO',
  nexus: 'NEXUS',
}

interface PersonalityState {
  active: PersonalityName
  config: PersonalityConfig
  isTransitioning: boolean
  switchTo: (name: PersonalityName) => void
  switchToSlug: (slug: PersonalitySlug) => void
  setTransitioning: (v: boolean) => void
}

export const usePersonalityStore = create<PersonalityState>()(
  persist(
    (set) => ({
      active: 'ARIA',
      config: PERSONALITIES.ARIA,
      isTransitioning: false,

      switchTo: (name) => {
        set({ isTransitioning: true })
        setTimeout(() => {
          set({ active: name, config: PERSONALITIES[name], isTransitioning: false })
          // Update CSS custom properties
          document.documentElement.style.setProperty('--personality-color', PERSONALITIES[name].color)
          document.documentElement.style.setProperty('--personality-accent', PERSONALITIES[name].accent)
        }, 400)
      },

      switchToSlug: (slug) => {
        const name = SLUG_TO_NAME[slug]
        if (name) {
          set({ isTransitioning: true })
          setTimeout(() => {
            set({ active: name, config: PERSONALITIES[name], isTransitioning: false })
            document.documentElement.style.setProperty('--personality-color', PERSONALITIES[name].color)
            document.documentElement.style.setProperty('--personality-accent', PERSONALITIES[name].accent)
          }, 400)
        }
      },

      setTransitioning: (v) => set({ isTransitioning: v }),
    }),
    {
      name: 'trinity-personality',
      partialize: (state) => ({ active: state.active, config: state.config }),
    },
  ),
)

export { PERSONALITIES }
