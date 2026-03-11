import { useRef, useCallback, useState, useEffect } from 'react'

interface AmbientAudioControls {
  isPlaying: boolean
  toggle: () => void
  setHoverInfluence: (x: number, y: number) => void // 0–1 normalized
  clearHoverInfluence: () => void
}

export default function useAmbientAudio(): AmbientAudioControls {
  const ctxRef = useRef<AudioContext | null>(null)
  const nodesRef = useRef<{
    oscs: OscillatorNode[]
    gains: GainNode[]
    filter: BiquadFilterNode
    master: GainNode
    lfo: OscillatorNode
    lfoGain: GainNode
  } | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const hoverRef = useRef({ active: false, x: 0.5, y: 0.5 })
  const animRef = useRef(0)

  const buildGraph = useCallback(() => {
    const ctx = new AudioContext()
    ctxRef.current = ctx

    // Master gain
    const master = ctx.createGain()
    master.gain.value = 0
    master.connect(ctx.destination)

    // Filter — low pass, will be modulated by hover
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 400
    filter.Q.value = 2
    filter.connect(master)

    // LFO for gentle tremolo
    const lfo = ctx.createOscillator()
    const lfoGain = ctx.createGain()
    lfo.type = 'sine'
    lfo.frequency.value = 0.3
    lfoGain.gain.value = 0.08
    lfo.connect(lfoGain)
    lfoGain.connect(master.gain)
    lfo.start()

    // Pad oscillators — stacked fifths and octaves for ambient chord
    const freqs = [65.41, 98.0, 130.81, 196.0, 261.63, 329.63] // C2, G2, C3, G3, C4, E4
    const types: OscillatorType[] = ['sine', 'sine', 'triangle', 'sine', 'sine', 'sine']
    const volumes = [0.12, 0.08, 0.06, 0.05, 0.03, 0.02]

    const oscs: OscillatorNode[] = []
    const gains: GainNode[] = []

    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      osc.type = types[i]
      // Slight detune for warmth
      osc.frequency.value = freq
      osc.detune.value = (Math.random() - 0.5) * 8

      const gain = ctx.createGain()
      gain.gain.value = volumes[i]

      osc.connect(gain)
      gain.connect(filter)
      osc.start()

      oscs.push(osc)
      gains.push(gain)
    })

    nodesRef.current = { oscs, gains, filter, master, lfo, lfoGain }
    return ctx
  }, [])

  // Animate filter/gain based on hover
  useEffect(() => {
    const tick = () => {
      const nodes = nodesRef.current
      if (!nodes) {
        animRef.current = requestAnimationFrame(tick)
        return
      }

      const { filter, master, gains } = nodes
      const hover = hoverRef.current

      if (hover.active) {
        // x position controls filter cutoff (200 to 4000 Hz)
        const targetFreq = 200 + hover.x * 3800
        filter.frequency.value += (targetFreq - filter.frequency.value) * 0.08

        // y position controls resonance (1 to 12)
        const targetQ = 1 + (1 - hover.y) * 11
        filter.Q.value += (targetQ - filter.Q.value) * 0.08

        // Boost volume slightly on hover
        const targetGain = 0.22
        master.gain.value += (targetGain - master.gain.value) * 0.05

        // Animate individual oscillator volumes based on x
        gains.forEach((g, i) => {
          const baseVol = [0.12, 0.08, 0.06, 0.05, 0.03, 0.02][i]
          const boost = hover.x > i / gains.length ? 1.8 : 0.6
          const target = baseVol * boost
          g.gain.value += (target - g.gain.value) * 0.06
        })
      } else {
        // Return to ambient defaults
        filter.frequency.value += (400 - filter.frequency.value) * 0.03
        filter.Q.value += (2 - filter.Q.value) * 0.03
        master.gain.value += (0.15 - master.gain.value) * 0.03

        gains.forEach((g, i) => {
          const baseVol = [0.12, 0.08, 0.06, 0.05, 0.03, 0.02][i]
          g.gain.value += (baseVol - g.gain.value) * 0.03
        })
      }

      animRef.current = requestAnimationFrame(tick)
    }

    animRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  const toggle = useCallback(() => {
    if (isPlaying) {
      // Fade out then stop
      const nodes = nodesRef.current
      const ctx = ctxRef.current
      if (nodes && ctx) {
        nodes.master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5)
        setTimeout(() => {
          nodes.oscs.forEach((o) => { try { o.stop() } catch {} })
          nodes.lfo.stop()
          ctx.close()
          ctxRef.current = null
          nodesRef.current = null
        }, 600)
      }
      setIsPlaying(false)
    } else {
      const ctx = buildGraph()
      // Fade in
      const nodes = nodesRef.current!
      nodes.master.gain.setValueAtTime(0, ctx.currentTime)
      nodes.master.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 1.5)
      setIsPlaying(true)
    }
  }, [isPlaying, buildGraph])

  const setHoverInfluence = useCallback((x: number, y: number) => {
    hoverRef.current = { active: true, x, y }
  }, [])

  const clearHoverInfluence = useCallback(() => {
    hoverRef.current = { active: false, x: 0.5, y: 0.5 }
  }, [])

  return { isPlaying, toggle, setHoverInfluence, clearHoverInfluence }
}
