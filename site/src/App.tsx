import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import SmoothScroll from './components/SmoothScroll'
import CursorGlow from './components/CursorGlow'
import BarPreloader from './components/BarPreloader'
import Home from './pages/Home'

const glowColorZones = [
  { selector: '#s-hero', color: '#ffffff' },
  { selector: '#s-personalities', color: '#4A90D9' },
  { selector: '#s-interaction', color: '#27AE60' },
  { selector: '#s-audio', color: '#DA5194' },
  { selector: '#s-features', color: '#9B59B6' },
  { selector: '#s-stats', color: '#BBB39A' },
  { selector: '#s-testimonials', color: '#4A90D9' },
  { selector: '#s-cta', color: '#27AE60' },
]

function App() {
  const [loaded, setLoaded] = useState(false)

  return (
    <BrowserRouter>
      <BarPreloader
        duration={2500}
        barCount={20}
        color={[155, 89, 182]}
        background="#0a0a0a"
        barWidth={14}
        barHeight={52}
        barGap={5}
        sweepSpeed={1.8}
        onComplete={() => setLoaded(true)}
      />
      {loaded && (
        <SmoothScroll>
          <CursorGlow
            color="#ffffff"
            size={220}
            opacity={0.12}
            colorZones={glowColorZones}
          />
          <Routes>
            <Route path="/" element={<Home />} />
          </Routes>
        </SmoothScroll>
      )}
    </BrowserRouter>
  )
}

export default App
