import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const navLinks = [
  { label: 'Features', href: '/features' },
  { label: 'Personalities', href: '/personalities' },
  { label: 'Architecture', href: '/architecture' },
  { label: 'Blog', href: '/blog' },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-black/70 backdrop-blur-2xl border-b border-white/5'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="font-heading text-xl font-bold tracking-[0.3em] text-white hover:opacity-80 transition-opacity">
            TRINITY
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link, i) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
              >
                <Link
                  to={link.href}
                  className={`relative text-sm font-medium transition-colors hover:text-white group ${
                    location.pathname === link.href ? 'text-white' : 'text-white/40'
                  }`}
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-white transition-all duration-300 group-hover:w-full" />
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="hidden md:block"
          >
            <Link
              to="/"
              className="group relative overflow-hidden rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.15)]"
            >
              <span className="relative z-10">Get Early Access</span>
            </Link>
          </motion.div>

          <button
            className="md:hidden p-2 text-white/70 hover:text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden overflow-hidden border-t border-white/5 bg-black/95 backdrop-blur-2xl"
          >
            <div className="px-6 py-6 space-y-4">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    to={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block text-lg font-medium text-white/60 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <Link
                to="/"
                className="block mt-4 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black text-center"
              >
                Get Early Access
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
