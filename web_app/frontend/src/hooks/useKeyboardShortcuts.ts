import { useEffect } from 'react'
import { usePersonalityStore } from '@/store/usePersonalityStore'

export function useKeyboardShortcuts(toggleMute?: () => void) {
  const switchTo = usePersonalityStore((s) => s.switchTo)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.metaKey && !e.ctrlKey) return

      switch (e.key) {
        case '1':
          e.preventDefault()
          switchTo('ARIA')
          break
        case '2':
          e.preventDefault()
          switchTo('ECHO')
          break
        case '3':
          e.preventDefault()
          switchTo('NEXUS')
          break
        case 'm':
          e.preventDefault()
          toggleMute?.()
          break
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [switchTo, toggleMute])
}
