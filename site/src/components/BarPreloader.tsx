import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  duration?: number
  barCount?: number
  color?: [number, number, number] // RGB tuple
  background?: string
  barWidth?: number
  barHeight?: number
  barGap?: number
  sweepSpeed?: number
  onComplete?: () => void
}

export default function BarPreloader({
  duration = 2500,
  barCount = 20,
  color = [155, 89, 182], // #9B59B6
  background = '#0a0a0a',
  barWidth = 14,
  barHeight = 52,
  barGap = 5,
  sweepSpeed = 1.8,
  onComplete,
}: Props) {
  const [visible, setVisible] = useState(true)
  const [percent, setPercent] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      onComplete?.()
    }, duration + 400)
    return () => clearTimeout(timer)
  }, [duration, onComplete])

  useEffect(() => {
    if (!visible) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const totalWidth = barCount * (barWidth + barGap) - barGap
    const w = totalWidth + 40
    const h = barHeight + 20
    const dpr = window.devicePixelRatio || 1

    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const loadStart = Date.now()

    const draw = (now: number) => {
      const elapsed = (now - (loadStart ? loadStart : now)) / 1000
      // Update percentage
      const rawProgress = Math.min((Date.now() - loadStart) / duration, 1)
      const easedProgress = 1 - Math.pow(1 - rawProgress, 3)
      setPercent(Math.round(easedProgress * 100))

      ctx.clearRect(0, 0, w, h)

      const startX = (w - totalWidth) / 2
      const y = (h - barHeight) / 2

      // Sweep position: oscillates back and forth across the bars
      const sweep = (Math.sin(elapsed * sweepSpeed * Math.PI) + 1) / 2 // 0 to 1

      for (let i = 0; i < barCount; i++) {
        const x = startX + i * (barWidth + barGap)
        const t = i / (barCount - 1) // 0 to 1 position of this bar

        // Distance from sweep center
        const dist = Math.abs(t - sweep)

        // Brightness: close to sweep = bright, far = dim
        const brightness = Math.max(0.15, 1 - dist * 2.5)

        const [r, g, b] = color
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${brightness})`

        // Slight rounded rect
        const radius = 3
        ctx.beginPath()
        ctx.moveTo(x + radius, y)
        ctx.lineTo(x + barWidth - radius, y)
        ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius)
        ctx.lineTo(x + barWidth, y + barHeight - radius)
        ctx.quadraticCurveTo(x + barWidth, y + barHeight, x + barWidth - radius, y + barHeight)
        ctx.lineTo(x + radius, y + barHeight)
        ctx.quadraticCurveTo(x, y + barHeight, x, y + barHeight - radius)
        ctx.lineTo(x, y + radius)
        ctx.quadraticCurveTo(x, y, x + radius, y)
        ctx.closePath()
        ctx.fill()
      }

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)

    return () => cancelAnimationFrame(animRef.current)
  }, [visible, barCount, barWidth, barHeight, barGap, color, sweepSpeed])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[10000] flex flex-col items-center justify-center"
          style={{ backgroundColor: background }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.33, 1, 0.68, 1] }}
        >
          <motion.p
            className="mb-8 font-mono text-sm tracking-[0.15em] text-white/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            Sequence Initializing...
          </motion.p>

          <motion.canvas
            ref={canvasRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          />

          <motion.p
            className="mt-6 font-mono text-xs tracking-[0.2em]"
            style={{ color: `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.6)` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            {percent}%
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
