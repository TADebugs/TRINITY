import { motion } from 'framer-motion'

interface Props {
  text: string
  className?: string
  delay?: number
}

export function SplitText({ text, className = '', delay = 0 }: Props) {
  const words = text.split(' ')

  return (
    <motion.span className={className}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden">
          <motion.span
            className="inline-block"
            initial={{ y: '100%', opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{
              duration: 0.6,
              ease: [0.33, 1, 0.68, 1],
              delay: delay + i * 0.04,
            }}
          >
            {word}
          </motion.span>
          {i < words.length - 1 && '\u00A0'}
        </span>
      ))}
    </motion.span>
  )
}

export function FadeUp({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease: [0.33, 1, 0.68, 1], delay }}
    >
      {children}
    </motion.div>
  )
}

export function ScaleIn({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1], delay }}
    >
      {children}
    </motion.div>
  )
}

export function SlideIn({
  children,
  direction = 'left',
  delay = 0,
  className = '',
}: {
  children: React.ReactNode
  direction?: 'left' | 'right'
  delay?: number
  className?: string
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x: direction === 'left' ? -60 : 60 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease: [0.33, 1, 0.68, 1], delay }}
    >
      {children}
    </motion.div>
  )
}

export function StaggerContainer({
  children,
  className = '',
  staggerDelay = 0.1,
}: {
  children: React.ReactNode
  className?: string
  staggerDelay?: number
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: staggerDelay } },
      }}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 30 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.6, ease: [0.33, 1, 0.68, 1] },
        },
      }}
    >
      {children}
    </motion.div>
  )
}
