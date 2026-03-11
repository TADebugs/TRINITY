import { useRef, useEffect, useCallback } from 'react'

interface Props {
  dotSize?: number
  dotSpacing?: number
  dotColor?: string
  background?: string
  distortionRadius?: number
  distortionStrength?: number
  animationSpeed?: number
  showCursor?: boolean
  className?: string
}

export default function InteractiveDotGrid({
  dotSize = 2,
  dotSpacing = 28,
  dotColor = 'rgba(255, 255, 255, 0.15)',
  background = 'transparent',
  distortionRadius = 150,
  distortionStrength = 20,
  animationSpeed = 0.15,
  showCursor = false,
  className = '',
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: -1000, y: -1000 })
  const smoothMouseRef = useRef({ x: -1000, y: -1000 })
  const animFrameRef = useRef<number>(0)
  const dotsRef = useRef<{ baseX: number; baseY: number; x: number; y: number }[]>([])
  const sizeRef = useRef({ w: 0, h: 0 })

  const buildGrid = useCallback(() => {
    const { w, h } = sizeRef.current
    const dots: typeof dotsRef.current = []
    const cols = Math.floor(w / dotSpacing)
    const rows = Math.floor(h / dotSpacing)
    const offsetX = (w - cols * dotSpacing) / 2 + dotSpacing / 2
    const offsetY = (h - rows * dotSpacing) / 2 + dotSpacing / 2

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = offsetX + c * dotSpacing
        const y = offsetY + r * dotSpacing
        dots.push({ baseX: x, baseY: y, x, y })
      }
    }
    dotsRef.current = dots
  }, [dotSpacing])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        const dpr = window.devicePixelRatio || 1
        canvas.width = width * dpr
        canvas.height = height * dpr
        canvas.style.width = `${width}px`
        canvas.style.height = `${height}px`
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        sizeRef.current = { w: width, h: height }
        buildGrid()
      }
    })

    resizeObserver.observe(canvas.parentElement || canvas)

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
    }

    const onMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 }
    }

    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mouseleave', onMouseLeave)

    const draw = () => {
      const { w, h } = sizeRef.current
      const dots = dotsRef.current
      const mouse = mouseRef.current
      const smooth = smoothMouseRef.current

      // Smooth mouse interpolation
      smooth.x += (mouse.x - smooth.x) * animationSpeed
      smooth.y += (mouse.y - smooth.y) * animationSpeed

      ctx.clearRect(0, 0, w, h)

      if (background !== 'transparent') {
        ctx.fillStyle = background
        ctx.fillRect(0, 0, w, h)
      }

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i]
        const dx = dot.baseX - smooth.x
        const dy = dot.baseY - smooth.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < distortionRadius) {
          const force = (1 - dist / distortionRadius) * distortionStrength
          const angle = Math.atan2(dy, dx)
          dot.x += (dot.baseX + Math.cos(angle) * force - dot.x) * animationSpeed
          dot.y += (dot.baseY + Math.sin(angle) * force - dot.y) * animationSpeed
        } else {
          dot.x += (dot.baseX - dot.x) * animationSpeed
          dot.y += (dot.baseY - dot.y) * animationSpeed
        }

        // Calculate opacity based on distance for glow effect
        let alpha = 1
        if (dist < distortionRadius) {
          alpha = 0.4 + (1 - dist / distortionRadius) * 0.6
        }

        ctx.beginPath()
        ctx.arc(dot.x, dot.y, dotSize, 0, Math.PI * 2)
        ctx.fillStyle = dotColor.includes('rgba')
          ? dotColor
          : `rgba(${hexToRgb(dotColor)}, ${alpha})`
        ctx.fill()
      }

      animFrameRef.current = requestAnimationFrame(draw)
    }

    animFrameRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animFrameRef.current)
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mouseleave', onMouseLeave)
      resizeObserver.disconnect()
    }
  }, [dotSize, dotSpacing, dotColor, background, distortionRadius, distortionStrength, animationSpeed, buildGrid])

  return (
    <div className={`relative w-full h-full ${className}`} style={{ cursor: showCursor ? 'default' : 'none' }}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  )
}

function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '')
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16)
    const g = parseInt(clean[1] + clean[1], 16)
    const b = parseInt(clean[2] + clean[2], 16)
    return `${r}, ${g}, ${b}`
  }
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)
  return `${r}, ${g}, ${b}`
}
