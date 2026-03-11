import { Link } from 'react-router-dom'

const productLinks = [
  { label: 'Features', href: '/features' },
  { label: 'Personalities', href: '/personalities' },
  { label: 'Architecture', href: '/architecture' },
  { label: 'Blog', href: '/blog' },
  { label: 'Resources', href: '#' },
]

const companyLinks = [
  { label: 'About us', href: '#' },
  { label: 'Contact', href: '#' },
  { label: 'Support', href: '#' },
  { label: 'Careers', href: '#' },
  { label: 'Press', href: '#' },
]

const socialLinks = [
  { label: 'Facebook', href: '#' },
  { label: 'Instagram', href: '#' },
  { label: 'X', href: '#' },
  { label: 'LinkedIn', href: '#' },
  { label: 'YouTube', href: '#' },
]

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-surface">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand + Newsletter */}
          <div className="lg:col-span-2">
            <Link to="/" className="font-heading text-xl font-bold tracking-widest text-white">
              TRINITY
            </Link>
            <p className="mt-4 text-sm text-white/50 max-w-xs">
              Get the latest TRINITY updates and feature releases.
            </p>
            <form className="mt-4 flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-white/20 transition-colors"
              />
              <button
                type="submit"
                className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-white/90 transition-colors"
              >
                Subscribe
              </button>
            </form>
            <p className="mt-2 text-xs text-white/30">
              You agree to our Privacy Policy and consent to receive updates.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-heading text-sm font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-3">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-sm text-white/40 hover:text-white/70 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-heading text-sm font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-3">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-sm text-white/40 hover:text-white/70 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Follow Us */}
          <div>
            <h4 className="font-heading text-sm font-semibold text-white mb-4">Follow us</h4>
            <ul className="space-y-3">
              {socialLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-white/40 hover:text-white/70 transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-white/30">&copy; 2025 TRINITY. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="text-xs text-white/30 hover:text-white/50 transition-colors">Privacy Policy</a>
            <a href="#" className="text-xs text-white/30 hover:text-white/50 transition-colors">Terms of service</a>
            <a href="#" className="text-xs text-white/30 hover:text-white/50 transition-colors">Cookie settings</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
