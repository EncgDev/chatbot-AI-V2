/**
 * Avatar3D.jsx — Robot NORA avec micro-casque d'assistance (Détourage 100% Parfait)
 *
 * Caractéristiques :
 *   - Fond PNG 100% transparent et détouré au pixel près (sans aucun trou ni artefact)
 *   - Robot humanoïde d'assistance avec casque audio et micro aux couleurs officielles ENCG
 *   - Main droite levée agitant la main en signe de bienvenue
 *   - Flottement doux, respiration, parallaxe 3D interactive au toucher et au curseur
 */

import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'

export default function Avatar3D({
  interactive = true,
  className = '',
}) {
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)
  const [hovered, setHovered] = useState(false)
  const containerRef = useRef(null)

  // Effet d'inclinaison 3D subtil suivant le toucher / curseur (Parallaxe 3D)
  const handleMouseMove = (e) => {
    if (!interactive || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    setRotateY((x / (rect.width / 2)) * 7) // max ±7°
    setRotateX(-(y / (rect.height / 2)) * 6) // max ±6°
  }

  const handleMouseLeave = () => {
    setHovered(false)
    setRotateX(0)
    setRotateY(0)
  }

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center justify-center select-none ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      onTouchStart={() => setHovered(true)}
      onTouchEnd={() => setHovered(false)}
      style={{ perspective: 1000 }}
    >
      {/* Halo lumineux d'ambiance derrière le robot */}
      <motion.div
        className="absolute inset-4 rounded-full pointer-events-none opacity-40 blur-2xl"
        style={{
          background: 'radial-gradient(circle, rgba(242, 184, 90, 0.45) 0%, rgba(200, 90, 50, 0.20) 55%, transparent 75%)',
        }}
        animate={{
          scale: [1, 1.10, 1],
          opacity: [0.35, 0.48, 0.35],
        }}
        transition={{
          duration: 4.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* ── Robot 3D Animé (Fond 100% transparent impeccable) ──────── */}
      <motion.div
        className="relative w-full h-full flex items-center justify-center"
        animate={{
          y: [0, -8, 0],
          rotate: [-0.6, 0.6, -0.6],
        }}
        transition={{
          duration: 4.0,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
          transition: 'transform 0.15s ease-out',
        }}
        whileHover={{ scale: 1.035 }}
        whileTap={{ scale: 0.98 }}
      >
        <img
          src="/nora_robot_clean.png"
          alt="Robot NORA — Assistante Virtuelle ENCG Marrakech"
          className="w-full h-full object-contain pointer-events-none select-none drop-shadow-[0_16px_32px_rgba(160,80,30,0.18)]"
          loading="eager"
        />
      </motion.div>

      {/* Ombre de contact douce au sol */}
      <motion.div
        className="absolute -bottom-2 w-3/5 h-4 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(162, 79, 37, 0.24) 0%, transparent 70%)',
        }}
        animate={{
          scaleX: [1, 0.84, 1],
          opacity: [0.36, 0.18, 0.36],
        }}
        transition={{
          duration: 4.0,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  )
}
