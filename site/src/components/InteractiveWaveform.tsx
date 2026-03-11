import { useRef, useEffect } from 'react'

interface Props {
  barCount?: number
  barWidth?: number
  barGap?: number
  baseHeight?: number
  maxHeight?: number
  color?: [number, number, number]
  influenceRadius?: number
  className?: string
  onHover?: (x: number, y: number) => void // normalized 0–1
  onHoverEnd?: () => void
}

export default function InteractiveWaveform({
  barCount = 40,
  barWidth = 4,
  barGap = 3,
  baseHeight = 8,
  maxHeight = 80,
  color = [218, 81, 148], // brand-pink
  influenceRadius = 180,
  className = '',
  onHover,
  onHoverEnd,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: -1000, y: -1000 })
  const animRef = useRef(0)
  const barsRef = useRef<number[]>([])
  const timeRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Init bar ambient offsets
    barsRef.current = Array.from({ length: barCount }, () => Math.random() * Math.PI * 2)

    const parent = canvas.parentElement
    if (!parent) return

    const resize = () => {
      const rect = parent.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const observer = new ResizeObserver(resize)
    observer.observe(parent)
    resize()

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const localX = e.clientX - rect.left
      const localY = e.clientY - rect.top
      mouseRef.current = { x: localX, y: localY }

      // Send normalized position to audio
      if (onHover) {
        onHover(
          Math.max(0, Math.min(1, localX / rect.width)),
          Math.max(0, Math.min(1, localY / rect.height)),
        )
      }
    }

    const onMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 }
      onHoverEnd?.()
    }

    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mouseleave', onMouseLeave)

    const draw = () => {
      const rect = parent.getBoundingClientRect()
      const w = rect.width
      const h = rect.height
      timeRef.current += 0.016

      ctx.clearRect(0, 0, w, h)

      const totalBarsWidth = barCount * (barWidth + barGap) - barGap
      const startX = (w - totalBarsWidth) / 2
      const centerY = h / 2
      const mouse = mouseRef.current
      const offsets = barsRef.current
      const t = timeRef.current

      for (let i = 0; i < barCount; i++) {
        const x = startX + i * (barWidth + barGap)
        const barCenterX = x + barWidth / 2

        // Ambient music-like fluctuation — layered frequencies
        const phase = offsets[i]
        const slow = Math.sin(t * 1.2 + phase) * 0.25
        const mid = Math.sin(t * 3.4 + phase * 2.1) * 0.2
        const fast = Math.sin(t * 7.8 + phase * 0.7) * 0.15
        const pulse = Math.sin(t * 0.6) * Math.sin(t * 2.3 + i * 0.3) * 0.15
        const ambient = Math.max(0, (slow + mid + fast + pulse + 0.45))
        let ambientHeight = baseHeight + ambient * (maxHeight * 0.55)

        // Mouse influence
        const dx = barCenterX - mouse.x
        const dy = centerY - mouse.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        let mouseInfluence = 0
        if (dist < influenceRadius) {
          mouseInfluence = 1 - dist / influenceRadius
          // Smooth the falloff
          mouseInfluence = mouseInfluence * mouseInfluence
        }

        const targetHeight = ambientHeight + mouseInfluence * (maxHeight - ambientHeight)
        const barH = targetHeight
        const barY = centerY - barH / 2

        // Opacity: brighter near mouse
        const baseOpacity = 0.3
        const alpha = baseOpacity + mouseInfluence * 0.7

        // Draw bar with rounded caps
        const radius = barWidth / 2
        const [r, g, b] = color

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
        ctx.beginPath()
        ctx.moveTo(x + radius, barY)
        ctx.lineTo(x + barWidth - radius, barY)
        ctx.quadraticCurveTo(x + barWidth, barY, x + barWidth, barY + radius)
        ctx.lineTo(x + barWidth, barY + barH - radius)
        ctx.quadraticCurveTo(x + barWidth, barY + barH, x + barWidth - radius, barY + barH)
        ctx.lineTo(x + radius, barY + barH)
        ctx.quadraticCurveTo(x, barY + barH, x, barY + barH - radius)
        ctx.lineTo(x, barY + radius)
        ctx.quadraticCurveTo(x, barY, x + radius, barY)
        ctx.closePath()
        ctx.fill()

        // Glow on hovered bars
        if (mouseInfluence > 0.3) {
          ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${mouseInfluence * 0.4})`
          ctx.shadowBlur = 12
          ctx.fill()
          ctx.shadowColor = 'transparent'
          ctx.shadowBlur = 0
        }
      }

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animRef.current)
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mouseleave', onMouseLeave)
      observer.disconnect()
    }
  }, [barCount, barWidth, barGap, baseHeight, maxHeight, color, influenceRadius])

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full cursor-crosshair ${className}`}
    />
  )
}
