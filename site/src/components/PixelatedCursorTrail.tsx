import { useEffect, useRef, useCallback } from 'react'

type TrailStyle = 'solid' | 'dashed' | 'dotted' | 'wave' | 'zigzag'
type AnimationPreset = 'none' | 'fadeInOut' | 'pulse' | 'rainbow'
type PixelShape = 'square' | 'circle'

interface ColorZone {
  /** CSS selector for the section element */
  selector: string
  color: string
}

interface Props {
  pixelCount?: number
  pixelSize?: number
  pixelShape?: PixelShape
  color?: string
  blur?: number
  fadeOut?: boolean
  scaleVariation?: boolean
  trailStyle?: TrailStyle
  animationPreset?: AnimationPreset
  presetSpeed?: number
  stiffness?: number
  damping?: number
  trailDuration?: number
  /** Define color zones that change trail color based on scroll position */
  colorZones?: ColorZone[]
}

export default function PixelatedCursorTrail({
  pixelCount = 20,
  pixelSize = 8,
  pixelShape = 'square',
  color = '#9B59B6',
  blur = 0,
  fadeOut = true,
  scaleVariation = true,
  trailStyle = 'solid',
  animationPreset = 'none',
  presetSpeed = 1,
  stiffness = 0.45,
  damping = 0.55,
  trailDuration = 400,
  colorZones = [],
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const positionsRef = useRef<{ x: number; y: number }[]>([])
  const mouseRef = useRef({ x: -500, y: -500 })
  const isMovingRef = useRef(false)
  const fadeStartRef = useRef(0)
  const globalOpacityRef = useRef(0)
  const animFrameRef = useRef(0)
  const timeRef = useRef(0)
  const moveTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const activeColorRef = useRef(color)
  const targetColorRef = useRef(color)
  const currentRgbRef = useRef(hexToRgbObj(color))

  const init = useCallback(() => {
    const positions: { x: number; y: number }[] = []
    for (let i = 0; i < pixelCount; i++) {
      positions.push({ x: -500, y: -500 })
    }
    positionsRef.current = positions
  }, [pixelCount])

  useEffect(() => {
    init()
  }, [init])

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
      isMovingRef.current = true
      globalOpacityRef.current = 1
      fadeStartRef.current = 0

      // Detect which color zone the cursor is in
      if (colorZones.length > 0) {
        let found = false
        for (const zone of colorZones) {
          const el = document.querySelector(zone.selector)
          if (el) {
            const rect = el.getBoundingClientRect()
            if (e.clientY >= rect.top && e.clientY <= rect.bottom) {
              targetColorRef.current = zone.color
              found = true
              break
            }
          }
        }
        if (!found) targetColorRef.current = color
      }

      if (moveTimerRef.current) clearTimeout(moveTimerRef.current)
      moveTimerRef.current = setTimeout(() => {
        isMovingRef.current = false
        fadeStartRef.current = Date.now()
      }, 80)
    }
    window.addEventListener('mousemove', onMouseMove)

    const draw = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      const positions = positionsRef.current
      const mouse = mouseRef.current

      timeRef.current += 0.016

      ctx.clearRect(0, 0, w, h)

      // Smoothly interpolate color
      const targetRgb = hexToRgbObj(targetColorRef.current)
      const cur = currentRgbRef.current
      cur.r += (targetRgb.r - cur.r) * 0.08
      cur.g += (targetRgb.g - cur.g) * 0.08
      cur.b += (targetRgb.b - cur.b) * 0.08
      activeColorRef.current = `rgb(${Math.round(cur.r)}, ${Math.round(cur.g)}, ${Math.round(cur.b)})`

      // Update positions — simple easing chain
      // Each pixel eases toward the one before it
      // The strength decreases down the chain for a natural lag
      for (let i = 0; i < positions.length; i++) {
        const target = i === 0 ? mouse : positions[i - 1]
        const ease = stiffness * Math.pow(damping, i * 0.3)

        positions[i].x += (target.x - positions[i].x) * ease
        positions[i].y += (target.y - positions[i].y) * ease
      }

      // Handle fade out
      if (!isMovingRef.current && fadeStartRef.current > 0) {
        const elapsed = Date.now() - fadeStartRef.current
        globalOpacityRef.current = Math.max(0, 1 - elapsed / trailDuration)
      }

      if (globalOpacityRef.current <= 0) {
        animFrameRef.current = requestAnimationFrame(draw)
        return
      }

      // Draw pixels
      for (let i = 0; i < positions.length; i++) {
        // Skip for styles
        if (trailStyle === 'dashed' && Math.floor(i / 3) % 2 === 1) continue
        if (trailStyle === 'dotted' && i % 2 === 1) continue

        const pos = positions[i]
        const t = i / positions.length // 0 to 1 along trail

        // Base opacity: fades along the trail
        let opacity = fadeOut ? 1 - t * 0.8 : 1
        opacity *= globalOpacityRef.current

        // Scale: shrinks along the trail
        let scale = scaleVariation ? 1 - t * 0.6 : 1

        // Animation presets
        const time = timeRef.current * presetSpeed
        const phase = i * 0.4

        switch (animationPreset) {
          case 'fadeInOut':
            opacity *= 0.5 + Math.sin(time * 3 + phase) * 0.5
            break
          case 'pulse':
            scale *= 0.6 + Math.sin(time * 4 + phase) * 0.4
            break
          case 'rainbow':
            break
        }

        if (opacity <= 0.01) continue

        // Style offsets
        let ox = 0
        let oy = 0
        if (trailStyle === 'wave') {
          // Perpendicular offset based on movement direction
          const next = i < positions.length - 1 ? positions[i + 1] : positions[i]
          const angle = Math.atan2(pos.y - next.y, pos.x - next.x) + Math.PI / 2
          const wave = Math.sin(i * 0.6 + time * 4) * pixelSize * 1.5
          ox = Math.cos(angle) * wave
          oy = Math.sin(angle) * wave
        } else if (trailStyle === 'zigzag') {
          const next = i < positions.length - 1 ? positions[i + 1] : positions[i]
          const angle = Math.atan2(pos.y - next.y, pos.x - next.x) + Math.PI / 2
          const offset = (i % 2 === 0 ? 1 : -1) * pixelSize * 1.2
          ox = Math.cos(angle) * offset
          oy = Math.sin(angle) * offset
        }

        const drawX = pos.x + ox
        const drawY = pos.y + oy
        const size = pixelSize * scale

        ctx.save()

        if (blur > 0) {
          ctx.filter = `blur(${blur}px)`
        }

        if (animationPreset === 'rainbow') {
          const hue = (time * 80 + i * 18) % 360
          ctx.fillStyle = `hsla(${hue}, 80%, 60%, ${opacity})`
        } else {
          const c = currentRgbRef.current
          ctx.fillStyle = `rgba(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)}, ${opacity})`
        }

        if (pixelShape === 'circle') {
          ctx.beginPath()
          ctx.arc(drawX, drawY, size / 2, 0, Math.PI * 2)
          ctx.fill()
        } else {
          ctx.fillRect(drawX - size / 2, drawY - size / 2, size, size)
        }

        ctx.restore()
      }

      animFrameRef.current = requestAnimationFrame(draw)
    }

    animFrameRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animFrameRef.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouseMove)
      if (moveTimerRef.current) clearTimeout(moveTimerRef.current)
    }
  }, [
    pixelSize, pixelShape, color, blur, fadeOut, scaleVariation,
    trailStyle, animationPreset, presetSpeed, stiffness, damping, trailDuration,
  ])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[9999] pointer-events-none"
    />
  )
}

function hexToRgbObj(hex: string): { r: number; g: number; b: number } {
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

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '')
  let r: number, g: number, b: number
  if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16)
    g = parseInt(clean[1] + clean[1], 16)
    b = parseInt(clean[2] + clean[2], 16)
  } else {
    r = parseInt(clean.substring(0, 2), 16)
    g = parseInt(clean.substring(2, 4), 16)
    b = parseInt(clean.substring(4, 6), 16)
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
