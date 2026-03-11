import { useRef, useState, useEffect } from 'react'
import { motion, useScroll, useTransform, useMotionValue, useSpring, useInView } from 'framer-motion'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { SplitText, FadeUp, ScaleIn, SlideIn, StaggerContainer, StaggerItem } from '../components/AnimatedText'
import InteractiveDotGrid from '../components/InteractiveDotGrid'
import InteractiveWaveform from '../components/InteractiveWaveform'
import useAmbientAudio from '../hooks/useAmbientAudio'

// Sprite imports
import ariaOrb from '../sprites/ARIA.png'
import echoOrb from '../sprites/ECHO.png'
import nexusOrb from '../sprites/NEXUS.png'
import micImg from '../sprites/Mic.png'
import keyboardImg from '../sprites/Keyboard.png'
import touchscreenImg from '../sprites/touchscreen.png'
// waveform section uses animated bars instead of an image
import allBlobsImg from '../sprites/All_THREE_BLOBS.png'
import macDesktopImg from '../sprites/mac_desktop.png'
import alexImg from '../sprites/Alex_M.png'
import priyaImg from '../sprites/priya_S.png'
import jordanImg from '../sprites/Jordan_K.png'

function GradientOrb({ color, className }: { color: string; className?: string }) {
  return (
    <motion.div
      className={`absolute rounded-full blur-[120px] opacity-20 pointer-events-none ${className}`}
      style={{ background: color }}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.15, 0.25, 0.15],
      }}
      transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}

function MagneticButton({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    el.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`
  }

  const handleMouseLeave = () => {
    if (ref.current) ref.current.style.transform = 'translate(0, 0)'
  }

  return (
    <div
      ref={ref}
      className={`transition-transform duration-300 ease-out ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  )
}

function TiltCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), { stiffness: 300, damping: 30 })
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), { stiffness: 300, damping: 30 })

  const handleMouseMove = (e: React.MouseEvent) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    x.set((e.clientX - rect.left) / rect.width - 0.5)
    y.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.div>
  )
}

