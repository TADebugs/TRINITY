import { useState } from 'react'

export default function App() {
  const [ready, setReady] = useState(false)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">TRINITY</h1>
        <p className="text-white/40">Desktop app shell — Tauri v2</p>
        <p className="text-white/20 text-sm mt-2">Frontend scaffolded. Rust backend ready for implementation.</p>
      </div>
    </div>
  )
}
