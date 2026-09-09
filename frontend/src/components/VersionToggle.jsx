/**
 * VersionToggle.jsx — Bascule V1 (SQL) / V2 (IA Gemini)
 * Auteur : Youssef (Frontend)
 *
 * Props :
 *   version  {'v1'|'v2'}           — version active
 *   onChange {(v:'v1'|'v2')=>void} — callback changement
 *   disabled {boolean}             — désactivé pendant une requête
 */

import React from 'react'
import { motion } from 'framer-motion'

export default function VersionToggle({ version = 'v1', onChange, disabled = false }) {
  const isV2 = version === 'v2'

  return (
    <div
      id="version-toggle"
      className={`flex items-center gap-2 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      role="group"
      aria-label="Mode de réponse"
    >
      {/* Étiquette V1 */}
      <button
        id="toggle-v1"
        onClick={() => onChange?.('v1')}
        className={`text-xs font-sans font-semibold px-3 py-1 rounded-full transition-all duration-200
          ${!isV2
            ? 'bg-encg-terracotta text-white shadow-sm'
            : 'text-encg-text-brown-light hover:text-encg-text-brown'
          }`}
        aria-pressed={!isV2}
      >
        ⚡ Rapide
      </button>

      {/* Track du switch */}
      <button
        id="toggle-switch-track"
        onClick={() => onChange?.(isV2 ? 'v1' : 'v2')}
        className={`relative w-12 h-6 rounded-full transition-colors duration-300
          ${isV2 ? 'bg-encg-terracotta' : 'bg-encg-border'}`}
        role="switch"
        aria-checked={isV2}
        aria-label="Basculer entre mode rapide et IA"
      >
        <motion.div
          className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm"
          animate={{ x: isV2 ? 26 : 2 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        />
      </button>

      {/* Étiquette V2 */}
      <button
        id="toggle-v2"
        onClick={() => onChange?.('v2')}
        className={`text-xs font-sans font-semibold px-3 py-1 rounded-full transition-all duration-200
          ${isV2
            ? 'bg-encg-terracotta text-white shadow-sm'
            : 'text-encg-text-brown-light hover:text-encg-text-brown'
          }`}
        aria-pressed={isV2}
      >
        ✨ IA Gemini
      </button>
    </div>
  )
}
