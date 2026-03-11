import { Wrench, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { usePersonalityStore } from '@/store/usePersonalityStore'
import type { ToolStatus } from '@/types'

interface Props {
  tool: ToolStatus
}

export function ToolResultCard({ tool }: Props) {
  const config = usePersonalityStore((s) => s.config)

  const statusIcon = {
    pending: <Loader2 size={14} className="animate-spin text-white/40" />,
    running: <Loader2 size={14} className="animate-spin" style={{ color: config.color }} />,
    done: <CheckCircle size={14} className="text-green-400" />,
    failed: <XCircle size={14} className="text-red-400" />,
  }

  return (
    <div className="flex justify-start mb-3">
      <div className="max-w-[75%] rounded-xl border border-white/10 bg-white/5 px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-white/50 mb-2">
          <Wrench size={12} />
          <span className="font-medium">{tool.task_id}</span>
          {statusIcon[tool.status]}
          <span className="capitalize">{tool.status}</span>
          {tool.duration_ms && (
            <span className="text-white/20">{tool.duration_ms}ms</span>
          )}
        </div>

        {tool.status === 'done' && tool.result != null && (
          <pre className="text-xs text-white/70 bg-black/30 rounded-lg p-2 overflow-x-auto">
            {typeof tool.result === 'string'
              ? tool.result
              : JSON.stringify(tool.result, null, 2)}
          </pre>
        )}

        {tool.status === 'failed' && tool.error && (
          <div className="text-xs text-red-400 bg-red-400/5 rounded-lg p-2">
            {tool.error}
          </div>
        )}
      </div>
    </div>
  )
}