function AnimatedCounter({ value, label }: { value: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [display, setDisplay] = useState('0')

  useEffect(() => {
    if (!isInView) return
    // Extract numeric part
    const numMatch = value.match(/(\d+)/)
    if (!numMatch) {
      setDisplay(value)
      return
    }
    const target = parseInt(numMatch[1])
    const prefix = value.slice(0, value.indexOf(numMatch[1]))
    const suffix = value.slice(value.indexOf(numMatch[1]) + numMatch[1].length)
    let current = 0
    const step = Math.max(1, Math.floor(target / 40))
    const interval = setInterval(() => {
      current += step
      if (current >= target) {
        current = target
        clearInterval(interval)
      }
      setDisplay(`${prefix}${current}${suffix}`)
    }, 30)
    return () => clearInterval(interval)
  }, [isInView, value])

  return (
    <div ref={ref} className="text-center py-8 relative group">
      <motion.div
        className="font-heading text-5xl md:text-7xl font-bold bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent"
        initial={{ scale: 0.5, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.6, type: 'spring', bounce: 0.3 }}
      >
        {display}
      </motion.div>
      <p className="mt-3 text-sm text-white/40">{label}</p>
      {/* Hover underline */}
      <motion.div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
        initial={{ width: 0 }}
        whileInView={{ width: '60%' }}
        viewport={{ once: true }}
        transition={{ delay: 0.5, duration: 0.8 }}
      />
    </div>
  )
}

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95])
  const audio = useAmbientAudio()

  return (
    <div className="min-h-screen bg-[#0a0a0a] overflow-hidden">
      <Navbar />

      {/* ─── HERO ─── */}
      <section id="s-hero" ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center px-6 lg:px-8 pt-32 md:pt-40 pb-32">
        {/* Interactive dot grid background */}
        <div className="absolute inset-0 z-0">
          <InteractiveDotGrid
            dotSize={1.5}
            dotSpacing={30}
            dotColor="rgba(255, 255, 255, 0.12)"
            distortionRadius={180}
            distortionStrength={25}
            animationSpeed={0.12}
            showCursor
          />
        </div>

        {/* Animated gradient orbs */}
        <GradientOrb color="#4A90D9" className="w-[600px] h-[600px] -top-20 -left-40" />
        <GradientOrb color="#9B59B6" className="w-[500px] h-[500px] top-1/3 -right-20" />
        <GradientOrb color="#27AE60" className="w-[400px] h-[400px] bottom-20 left-1/3" />

        <motion.div style={{ y: heroY, opacity: heroOpacity, scale: heroScale }} className="relative z-10 text-center max-w-5xl mx-auto pointer-events-none">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-sm font-medium text-brand-purple tracking-[0.2em] uppercase mb-6"
          >
            macOS AI Assistant
          </motion.p>

          <h1 className="font-heading text-6xl md:text-8xl lg:text-9xl font-bold leading-[0.9] tracking-tight">
            <SplitText text="Three minds," delay={0.5} />
            <br />
            <SplitText text="one interface" delay={0.7} />
          </h1>

          <FadeUp delay={1.0}>
            <p className="mt-8 text-lg md:text-xl text-white/40 max-w-2xl mx-auto leading-relaxed font-body">
              TRINITY is a macOS desktop AI assistant with three distinct personalities — ARIA, ECHO, and NEXUS — that you can switch between instantly.
            </p>
          </FadeUp>

          <FadeUp delay={1.2}>
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 pointer-events-auto">
              <MagneticButton>
                <a
                  href="#"
                  className="inline-block rounded-full bg-white px-10 py-4 text-sm font-semibold text-black hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] transition-all duration-500"
                >
                  Download for macOS
                </a>
              </MagneticButton>
              <MagneticButton>
                <a
                  href="#"
                  className="inline-block rounded-full border border-white/10 px-10 py-4 text-sm font-semibold text-white hover:bg-white/5 hover:border-white/20 transition-all duration-500"
                >
                  Watch Demo
                </a>
              </MagneticButton>
            </div>
          </FadeUp>

        </motion.div>

        {/* Desktop preview — separate from hero text so it lingers longer on scroll */}
        <motion.div
          style={{
            y: useTransform(scrollYProgress, [0, 1], [0, 100]),
            opacity: useTransform(scrollYProgress, [0, 0.8], [1, 0]),
          }}
          className="relative z-10 mt-20 max-w-4xl mx-auto px-4"
        >
          <FadeUp delay={1.5}>
            <div className="relative">
              <div className="rounded-2xl border border-white/10 overflow-hidden shadow-[0_0_80px_rgba(155,89,182,0.15)]">
                <img
                  src={macDesktopImg}
                  alt="TRINITY running on macOS"
                  className="w-full h-auto"
                />
              </div>
              {/* Glow beneath the screenshot */}
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-brand-purple/20 blur-[60px] rounded-full" />
            </div>
          </FadeUp>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
        >
          <motion.div
            className="w-5 h-8 rounded-full border border-white/20 flex justify-center pt-1.5"
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.div
              className="w-1 h-2 rounded-full bg-white/50"
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
        </motion.div>
      </section>

      {/* ─── PERSONALITY CARDS ─── */}
      <section id="s-personalities" className="py-32 px-6 lg:px-8 relative">
        <GradientOrb color="#4A90D9" className="w-[300px] h-[300px] top-0 right-1/4" />

        <div className="mx-auto max-w-7xl">
          <FadeUp>
            <p className="text-sm font-medium text-brand-blue tracking-[0.2em] uppercase mb-4">Seamless Switching</p>
          </FadeUp>
          <FadeUp delay={0.1}>
            <h2 className="font-heading text-4xl md:text-6xl font-bold leading-tight max-w-3xl">
              Switch instantly between minds
            </h2>
          </FadeUp>
          <FadeUp delay={0.2}>
            <p className="mt-6 text-white/40 max-w-xl text-lg">
              Each personality comes with its own voice, theme, toolset, and conversation context.
            </p>
          </FadeUp>

          <StaggerContainer className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6" staggerDelay={0.15}>
            {[
              {
                name: 'ARIA',
                tagline: 'Assistant Mode',
                color: '#4A90D9',
                accent: '#2563EB',
                desc: 'Sarcastic, sharp, and always on top of your tasks. Browser automation, smart home, calendar.',
                shortcut: 'Cmd + 1',
                orb: ariaOrb,
                orbSize: 'w-16 h-16',
              },
              {
                name: 'ECHO',
                tagline: 'Creative Mode',
                color: '#9B59B6',
                accent: '#7C3AED',
                desc: 'Warm, imaginative, and full of dad jokes. CAD generation, 3D printing, brainstorming.',
                shortcut: 'Cmd + 2',
                orb: echoOrb,
                orbSize: 'w-14 h-14',
              },
              {
                name: 'NEXUS',
                tagline: 'Developer Mode',
                color: '#27AE60',
                accent: '#16A34A',
                desc: 'Precise, methodical, and deeply technical. Code generation, terminal, git, file ops.',
                shortcut: 'Cmd + 3',
                orb: nexusOrb,
                orbSize: 'w-16 h-16',
              },
            ].map((p) => (
              <StaggerItem key={p.name}>
                <TiltCard className="h-full">
                  <motion.div
                    className="group relative rounded-3xl border border-white/5 bg-white/[0.02] p-8 md:p-10 overflow-hidden cursor-pointer h-full"
                    whileHover={{ y: -8, borderColor: `${p.color}30` }}
                    transition={{ duration: 0.4, ease: [0.33, 1, 0.68, 1] }}
                  >
                    {/* Hover glow */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                      style={{
                        background: `radial-gradient(circle at 50% 0%, ${p.color}15 0%, transparent 70%)`,
                      }}
                    />
                    {/* Animated border gradient on hover */}
                    <div
                      className="absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10"
                      style={{
                        background: `linear-gradient(135deg, ${p.color}20, transparent 50%, ${p.color}10)`,
                      }}
                    />

                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-6">
                        <motion.img
                          src={p.orb}
                          alt={`${p.name} orb`}
                          className={`${p.orbSize} object-contain drop-shadow-lg`}
                          animate={{ scale: [1, 1.08, 1], opacity: [0.85, 1, 0.85] }}
                          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                          style={{ filter: `drop-shadow(0 0 12px ${p.color}40)` }}
                        />
                        <motion.span
                          className="text-xs text-white/20 font-mono px-2 py-1 rounded-md border border-white/5"
                          whileHover={{ borderColor: `${p.color}30`, color: `${p.color}` }}
                        >
                          {p.shortcut}
                        </motion.span>
                      </div>
                      <h3 className="font-heading text-2xl font-bold group-hover:text-white transition-colors">{p.name}</h3>
                      <p className="text-sm mt-1 mb-5 font-medium" style={{ color: p.color }}>{p.tagline}</p>
                      <p className="text-sm text-white/40 leading-relaxed group-hover:text-white/50 transition-colors">{p.desc}</p>

                      {/* Bottom accent line */}
                      <motion.div
                        className="mt-6 h-px rounded-full"
                        style={{ background: `linear-gradient(to right, ${p.color}, transparent)` }}
                        initial={{ scaleX: 0, originX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                      />
                    </div>
                  </motion.div>
                </TiltCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ─── THREE WAYS TO SWITCH ─── */}
      <section id="s-interaction" className="py-32 px-6 lg:px-8 bg-surface/50">
        <div className="mx-auto max-w-7xl text-center">
          <FadeUp>
            <p className="text-sm font-medium text-brand-green tracking-[0.2em] uppercase mb-4">Interaction</p>
          </FadeUp>
          <FadeUp delay={0.1}>
            <h2 className="font-heading text-4xl md:text-6xl font-bold">
              Three ways to switch
              <br />
              <span className="text-white/30">and command</span>
            </h2>
          </FadeUp>

          <StaggerContainer className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6" staggerDelay={0.12}>
            {[
              {
                title: 'Voice commands',
                desc: 'Say the wake word — "ARIA", "ECHO", or "NEXUS" — and the personality switches instantly.',
                img: micImg,
              },
              {
                title: 'Keyboard shortcuts',
                desc: 'Cmd+1 for ARIA, Cmd+2 for ECHO, Cmd+3 for NEXUS. Cmd+Shift+Space activates the last-used.',
                img: keyboardImg,
              },
              {
                title: 'UI clicks',
                desc: 'Click the personality selector in the top bar to switch modes visually.',
                img: touchscreenImg,
              },
            ].map((item, idx) => (
              <StaggerItem key={item.title}>
                <TiltCard className="h-full">
                  <motion.div
                    className="group relative rounded-3xl border border-white/5 bg-white/[0.02] p-10 text-left h-full overflow-hidden"
                    whileHover={{ y: -6, borderColor: 'rgba(39,174,96,0.2)' }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Hover spotlight */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{ background: 'radial-gradient(circle at 30% 20%, rgba(39,174,96,0.06) 0%, transparent 60%)' }}
                    />

                    <motion.div
                      className="relative mb-6 w-16 h-16 rounded-2xl bg-white/[0.03] overflow-hidden border border-white/5 group-hover:border-white/10 transition-colors"
                      whileHover={{ scale: 1.05, rotate: 2 }}
                    >
                      <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
                      {/* Shine effect on hover */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </motion.div>

                    <h3 className="font-heading text-xl font-semibold mb-3 group-hover:text-white transition-colors">{item.title}</h3>
                    <p className="text-sm text-white/40 leading-relaxed group-hover:text-white/50 transition-colors">{item.desc}</p>

                    {/* Step number */}
                    <div className="absolute top-6 right-6 font-mono text-6xl font-bold text-white/[0.03] group-hover:text-white/[0.06] transition-colors">
                      {idx + 1}
                    </div>
                  </motion.div>
                </TiltCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ─── REAL-TIME AUDIO ─── */}
      <section id="s-audio" className="py-32 px-6 lg:px-8 relative">
        <GradientOrb color="#DA5194" className="w-[500px] h-[500px] top-1/4 -right-40" />

        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <SlideIn direction="left">
              <div>
                <p className="text-sm font-medium text-brand-pink tracking-[0.2em] uppercase mb-4">Audio Engine</p>
                <h2 className="font-heading text-4xl md:text-5xl font-bold leading-tight">
                  Real-time voices that respond{' '}
                  <span className="bg-gradient-to-r from-brand-pink to-brand-purple bg-clip-text text-transparent">instantly</span>
                </h2>
                <p className="mt-6 text-white/40 text-lg leading-relaxed">
                  Powered by Google Gemini 2.5 Native Audio API, TRINITY streams responses in real time. Each personality has its own conversational style.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  {['Streaming', 'Low latency', 'Gemini 2.5', 'Native Audio'].map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-white/[0.03] border border-white/5 px-4 py-2 text-xs text-white/50 hover:text-white/80 hover:border-white/10 transition-all cursor-default"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </SlideIn>

            <SlideIn direction="right" delay={0.2}>
              <div className="relative">
                <div className="rounded-3xl border border-white/5 bg-white/[0.02] aspect-video overflow-hidden relative">
                  <InteractiveWaveform
                    barCount={40}
                    barWidth={4}
                    barGap={3}
                    baseHeight={8}
                    maxHeight={80}
                    color={[218, 81, 148]}
                    influenceRadius={180}
                    onHover={audio.setHoverInfluence}
                    onHoverEnd={audio.clearHoverInfluence}
                  />

                  {/* Play/pause toggle */}
                  <motion.button
                    onClick={audio.toggle}
                    className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center backdrop-blur-sm hover:bg-white/10 transition-colors z-10"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    title={audio.isPlaying ? 'Pause ambient audio' : 'Play ambient audio'}
                  >
                    {audio.isPlaying ? (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <rect x="2" y="1" width="3.5" height="12" rx="1" fill="rgba(218,81,148,0.8)" />
                        <rect x="8.5" y="1" width="3.5" height="12" rx="1" fill="rgba(218,81,148,0.8)" />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M3 1.5L12 7L3 12.5V1.5Z" fill="rgba(218,81,148,0.8)" />
                      </svg>
                    )}
                  </motion.button>

                  {/* Hint text */}
                  {!audio.isPlaying && (
                    <motion.p
                      className="absolute bottom-4 left-4 text-[10px] text-white/20 font-mono"
                      animate={{ opacity: [0.2, 0.5, 0.2] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      click ▶ to hear it
                    </motion.p>
                  )}
                  {audio.isPlaying && (
                    <motion.p
                      className="absolute bottom-4 left-4 text-[10px] text-brand-pink/40 font-mono"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      hover to modulate ↗
                    </motion.p>
                  )}
                </div>
              </div>
            </SlideIn>
          </div>
        </div>
      </section>

      {/* ─── BUILT FOR WHAT MATTERS ─── */}
      <section id="s-features" className="py-32 px-6 lg:px-8 bg-surface/50">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <FadeUp>
              <h2 className="font-heading text-4xl md:text-6xl font-bold">Built for what matters</h2>
            </FadeUp>
            <FadeUp delay={0.1}>
              <p className="mt-6 text-white/40 max-w-xl mx-auto text-lg">
                Cross-personality memory, productivity tools, creative tools, and developer integrations.
              </p>
            </FadeUp>
          </div>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" staggerDelay={0.1}>
            {[
              { title: 'Shared Memory', desc: 'Cross-personality recall. What one learns, all can remember.', color: '#4A90D9', icon: '◈' },
              { title: 'Smart Home & Productivity', desc: 'Browser automation, TP-Link smart home, calendar, web search.', color: '#DA5194', icon: '⬡' },
              { title: 'CAD & Creative', desc: '3D modeling, image generation, brainstorming, writing assist.', color: '#9B59B6', icon: '△' },
              { title: 'Developer Tools', desc: 'Code gen, terminal, git control, file operations.', color: '#27AE60', icon: '⟐' },
            ].map((item) => (
              <StaggerItem key={item.title}>
                <motion.div
                  className="group relative rounded-3xl border border-white/5 bg-white/[0.02] p-8 h-full overflow-hidden"
                  whileHover={{ y: -6, borderColor: `${item.color}25` }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Hover glow */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                    style={{ background: `radial-gradient(circle at 50% 0%, ${item.color}10 0%, transparent 70%)` }}
                  />

                  <motion.div
                    className="w-12 h-12 rounded-xl mb-6 flex items-center justify-center border border-white/5 group-hover:border-opacity-20 transition-all"
                    style={{ backgroundColor: `${item.color}08` }}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <motion.span
                      className="text-lg"
                      style={{ color: item.color }}
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {item.icon}
                    </motion.span>
                  </motion.div>
                  <h3 className="font-heading text-base font-semibold mb-3 group-hover:text-white transition-colors">{item.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed group-hover:text-white/50 transition-colors">{item.desc}</p>

                  {/* Corner accent */}
                  <div
                    className="absolute bottom-0 right-0 w-16 h-16 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `radial-gradient(circle at 100% 100%, ${item.color}08, transparent 70%)` }}
                  />
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section id="s-stats" className="py-32 px-6 lg:px-8 relative overflow-hidden">
        <GradientOrb color="#BBB39A" className="w-[400px] h-[400px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

        <div className="mx-auto max-w-7xl relative">
          <FadeUp>
            <div className="text-center mb-16">
              <p className="text-sm font-medium text-brand-olive tracking-[0.2em] uppercase mb-4">By the numbers</p>
              <h2 className="font-heading text-4xl md:text-6xl font-bold">
                Built lean, built fast,
                <br />
                <span className="text-white/30">built for macOS</span>
              </h2>
            </div>
          </FadeUp>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '3', label: 'AI Personalities' },
              { value: '50+', label: 'Supported tools' },
              { value: '<100ms', label: 'Personality switch' },
              { value: 'Real-time', label: 'Audio streaming' },
            ].map((stat, i) => (
              <AnimatedCounter key={stat.label} value={stat.value} label={stat.label} />
            ))}
          </div>

          {/* Decorative horizontal line */}
          <motion.div
            className="mt-12 h-px mx-auto bg-gradient-to-r from-transparent via-white/10 to-transparent"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section id="s-testimonials" className="py-32 px-6 lg:px-8 bg-surface/50">
        <div className="mx-auto max-w-7xl">
          <FadeUp>
            <div className="text-center mb-16">
              <h2 className="font-heading text-4xl md:text-6xl font-bold">Loved</h2>
              <p className="mt-4 text-white/40 text-lg">What early users are saying.</p>
            </div>
          </FadeUp>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6" staggerDelay={0.12}>
            {[
              {
                quote: "ARIA's sarcasm keeps me entertained while it handles my smart home. It's like having a witty roommate who actually helps.",
                name: 'Alex M.',
                role: 'Product Designer',
                avatar: alexImg,
              },
              {
                quote: "ECHO generated a CAD model from my description in seconds. The dad jokes are a bonus I didn't know I needed.",
                name: 'Priya S.',
                role: '3D Artist',
                avatar: priyaImg,
              },
              {
                quote: "NEXUS feels like pair programming with someone who actually knows what they're doing. The git integration is seamless.",
                name: 'Jordan K.',
                role: 'Full-stack Developer',
                avatar: jordanImg,
              },
            ].map((t) => (
              <StaggerItem key={t.name}>
                <TiltCard className="h-full">
                  <motion.div
                    className="group relative rounded-3xl border border-white/5 bg-white/[0.02] p-10 h-full overflow-hidden"
                    whileHover={{ y: -6, borderColor: 'rgba(74,144,217,0.15)' }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Hover glow */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{ background: 'radial-gradient(circle at 50% 100%, rgba(74,144,217,0.05) 0%, transparent 60%)' }}
                    />

                    {/* Large decorative quote mark */}
                    <motion.span
                      className="absolute top-4 right-6 text-6xl font-serif text-white/[0.03] group-hover:text-white/[0.08] transition-colors duration-500 select-none"
                      initial={{ y: 10, opacity: 0 }}
                      whileInView={{ y: 0, opacity: 1 }}
                      viewport={{ once: true }}
                    >
                      "
                    </motion.span>

                    <div className="flex gap-1 mb-6">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <motion.span
                          key={s}
                          className="text-yellow-500/60 text-sm"
                          initial={{ opacity: 0, scale: 0 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: s * 0.08, type: 'spring', bounce: 0.5 }}
                        >
                          ★
                        </motion.span>
                      ))}
                    </div>
                    <p className="text-sm text-white/60 leading-relaxed mb-8 relative z-10">"{t.quote}"</p>
                    <div className="flex items-center gap-3">
                      <motion.img
                        src={t.avatar}
                        alt={t.name}
                        className="w-10 h-10 rounded-full object-cover ring-1 ring-white/10 group-hover:ring-white/20 transition-all"
                        whileHover={{ scale: 1.1 }}
                      />
                      <div>
                        <p className="font-heading text-sm font-semibold">{t.name}</p>
                        <p className="text-xs text-white/30">{t.role}</p>
                      </div>
                    </div>
                  </motion.div>
                </TiltCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section id="s-cta" className="py-40 px-6 lg:px-8 relative overflow-hidden">
        {/* Three blobs background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.img
            src={allBlobsImg}
            alt=""
            className="w-[700px] md:w-[900px] opacity-50"
            animate={{ scale: [1, 1.06, 1], opacity: [0.4, 0.6, 0.4] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <ScaleIn>
            <h2 className="font-heading text-5xl md:text-7xl font-bold leading-tight">
              Get TRINITY
              <br />
              <span className="bg-gradient-to-r from-brand-blue via-brand-purple to-brand-green bg-clip-text text-transparent">
                on your Mac
              </span>
            </h2>
          </ScaleIn>
          <FadeUp delay={0.2}>
            <p className="mt-6 text-white/40 max-w-xl mx-auto text-lg">
              Three personalities. One download. Join the early access program.
            </p>
          </FadeUp>
          <FadeUp delay={0.3}>
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
              <MagneticButton>
                <a
                  href="#"
                  className="inline-block rounded-full bg-white px-10 py-4 text-sm font-semibold text-black hover:shadow-[0_0_50px_rgba(255,255,255,0.2)] transition-all duration-500"
                >
                  Download for macOS
                </a>
              </MagneticButton>
              <MagneticButton>
                <a
                  href="#"
                  className="inline-block rounded-full border border-white/10 px-10 py-4 text-sm font-semibold text-white hover:bg-white/5 transition-all duration-500"
                >
                  Join Early Access
                </a>
              </MagneticButton>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ─── NEWSLETTER ─── */}
      <section className="py-32 px-6 lg:px-8 bg-surface/50 relative overflow-hidden">
        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-brand-purple/30"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.4,
              ease: 'easeInOut',
            }}
          />
        ))}

        <div className="mx-auto max-w-2xl text-center relative">
          <FadeUp>
            <h2 className="font-heading text-4xl md:text-5xl font-bold">Stay in the loop</h2>
          </FadeUp>
          <FadeUp delay={0.1}>
            <p className="mt-4 text-white/40 text-lg">Product updates, new features, and developer news. No spam.</p>
          </FadeUp>
          <FadeUp delay={0.2}>
            <form className="mt-10 flex gap-3 max-w-md mx-auto relative" onSubmit={(e) => e.preventDefault()}>
              <div className="relative flex-1 group">
                <input
                  type="email"
                  placeholder="Your email"
                  className="w-full rounded-full bg-white/[0.03] border border-white/10 px-6 py-3.5 text-sm text-white placeholder-white/25 outline-none focus:border-brand-purple/30 transition-all duration-500"
                />
                {/* Focus glow ring */}
                <div className="absolute inset-0 rounded-full opacity-0 group-focus-within:opacity-100 -z-10 blur-md transition-opacity duration-500 bg-brand-purple/10" />
              </div>
              <MagneticButton>
                <button
                  type="submit"
                  className="rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-black hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] transition-all"
                >
                  Subscribe
                </button>
              </MagneticButton>
            </form>
          </FadeUp>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-32 px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <FadeUp>
            <h2 className="font-heading text-4xl md:text-5xl font-bold mb-2">Questions</h2>
            <p className="text-white/40 mb-16 text-lg">Everything you need to know about TRINITY.</p>
          </FadeUp>

          <div className="space-y-4">
            {[
              {
                q: 'What macOS versions work?',
                a: 'TRINITY runs on macOS 12 (Monterey) and later. The app is native to Apple Silicon and Intel Macs, with no performance compromise on either architecture.',
              },
              {
                q: 'Can I use all three personalities?',
                a: 'Yes. All three personalities are included in a single download. Switch between them with voice, keyboard shortcuts, or clicks. Each one remembers what the others have learned.',
              },
              {
                q: 'Is my data private?',
                a: "Your audio and text are processed by Google's Gemini API. TRINITY stores your memory locally in SQLite. We don't sell your data or train on your conversations.",
              },
              {
                q: 'Can I use it offline?',
                a: 'TRINITY requires an internet connection for Gemini API calls and real-time audio processing. Local features like file operations and terminal access work without the network.',
              },
              {
                q: 'What about API access?',
                a: 'The REST API lets you build on top of TRINITY. Switch personalities, access tools, read and write memory, and manage settings programmatically from your own apps.',
              },
            ].map((item, i) => (
              <FadeUp key={i} delay={i * 0.05}>
                <motion.details
                  className="group rounded-2xl border border-white/5 bg-white/[0.02] transition-all duration-300 hover:border-white/10 hover:bg-white/[0.03]"
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.2 }}
                >
                  <summary className="flex items-center justify-between cursor-pointer px-6 py-5 text-sm font-semibold font-heading select-none">
                    <div className="flex items-center gap-3">
                      {/* Accent dot */}
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-purple/50 group-hover:bg-brand-purple transition-colors flex-shrink-0" />
                      {item.q}
                    </div>
                    <motion.span className="text-white/30 text-xl ml-4 flex-shrink-0 transition-all duration-300 group-open:rotate-45 group-hover:text-brand-purple/60">
                      +
                    </motion.span>
                  </summary>
                  <div className="px-6 pb-6 pl-[2.1rem] text-sm text-white/40 leading-relaxed">
                    {item.a}
                  </div>
                </motion.details>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HELP ─── */}
      <section className="py-20 px-6 lg:px-8 bg-surface/50">
        <div className="mx-auto max-w-3xl">
          <FadeUp>
            <h3 className="font-heading text-2xl font-bold">Need more help?</h3>
            <p className="mt-2 text-white/40">Reach out to our team for anything else.</p>
            <MagneticButton className="mt-6 inline-block">
              <a
                href="#"
                className="inline-block rounded-full border border-white/10 px-8 py-3 text-sm font-semibold text-white hover:bg-white/5 transition-all"
              >
                Contact
              </a>
            </MagneticButton>
          </FadeUp>
        </div>
      </section>

      <Footer />
    </div>
  )
}
