/**
 * CategoryGrid.jsx — Écran 2 : Grille des catégories NORA
 * Auteur : Youssef (Frontend)
 *
 * Consomme : GET /api/categories → [{ id, name, qa_count }]
 * Navigation : clic sur une carte → Écran 3 (ChatInterface) filtré sur category_id
 */

import React, { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getCategories } from '../api/chatApi'
import Avatar3D from './Avatar3D'

// ─── Icônes par catégorie (SVG inline légers) ────────────────────────────────
const CATEGORY_ICONS = {
  1: ( // Formations
    <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
      <path d="M12 3L2 8l10 5 10-5-10-5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M2 8v6m20-6v6M7 10.5v4.5c0 1.657 2.239 3 5 3s5-1.343 5-3V10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  2: ( // Horaires
    <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
      <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  3: ( // Admissions
    <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
      <path d="M9 12l2 2 4-4m5 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  4: ( // Vie estudiantine
    <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  5: ( // Contact & Accès
    <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.85 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  6: ( // À propos de l'ENCG
    <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
      <path d="M12 8h.01M12 12v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
}

// ─── Carte catégorie ──────────────────────────────────────────────────────────
function CategoryCard({ category, index, onClick }) {
  const icon = CATEGORY_ICONS[category.id] || CATEGORY_ICONS[6]

  return (
    <motion.button
      id={`category-card-${category.id}`}
      className="group glass-card rounded-xl3 p-6 flex flex-col items-center gap-4 text-center
                 hover:shadow-card-hover hover:border-encg-terracotta/40 transition-colors duration-200
                 focus:outline-none focus:ring-2 focus:ring-encg-terracotta/50"
      onClick={() => onClick(category)}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 * index, duration: 0.5, ease: 'easeOut' }}
      whileHover={{ scale: 1.04, y: -4 }}
      whileTap={{ scale: 0.97 }}
    >
      {/* Icône */}
      <div className="w-14 h-14 rounded-xl2 terracotta-gradient flex items-center justify-center
                      text-encg-cream-light shadow-md group-hover:shadow-lg transition-shadow">
        {icon}
      </div>

      {/* Nom */}
      <p className="font-sans font-600 text-encg-text-brown text-sm leading-snug">
        {category.name}
      </p>

      {/* Compteur QAs */}
      {category.qa_count != null && (
        <span className="text-xs text-encg-text-brown-light opacity-60">
          {category.qa_count} question{category.qa_count > 1 ? 's' : ''}
        </span>
      )}
    </motion.button>
  )
}

// ─── Composant principal ───────────────────────────────────────────────────────
/**
 * @param {Object}   props
 * @param {Function} props.onSelectCategory — appelé avec l'objet catégorie sélectionné
 * @param {Function} props.onBack           — retour à WelcomeScreen (optionnel)
 */
export default function CategoryGrid({ onSelectCategory, onBack }) {
  const [categories, setCategories] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getCategories()
      .then((data) => {
        if (!cancelled) {
          setCategories(data)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Impossible de charger les catégories.')
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [])

  const handleSelect = useCallback((cat) => {
    onSelectCategory?.(cat)
  }, [onSelectCategory])

  return (
    <motion.div
      className="nora-background relative w-full h-full min-h-screen flex flex-col overflow-auto"
      initial={{ opacity: 0, scale: 1.04 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="relative z-10 flex items-center gap-4 px-6 pt-10 pb-6">
        {/* Avatar mini */}
        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-encg-terracotta/30 shadow-card">
          <Avatar3D scale={0.9} cameraZ={3.2} className="w-14 h-14" />
        </div>

        <div className="flex-1">
          <h1 className="font-display text-xl font-semibold text-encg-text-brown">
            Bonjour, je suis NORA 👋
          </h1>
          <p className="font-sans text-sm text-encg-text-brown-light opacity-75 mt-0.5">
            Comment puis-je vous aider aujourd'hui ?
          </p>
        </div>
      </header>

      {/* ── Corps ──────────────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 px-6 pb-10">
        {/* Titre section */}
        <motion.h2
          className="font-sans text-xs font-semibold text-encg-text-brown-light tracking-widest uppercase mb-5 opacity-60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.2 }}
        >
          Choisissez une thématique
        </motion.h2>

        {/* États de chargement / erreur / grille */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="spinner w-10 h-10" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-encg-terracotta/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-encg-terracotta" viewBox="0 0 24 24" fill="none">
                <path d="M12 8v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="font-sans text-encg-text-brown font-medium">Service temporairement indisponible</p>
            <p className="font-sans text-sm text-encg-text-brown-light opacity-70">{error}</p>
            <button
              className="mt-2 px-6 py-2.5 rounded-xl terracotta-gradient text-white font-sans text-sm font-medium shadow-md"
              onClick={() => window.location.reload()}
            >
              Réessayer
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {categories.map((cat, i) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                index={i}
                onClick={handleSelect}
              />
            ))}
          </div>
        )}
      </main>
    </motion.div>
  )
}
