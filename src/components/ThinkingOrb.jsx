import { useState, useEffect } from 'react'
import './ThinkingOrb.css'

const DEFAULT_PHASES = [
  'Resolving TBox axioms & domain blueprint…',
  'Federating Cypher (Neo4j) & SPARQL (Ontop)…',
  'Evaluating deterministic preconditions…',
]

/**
 * Custom Fluid AI Thinking Orb
 * Features organic fluid morphing, internal swirling plasma, breathing aura,
 * orbiting satellite particle, and dynamic phase text.
 */
export default function ThinkingOrb({
  label = 'Orchestrating Neuro-Symbolic Pipeline…',
  phases = DEFAULT_PHASES,
  size = 96,
  theme = 'blue',
}) {
  const [phaseIdx, setPhaseIdx] = useState(0)

  useEffect(() => {
    if (!phases || phases.length <= 1) return
    const timer = setInterval(() => {
      setPhaseIdx((prev) => (prev + 1) % phases.length)
    }, 1600)
    return () => clearInterval(timer)
  }, [phases])

  const scale = size / 96

  return (
    <div className={`custom-orb-wrapper theme-${theme}`}>
      {/* Orb Animation Stage */}
      <div
        className="custom-orb-stage"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        {/* 1. Ambient Breathing Halo */}
        <div className="orb-ambient-aura" />

        {/* 2. 3D Tilted Orbital Track & Glowing Particle */}
        <div className="orb-orbital-track">
          <div className="orb-orbital-particle" />
        </div>

        {/* 3. Fluid Morphing Organic Core */}
        <div className="orb-fluid-core">
          {/* Swirling Liquid Plasma Waves */}
          <div className="orb-plasma-wave" />
          <div className="orb-plasma-wave-2" />

          {/* 3D Glass Specular Sheen */}
          <div className="orb-specular-sheen" />
        </div>
      </div>

      {/* Dynamic Status Text */}
      <div className="orb-status-container">
        <div className="orb-title-row">
          <span className="orb-pulse-dot" />
          <span className="orb-status-title">{label}</span>
        </div>
        {phases && phases.length > 0 && (
          <div key={phaseIdx} className="orb-status-subtitle">
            {phases[phaseIdx]}
          </div>
        )}
      </div>
    </div>
  )
}

export { ThinkingOrb }
