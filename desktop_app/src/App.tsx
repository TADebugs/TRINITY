import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'

export default function App() {
  const [ollamaUp, setOllamaUp] = useState<boolean | null>(null)
  const [dbOk, setDbOk] = useState(false)

  useEffect(() => {
    // Test SQLite — try reading a preference
    invoke('get_preference', { key: 'boot_test' })
      .then(() => setDbOk(true))
      .catch(() => setDbOk(false))

    // Test Ollama connectivity
    invoke<boolean>('check_ollama_status')
      .then(setOllamaUp)
      .catch(() => setOllamaUp(false))
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold">TRINITY</h1>
        <p className="text-white/40">Desktop App — Phase 1 Boot Check</p>

        <div className="mt-8 space-y-3 text-left mx-auto w-64">
          <StatusRow label="Tauri IPC" ok={true} />
          <StatusRow label="SQLite DB" ok={dbOk} />
          <StatusRow
            label="Ollama"
            ok={ollamaUp}
            detail={ollamaUp === null ? 'checking...' : ollamaUp ? 'running' : 'not found'}
          />
        </div>
      </div>
    </div>
  )
}

function StatusRow({
  label,
  ok,
  detail,
}: {
  label: string
  ok: boolean | null
  detail?: string
}) {
  const dot =
    ok === null
      ? 'bg-yellow-500'
      : ok
        ? 'bg-green-500'
        : 'bg-red-500'

  return (
    <div className="flex items-center gap-3 text-sm">
      <div className={`w-2.5 h-2.5 rounded-full ${dot}`} />
      <span className="text-white/70 w-24">{label}</span>
      {detail && <span className="text-white/30 text-xs">{detail}</span>}
    </div>
  )
}
