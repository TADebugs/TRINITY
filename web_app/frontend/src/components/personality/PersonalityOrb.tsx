import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { usePersonalityStore } from '@/store/usePersonalityStore'
import { motion } from 'framer-motion'

function Orb() {
  const meshRef = useRef<THREE.Mesh>(null)
  const lightRef = useRef<THREE.PointLight>(null)
  const config = usePersonalityStore((s) => s.config)
  const active = usePersonalityStore((s) => s.active)

  const color = useMemo(() => new THREE.Color(config.color), [config.color])
  const targetColor = useRef(color.clone())

  useFrame((_, delta) => {
    if (!meshRef.current) return
    const mesh = meshRef.current

    // Smooth color lerp
    targetColor.current.set(config.color)
    const mat = mesh.material as THREE.MeshStandardMaterial
    mat.color.lerp(targetColor.current, delta * 4)
    mat.emissive.lerp(targetColor.current, delta * 4)

    if (lightRef.current) {
      lightRef.current.color.lerp(targetColor.current, delta * 4)
    }

    const t = performance.now() / 1000

    // Per-personality animation
    switch (active) {
      case 'ARIA': {
        // Steady pulse
        const scale = 1 + Math.sin(t * 2) * 0.05
        mesh.scale.setScalar(scale)
        mesh.rotation.y += delta * 0.3
        break
      }
      case 'ECHO': {
        // Flowing waves
        const scale = 1 + Math.sin(t * 1.5) * 0.08 + Math.sin(t * 3) * 0.03
        mesh.scale.set(scale, scale * (1 + Math.sin(t * 2) * 0.04), scale)
        mesh.rotation.y += delta * 0.5
        mesh.rotation.x = Math.sin(t * 0.8) * 0.1
        break
      }
      case 'NEXUS': {
        // Sharp, digital feel
        const scale = 1 + Math.sin(t * 4) * 0.03
        mesh.scale.setScalar(scale)
        mesh.rotation.y += delta * 0.8
        mesh.rotation.z += delta * 0.2
        break
      }
    }
  })

  return (
    <>
      <ambientLight intensity={0.15} />
      <pointLight ref={lightRef} position={[2, 3, 4]} intensity={2} color={config.color} />
      <pointLight position={[-3, -2, -2]} intensity={0.5} color="#ffffff" />
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.2, 4]} />
        <meshStandardMaterial
          color={config.color}
          emissive={config.color}
          emissiveIntensity={0.3}
          roughness={0.3}
          metalness={0.7}
          wireframe={active === 'NEXUS'}
        />
      </mesh>
    </>
  )
}

export function PersonalityOrb() {
  return (
    <motion.div
      className="absolute inset-0 opacity-40 pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.4 }}
      transition={{ duration: 1 }}
    >
      <Canvas camera={{ position: [0, 0, 3.5], fov: 50 }}>
        <Orb />
      </Canvas>
    </motion.div>
  )
}
