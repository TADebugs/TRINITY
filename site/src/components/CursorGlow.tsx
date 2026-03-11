import { useEffect, useRef } from 'react'

interface ColorZone {
  selector: string
  color: string
}

interface Props {
  color?: string
  size?: number
  opacity?: number
  colorZones?: ColorZone[]
}

export default function CursorGlow({
  color = '#ffffff',
  size = 220,
  opacity = 0.12,
  colorZones = [],
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: -500, y: -500 })
  const smoothRef = useRef({ x: -500, y: -500 })
  const animRef = useRef(0)
  const currentRgbRef = useRef(hexToRgb(color))
  const targetRgbRef = useRef(hexToRgb(color))
  const visibleRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
      visibleRef.current = 1

      if (colorZones.length > 0) {
        let found = false
        for (const zone of colorZones) {
          const el = document.querySelector(zone.selector)
          if (el) {
            const rect = el.getBoundingClientRect()
            if (e.clientY >= rect.top && e.clientY <= rect.bottom) {
              targetRgbRef.current = hexToRgb(zone.color)
              found = true
              break
            }
          }
        }
        if (!found) targetRgbRef.current = hexToRgb(color)
      }
    }

    const onMouseLeave = () => {
      visibleRef.current = 0
    }

    window.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseleave', onMouseLeave)

    const draw = () => {
      const w = window.innerWidth
      const h = window.innerHeight

      ctx.clearRect(0, 0, w, h)

      // Smooth mouse follow
      smoothRef.current.x += (mouseRef.current.x - smoothRef.current.x) * 0.15
      smoothRef.current.y += (mouseRef.current.y - smoothRef.current.y) * 0.15

      // Smooth color interpolation
      const cur = currentRgbRef.current
      const tgt = targetRgbRef.current
      cur.r += (tgt.r - cur.r) * 0.06
      cur.g += (tgt.g - cur.g) * 0.06
      cur.b += (tgt.b - cur.b) * 0.06

      const { x, y } = smoothRef.current
      const r = Math.round(cur.r)
      const g = Math.round(cur.g)
      const b = Math.round(cur.b)

      // Draw soft radial glow
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size)
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${opacity})`)
      gradient.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, ${opacity * 0.5})`)
      gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)

      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, w, h)

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [color, size, opacity, colorZones])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[9999] pointer-events-none"
    />
  )
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '')
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16),
    }
  }
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  }
}
