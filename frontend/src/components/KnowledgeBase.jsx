/**
 * KnowledgeBase.jsx — Page "Base de connaissances" NORA
 * Auteur : Youssef (Frontend)
 *
 * Consomme :
 *   GET /api/categories → [{ id, name }]
 *   GET /api/qas?category_id=X → [{ id, question, response, category_id }]
 *
 * Affiche toutes les catégories dans une barre scrollable,
 * les QAs en accordéon avec Framer Motion, et un panneau latéral NORA.
 *
 * Props :
 *   onBack         {Function} — retour à CategoryGrid
 *   onOpenChat     {Function} — ouvre ChatInterface avec la catégorie active
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ChevronDown, MessageCircle, BookOpen, Search } from 'lucide-react'
import { getCategories, getQAs } from '../api/chatApi'
import Avatar3D from './Avatar3D'

// ─── Utilitaire : détection prefers-reduced-motion ─────────────────────────
function usePrefersReducedMotion() {
  const [prefersReduced, setPrefersReduced] = useState(false)
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReduced(mql.matches)
    const handler = (e) => setPrefersReduced(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])
  return prefersReduced
}

// ─── Item d'accordéon QA ──────────────────────────────────────────────────────
function AccordionItem({ qa, index, isOpen, onToggle, prefersReduced }) {
  return (
    <motion.div
      className="bg-white rounded-2xl border border-[#E8DDD0] shadow-[0_4px_24px_rgba(61,39,29,0.08)] overflow-hidden"
      initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={prefersReduced ? { duration: 0 } : { delay: 0.04 * index, duration: 0.4, ease: 'easeOut' }}
    >
      {/* Question (toujours visible) */}
      <button
        id={`accordion-item-${qa.id}`}
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left
                   hover:bg-[#F8F5EE]/60 transition-colors duration-150
                   focus:outline-none focus:ring-2 focus:ring-[#C85A32]/40 focus:ring-inset rounded-2xl"
        aria-expanded={isOpen}
        aria-controls={`accordion-content-${qa.id}`}
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-[#C85A32]/10 flex items-center justify-center
                           text-[#C85A32] text-xs font-bold font-sans mt-0.5">
            Q
          </span>
          <span className="font-sans text-sm font-medium text-[#3D271D] leading-relaxed">
            {qa.question}
          </span>
        </div>
        <motion.div
          className="flex-shrink-0 text-[#8B4A28]/60"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
        >
          <ChevronDown size={18} />
        </motion.div>
      </button>

      {/* Réponse (repliée par défaut, transition fluide) */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={`accordion-content-${qa.id}`}
            role="region"
            aria-labelledby={`accordion-item-${qa.id}`}
            initial={prefersReduced ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={prefersReduced ? { height: 0, opacity: 0 } : { height: 0, opacity: 0 }}
            transition={prefersReduced ? { duration: 0 } : { duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-5 pb-4 pt-1 border-t border-[#E8DDD0]/60">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-[#D96B43]/15 flex items-center justify-center
                                 text-[#D96B43] text-xs font-bold font-sans mt-0.5">
                  R
                </span>
                <p className="font-sans text-sm text-[#6B4035] leading-relaxed whitespace-pre-wrap">
                  {qa.response}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Composant principal ───────────────────────────────────────────────────────
export default function KnowledgeBase({ onBack, onOpenChat }) {
  const [categories, setCategories]     = useState([])
  const [activeCategory, setActiveCategory] = useState(null)
  const [qas, setQas]                   = useState([])
  const [loadingCats, setLoadingCats]   = useState(true)
  const [loadingQas, setLoadingQas]     = useState(false)
  const [errorCats, setErrorCats]       = useState(null)
  const [openAccordions, setOpenAccordions] = useState({})
  const tabsRef = useRef(null)
  const prefersReduced = usePrefersReducedMotion()

  // ── Chargement initial des catégories ─────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    setLoadingCats(true)
    getCategories()
      .then((data) => {
        if (!cancelled) {
          setCategories(data)
          // Sélectionner la première catégorie par défaut
          if (data.length > 0) {
            setActiveCategory(data[0])
          }
          setLoadingCats(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setErrorCats(err.message || 'Impossible de charger les catégories.')
          setLoadingCats(false)
        }
      })
    return () => { cancelled = true }
  }, [])

  // ── Chargement des QAs quand la catégorie active change ───────────────────
  useEffect(() => {
    if (!activeCategory) return
    let cancelled = false
    setLoadingQas(true)
    setOpenAccordions({}) // Refermer tous les accordéons
    getQAs(activeCategory.id)
      .then((data) => {
        if (!cancelled) {
          setQas(data)
          setLoadingQas(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setQas([])
          setLoadingQas(false)
        }
      })
    return () => { cancelled = true }
  }, [activeCategory])

  // ── Gestion ouverture/fermeture d'un accordéon ────────────────────────────
  const toggleAccordion = useCallback((qaId) => {
    setOpenAccordions((prev) => ({ ...prev, [qaId]: !prev[qaId] }))
  }, [])

  // ── Changement de catégorie ───────────────────────────────────────────────
  const handleCategoryClick = useCallback((cat) => {
    setActiveCategory(cat)
  }, [])

  // ── Autres catégories (panneau latéral) ───────────────────────────────────
  const otherCategories = categories.filter((c) => c.id !== activeCategory?.id)

  // ── Cascade animation params ──────────────────────────────────────────────
  const cascadeDelay = prefersReduced ? 0 : 0.06

  return (
    <motion.div
      className="relative w-full h-full min-h-screen flex flex-col overflow-hidden"
      style={{ backgroundColor: '#F8F5EE' }}
      initial={prefersReduced ? {} : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* ═══════════════════════════════════════════════════════════════════
          EN-TÊTE
          ═══════════════════════════════════════════════════════════════════ */}
      <motion.header
        className="relative z-20 flex items-center justify-between px-5 md:px-8 py-4
                   bg-white/90 backdrop-blur-sm border-b border-[#E8DDD0]"
        initial={prefersReduced ? {} : { y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <div className="flex items-center gap-3">
          {/* Bouton retour */}
          <button
            id="kb-back-btn"
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl
                       bg-[#F8F5EE] hover:bg-[#C85A32]/10 border border-[#E8DDD0]
                       text-[#3D271D] text-sm font-sans font-medium
                       transition-colors duration-150
                       focus:outline-none focus:ring-2 focus:ring-[#C85A32]/40"
            aria-label="Retour à l'accueil"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Accueil</span>
          </button>

          {/* Badge titre */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#C85A32]/10 border border-[#C85A32]/20">
            <BookOpen size={15} className="text-[#C85A32]" />
            <span className="font-sans text-xs sm:text-sm font-semibold text-[#C85A32] tracking-wide">
              Base de connaissances
            </span>
          </div>
        </div>

        {/* Logo ENCG */}
        <img
          src="/logo1.png"
          alt="ENCG Marrakech"
          className="h-9 md:h-11 w-auto object-contain select-none pointer-events-none"
          loading="eager"
        />
      </motion.header>

      {/* ═══════════════════════════════════════════════════════════════════
          BARRE DE CATÉGORIES (scrollable horizontalement)
          ═══════════════════════════════════════════════════════════════════ */}
      {!loadingCats && !errorCats && categories.length > 0 && (
        <motion.nav
          ref={tabsRef}
          className="relative z-10 flex items-center gap-2 px-5 md:px-8 py-3
                     overflow-x-auto scrollbar-hide border-b border-[#E8DDD0]/60
                     bg-white/60 backdrop-blur-xs"
          role="tablist"
          aria-label="Catégories"
          initial={prefersReduced ? {} : { y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.35, ease: 'easeOut' }}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {categories.map((cat, i) => {
            const isActive = activeCategory?.id === cat.id
            return (
              <motion.button
                key={cat.id}
                id={`kb-tab-${cat.id}`}
                role="tab"
                aria-selected={isActive}
                aria-controls="kb-qa-list"
                onClick={() => handleCategoryClick(cat)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-sans font-medium
                            whitespace-nowrap transition-all duration-200
                            focus:outline-none focus:ring-2 focus:ring-[#C85A32]/40
                            ${isActive
                              ? 'bg-[#C85A32] text-white shadow-md'
                              : 'bg-[#F8F5EE] text-[#6B4035] hover:bg-[#C85A32]/10 hover:text-[#3D271D] border border-[#E8DDD0]'
                            }`}
                initial={prefersReduced ? {} : { opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: cascadeDelay * i, duration: 0.3 }}
                whileHover={prefersReduced ? {} : { scale: 1.04 }}
                whileTap={prefersReduced ? {} : { scale: 0.96 }}
              >
                {cat.name}
              </motion.button>
            )
          })}
        </motion.nav>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          CORPS PRINCIPAL (contenu + panneau latéral)
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Zone contenu QA (gauche / principale) ──────────────────── */}
        <main
          id="kb-qa-list"
          role="tabpanel"
          className="flex-1 overflow-y-auto px-5 md:px-8 py-6"
        >
          {/* État : chargement catégories */}
          {loadingCats && (
            <div className="flex items-center justify-center py-24">
              <div className="spinner w-10 h-10" />
            </div>
          )}

          {/* État : erreur catégories */}
          {errorCats && (
            <div className="flex flex-col items-center gap-4 py-24 text-center">
              <div className="w-16 h-16 rounded-full bg-[#C85A32]/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-[#C85A32]" viewBox="0 0 24 24" fill="none">
                  <path d="M12 8v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <p className="font-sans text-[#3D271D] font-medium">Service temporairement indisponible</p>
              <p className="font-sans text-sm text-[#6B4035] opacity-70">{errorCats}</p>
              <button
                className="mt-2 px-6 py-2.5 rounded-xl bg-gradient-to-br from-[#E07A52] via-[#C85A32] to-[#9E3E1E]
                           text-white font-sans text-sm font-medium shadow-md"
                onClick={() => window.location.reload()}
              >
                Réessayer
              </button>
            </div>
          )}

          {/* État : catégories chargées, affichage QAs */}
          {!loadingCats && !errorCats && activeCategory && (
            <>
              {/* Titre catégorie active + compteur */}
              <motion.div
                className="mb-5"
                key={activeCategory.id}
                initial={prefersReduced ? {} : { opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <h1 className="font-display text-xl md:text-2xl font-bold text-[#3D271D]">
                  {activeCategory.name}
                </h1>
                {!loadingQas && (
                  <p className="font-sans text-sm text-[#6B4035] opacity-70 mt-1">
                    {qas.length} question{qas.length !== 1 ? 's' : ''} disponible{qas.length !== 1 ? 's' : ''}
                  </p>
                )}
              </motion.div>

              {/* Chargement QAs */}
              {loadingQas && (
                <div className="flex items-center justify-center py-16">
                  <div className="flex items-center gap-3">
                    <div className="spinner w-6 h-6" />
                    <span className="font-sans text-sm text-[#6B4035] opacity-60">Chargement…</span>
                  </div>
                </div>
              )}

              {/* État vide */}
              {!loadingQas && qas.length === 0 && (
                <motion.div
                  className="flex flex-col items-center gap-3 py-16 text-center"
                  initial={prefersReduced ? {} : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="w-14 h-14 rounded-full bg-[#C85A32]/10 flex items-center justify-center">
                    <Search size={24} className="text-[#C85A32]/50" />
                  </div>
                  <p className="font-sans text-sm text-[#6B4035] opacity-60">
                    Aucune question dans cette catégorie pour le moment.
                  </p>
                </motion.div>
              )}

              {/* Liste d'accordéons */}
              {!loadingQas && qas.length > 0 && (
                <div className="flex flex-col gap-3">
                  {qas.map((qa, i) => (
                    <AccordionItem
                      key={qa.id}
                      qa={qa}
                      index={i}
                      isOpen={!!openAccordions[qa.id]}
                      onToggle={() => toggleAccordion(qa.id)}
                      prefersReduced={prefersReduced}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </main>

        {/* ── Panneau latéral droit ──────────────────────────────────── */}
        <motion.aside
          className="hidden lg:flex flex-col items-center gap-5 py-6 px-5
                     bg-white/80 backdrop-blur-sm border-l border-[#E8DDD0]
                     w-64 xl:w-72 flex-shrink-0 overflow-y-auto"
          initial={prefersReduced ? {} : { x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.4, ease: 'easeOut' }}
        >
          {/* Avatar NORA */}
          <div className="w-24 h-24 xl:w-28 xl:h-28">
            <Avatar3D interactive={true} className="w-full h-full" />
          </div>

          {/* Nom NORA */}
          <div className="flex flex-col items-center gap-0.5 text-center">
            <span className="font-display text-base font-semibold text-[#3D271D]">NORA</span>
            <span className="font-sans text-[10px] text-[#6B4035] opacity-60 uppercase tracking-wider">
              Assistante IA · ENCG
            </span>
          </div>

          {/* Bouton "Discuter avec l'assistant" */}
          <button
            id="kb-open-chat-btn"
            onClick={() => onOpenChat?.(activeCategory)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                       bg-gradient-to-br from-[#E07A52] via-[#C85A32] to-[#9E3E1E]
                       text-white font-sans text-sm font-medium shadow-md
                       hover:shadow-[0_12px_40px_rgba(200,90,50,0.20)] hover:scale-[1.02]
                       active:scale-[0.98] transition-all duration-200
                       focus:outline-none focus:ring-2 focus:ring-[#C85A32]/50 focus:ring-offset-2"
          >
            <MessageCircle size={16} />
            Discuter avec l'assistant
          </button>

          {/* Séparateur */}
          <div className="w-full h-px bg-[#E8DDD0]/80" />

          {/* Autres catégories */}
          {otherCategories.length > 0 && (
            <div className="w-full">
              <h3 className="font-sans text-[11px] font-semibold text-[#6B4035] uppercase tracking-widest mb-3 opacity-60">
                Autres catégories
              </h3>
              <div className="flex flex-col gap-1.5">
                {otherCategories.map((cat) => (
                  <button
                    key={cat.id}
                    id={`kb-side-cat-${cat.id}`}
                    onClick={() => handleCategoryClick(cat)}
                    className="w-full text-left px-3 py-2.5 rounded-xl
                               bg-[#F8F5EE]/60 hover:bg-[#C85A32]/8 border border-transparent
                               hover:border-[#C85A32]/15 text-[#3D271D] font-sans text-sm
                               transition-all duration-150
                               focus:outline-none focus:ring-2 focus:ring-[#C85A32]/30"
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Espaceur */}
          <div className="flex-1" />

          {/* Footer discret */}
          <p className="font-sans text-[10px] text-[#6B4035] opacity-40 text-center">
            ENCG Marrakech · Université Cadi Ayyad
          </p>
        </motion.aside>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          BOUTON FLOTTANT "Discuter" (mobile uniquement, car sidebar cachée)
          ═══════════════════════════════════════════════════════════════════ */}
      <motion.button
        id="kb-mobile-chat-btn"
        onClick={() => onOpenChat?.(activeCategory)}
        className="lg:hidden fixed bottom-6 right-6 z-30 flex items-center gap-2
                   px-5 py-3.5 rounded-2xl
                   bg-gradient-to-br from-[#E07A52] via-[#C85A32] to-[#9E3E1E]
                   text-white font-sans text-sm font-medium
                   shadow-[0_8px_32px_rgba(200,90,50,0.35)]
                   hover:shadow-[0_12px_40px_rgba(200,90,50,0.45)] hover:scale-105
                   active:scale-95 transition-all duration-200
                   focus:outline-none focus:ring-2 focus:ring-white/50"
        initial={prefersReduced ? {} : { y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4, ease: 'easeOut' }}
        whileHover={prefersReduced ? {} : { scale: 1.05 }}
        whileTap={prefersReduced ? {} : { scale: 0.95 }}
      >
        <MessageCircle size={18} />
        <span>Discuter</span>
      </motion.button>
    </motion.div>
  )
}
