import { usePersonalityStore, PERSONALITIES } from '@/store/usePersonalityStore'
import { motion } from 'framer-motion'
import type { PersonalityName } from '@/types'

const SHORTCUTS: Record<PersonalityName, string> = {
  ARIA: '1',
  ECHO: '2',
  NEXUS: '3',
}

export function PersonalitySelector() {
  const active = usePersonalityStore((s) => s.active)
  const switchTo = usePersonalityStore((s) => s.switchTo)

  return (
    <div className="flex gap-2 p-3">
      {(Object.keys(PERSONALITIES) as PersonalityName[]).map((name) => {
        const p = PERSONALITIES[name]
        const isActive = active === name

        return (
          <button
            key={name}
            onClick={() => switchTo(name)}
            className="relative flex-1 rounded-xl px-4 py-3 transition-all duration-300 cursor-pointer border"
            style={{
              borderColor: isActive ? p.color : 'rgba(255,255,255,0.08)',
              background: isActive ? `${p.color}15` : 'rgba(255,255,255,0.03)',
            }}
          >
            {isActive && (
              <motion.div
                layoutId="personality-glow"
                className="absolute inset-0 rounded-xl"
                style={{
                  boxShadow: `0 0 20px ${p.color}30, inset 0 0 20px ${p.color}10`,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
            <div className="relative flex items-center justify-between">
              <div>
                <div
                  className="text-sm font-semibold tracking-wide"
                  style={{ color: isActive ? p.color : 'rgba(255,255,255,0.5)' }}
                >
                  {name}
                </div>
                <div className="text-xs text-white/30 mt-0.5">{p.tagline}</div>
              </div>
              <kbd className="text-[10px] text-white/20 bg-white/5 px-1.5 py-0.5 rounded">
                {'\u2318'}{SHORTCUTS[name]}
              </kbd>
            </div>
          </button>
        )
      })}
    </div>
  )
}
