/**
 * KnowledgeBase.jsx — Page "Base de connaissances" NORA
 * Auteur : Youssef (Frontend)
 *
 * Consomme :
 *   GET /api/categories → [{ id, name }]
 *   GET /api/qas?category_id=X → [{ id, question, response, category_id }]
 *
 * Affiche toutes les catégories dans une barre fluide réactive aux mouvements de souris,
 * les QAs en accordéon animé, des micro-animations ambiantes et un panneau latéral interactif NORA.
 *
 * Props :
 *   onBack         {Function} — retour à CategoryGrid / Accueil
 *   onOpenChat     {Function} — ouvre ChatInterface avec la catégorie active
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ChevronDown, ChevronLeft, ChevronRight, MessageCircle, BookOpen, Search, Sparkles } from 'lucide-react'
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

// ─── Item d'accordéon QA interactif ──────────────────────────────────────────
function AccordionItem({ qa, index, isOpen, onToggle, prefersReduced }) {
  return (
    <motion.div
      className={`bg-white/95 backdrop-blur-xs rounded-2xl border transition-all duration-300 overflow-hidden ${
        isOpen
          ? 'border-[#85181A]/30 shadow-[0_8px_30px_rgba(133,24,26,0.12)]'
          : 'border-[#E8DDD0] hover:border-[#85181A]/20 shadow-[0_4px_20px_rgba(61,39,29,0.06)] hover:shadow-[0_6px_24px_rgba(61,39,29,0.1)]'
      }`}
      initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={prefersReduced ? { duration: 0 } : { delay: 0.04 * index, duration: 0.35, ease: 'easeOut' }}
      whileHover={prefersReduced ? {} : { y: -2 }}
    >
      {/* Question cliquable */}
      <button
        id={`accordion-item-${qa.id}`}
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left
                   hover:bg-[#F8F5EE]/70 transition-colors duration-150
                   focus:outline-none focus:ring-2 focus:ring-[#85181A]/30 focus:ring-inset rounded-2xl group"
        aria-expanded={isOpen}
        aria-controls={`accordion-content-${qa.id}`}
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <motion.span
            className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold font-sans mt-0.5 transition-colors duration-200 ${
              isOpen
                ? 'bg-[#85181A] text-white shadow-xs'
                : 'bg-[#C85A32]/10 text-[#C85A32] group-hover:bg-[#85181A]/10 group-hover:text-[#85181A]'
            }`}
            animate={{ scale: isOpen ? 1.08 : 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            Q
          </motion.span>
          <span className={`font-sans text-sm font-medium leading-relaxed transition-colors duration-200 ${
            isOpen ? 'text-[#85181A] font-semibold' : 'text-[#3D271D] group-hover:text-[#1A1A1A]'
          }`}>
            {qa.question}
          </span>
        </div>
        <motion.div
          className={`flex-shrink-0 transition-colors duration-200 ${
            isOpen ? 'text-[#85181A]' : 'text-[#8B4A28]/50 group-hover:text-[#85181A]'
          }`}
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
        >
          <ChevronDown size={18} />
        </motion.div>
      </button>

      {/* Réponse animée */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={`accordion-content-${qa.id}`}
            role="region"
            aria-labelledby={`accordion-item-${qa.id}`}
            initial={prefersReduced ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={prefersReduced ? { duration: 0 } : { duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-5 pb-4 pt-1 border-t border-[#E8DDD0]/70 bg-gradient-to-b from-[#FAF7F2]/60 to-white/40">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-[#D96B43]/15 flex items-center justify-center
                                 text-[#D96B43] text-xs font-bold font-sans mt-0.5">
                  R
                </span>
                <p className="font-sans text-sm text-[#503225] leading-relaxed whitespace-pre-wrap">
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
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState(null)
  const [qas, setQas] = useState([])
  const [loadingCats, setLoadingCats] = useState(true)
  const [loadingQas, setLoadingQas] = useState(false)
  const [errorCats, setErrorCats] = useState(null)
  const [openAccordions, setOpenAccordions] = useState({})
  
  const tabsRef = useRef(null)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const scrollLeftStart = useRef(0)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const prefersReduced = usePrefersReducedMotion()

  // ── Mise à jour de la visibilité des défilements latéraux ─────────────────
  const updateScrollButtons = useCallback(() => {
    if (!tabsRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current
    setCanScrollLeft(scrollLeft > 10)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
  }, [])

  // ── Défilement fluide basé sur la position de la souris ───────────────────
  const handleMouseMoveNav = (e) => {
    if (!tabsRef.current) return
    
    // Mode Drag manuel si le bouton est enfoncé
    if (isDragging.current) {
      e.preventDefault()
      const x = e.pageX - tabsRef.current.offsetLeft
      const walk = (x - startX.current) * 1.6
      tabsRef.current.scrollLeft = scrollLeftStart.current - walk
      updateScrollButtons()
      return
    }

    if (prefersReduced) return

    // Suivi dynamique et fluide de la position de la souris
    const rect = tabsRef.current.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const width = rect.width
    const maxScroll = tabsRef.current.scrollWidth - tabsRef.current.clientWidth
    
    if (maxScroll <= 0) return

    // Zone d'influence avec marge pour un contrôle naturel
    const padding = 60
    const relativeX = Math.max(0, Math.min(width - padding * 2, mouseX - padding))
    const progress = relativeX / (width - padding * 2)

    // Calcul de la cible avec lissage
    const targetScroll = progress * maxScroll
    tabsRef.current.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    })
  }

  // ── Gestion du Drag / Glisser à la souris ─────────────────────────────────
  const handleMouseDownNav = (e) => {
    if (!tabsRef.current) return
    isDragging.current = true
    startX.current = e.pageX - tabsRef.current.offsetLeft
    scrollLeftStart.current = tabsRef.current.scrollLeft
  }

  const handleMouseUpNav = () => {
    isDragging.current = false
  }

  const scrollNavBy = (offset) => {
    if (!tabsRef.current) return
    tabsRef.current.scrollBy({ left: offset, behavior: 'smooth' })
  }

  // ── Chargement initial des catégories ─────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    setLoadingCats(true)
    getCategories()
      .then((data) => {
        if (!cancelled) {
          setCategories(data)
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
    setOpenAccordions({})
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

  useEffect(() => {
    const navEl = tabsRef.current
    if (navEl) {
      navEl.addEventListener('scroll', updateScrollButtons, { passive: true })
      updateScrollButtons()
      return () => navEl.removeEventListener('scroll', updateScrollButtons)
    }
  }, [categories, updateScrollButtons])

  // ── Gestion ouverture/fermeture d'un accordéon ────────────────────────────
  const toggleAccordion = useCallback((qaId) => {
    setOpenAccordions((prev) => ({ ...prev, [qaId]: !prev[qaId] }))
  }, [])

  // ── Changement de catégorie avec centrage fluide ──────────────────────────
  const handleCategoryClick = useCallback((cat) => {
    setActiveCategory(cat)
    const btn = document.getElementById(`kb-tab-${cat.id}`)
    if (btn && tabsRef.current) {
      btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }, [])

  const otherCategories = categories.filter((c) => c.id !== activeCategory?.id)

  return (
    <motion.div
      className="relative w-full h-full min-h-screen flex flex-col overflow-hidden select-none"
      style={{ backgroundColor: '#F8F5EE' }}
      initial={prefersReduced ? {} : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* ═══════════════════════════════════════════════════════════════════
          MICRO-ANIMATIONS D'ARRIÈRE-PLAN (ORBES AMBIANTES FLOTTANTES)
          ═══════════════════════════════════════════════════════════════════ */}
      {!prefersReduced && (
        <>
          <motion.div
            className="pointer-events-none absolute -top-28 -left-28 w-96 h-96 rounded-full bg-gradient-to-br from-[#85181A]/10 via-[#C85A32]/10 to-transparent blur-3xl"
            animate={{
              x: [0, 40, -20, 0],
              y: [0, -30, 25, 0],
              scale: [1, 1.15, 0.95, 1],
            }}
            transition={{
              duration: 16,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="pointer-events-none absolute bottom-12 right-24 w-80 h-80 rounded-full bg-gradient-to-tl from-[#C85A32]/12 via-[#E07A52]/8 to-transparent blur-3xl"
            animate={{
              x: [0, -35, 20, 0],
              y: [0, 30, -20, 0],
              scale: [1, 0.9, 1.1, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          EN-TÊTE SUPÉRIEUR
          ═══════════════════════════════════════════════════════════════════ */}
      <motion.header
        className="relative z-30 flex items-center justify-between px-3.5 sm:px-6 md:px-8 py-2.5 sm:py-3.5
                   bg-white/90 backdrop-blur-md border-b border-[#E8DDD0] shadow-xs"
        initial={prefersReduced ? {} : { y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Bouton retour */}
          <button
            id="kb-back-btn"
            onClick={onBack}
            className="group flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl
                       bg-[#F8F5EE] hover:bg-[#85181A] hover:text-white border border-[#E8DDD0]
                       text-[#1A1A1A] text-xs sm:text-sm font-sans font-medium
                       transition-all duration-200 shadow-2xs hover:shadow-xs active:scale-95
                       focus:outline-none focus:ring-2 focus:ring-[#85181A]/40"
            aria-label="Retour à l'accueil"
          >
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5 duration-200" />
            <span className="hidden sm:inline">Accueil</span>
          </button>

          {/* Badge titre */}
          <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-xl bg-[#85181A]/10 border border-[#85181A]/20">
            <BookOpen size={14} className="text-[#85181A]" />
            <span className="font-sans text-xs sm:text-sm font-semibold text-[#85181A] tracking-wide">
              Base de connaissances
            </span>
          </div>
        </div>

        {/* Logo ENCG */}
        <img
          src="/Logo ENCG couleur.png"
          alt="ENCG Marrakech"
          className="h-8 sm:h-10 md:h-11 w-auto object-contain select-none pointer-events-none"
          loading="eager"
        />
      </motion.header>

      {/* ═══════════════════════════════════════════════════════════════════
          NAVBAR CATÉGORIES (DYNAMIQUE : SUIT LA SOURIS + DRAGGABLE + INDICATEURS)
          ═══════════════════════════════════════════════════════════════════ */}
      {!loadingCats && !errorCats && categories.length > 0 && (
        <div className="relative z-20 w-full border-b border-[#E8DDD0]/80 bg-white/75 backdrop-blur-md">
          {/* Dégradé gauche & bouton flèche */}
          <AnimatePresence>
            {canScrollLeft && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute left-0 top-0 bottom-0 z-30 flex items-center pl-2 pr-6 bg-gradient-to-r from-white via-white/80 to-transparent pointer-events-none"
              >
                <button
                  onClick={() => scrollNavBy(-200)}
                  className="pointer-events-auto p-1.5 rounded-lg bg-white shadow-md border border-[#E8DDD0] text-[#85181A] hover:scale-110 active:scale-95 transition-transform"
                  aria-label="Défiler à gauche"
                >
                  <ChevronLeft size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Dégradé droit & bouton flèche */}
          <AnimatePresence>
            {canScrollRight && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute right-0 top-0 bottom-0 z-30 flex items-center pr-2 pl-6 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none"
              >
                <button
                  onClick={() => scrollNavBy(200)}
                  className="pointer-events-auto p-1.5 rounded-lg bg-white shadow-md border border-[#E8DDD0] text-[#85181A] hover:scale-110 active:scale-95 transition-transform"
                  aria-label="Défiler à droite"
                >
                  <ChevronRight size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Conteneur de navigation avec suivi souris */}
          <motion.nav
            ref={tabsRef}
            onMouseMove={handleMouseMoveNav}
            onMouseDown={handleMouseDownNav}
            onMouseUp={handleMouseUpNav}
            onMouseLeave={handleMouseUpNav}
            className="flex items-center gap-2.5 px-4 sm:px-6 md:px-8 py-2.5 sm:py-3
                       overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing select-none"
            role="tablist"
            aria-label="Catégories"
            initial={prefersReduced ? {} : { y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.35, ease: 'easeOut' }}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {categories.map((cat, i) => {
              const isActive = activeCategory?.id === cat.id
              return (
                <button
                  key={cat.id}
                  id={`kb-tab-${cat.id}`}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls="kb-qa-list"
                  onClick={() => handleCategoryClick(cat)}
                  className={`relative flex-shrink-0 px-4 py-2 rounded-xl text-sm font-sans font-medium
                              whitespace-nowrap transition-all duration-200
                              focus:outline-none focus:ring-2 focus:ring-[#85181A]/40
                              ${isActive
                                ? 'text-white font-semibold'
                                : 'text-[#505050] hover:text-[#1A1A1A] bg-[#F8F5EE]/90 hover:bg-[#85181A]/8 border border-[#E8DDD0]'
                              }`}
                >
                  {/* Pilule active avec morphing fluide Framer Motion */}
                  {isActive && (
                    <motion.div
                      layoutId="activeKbCategoryPill"
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#85181A] to-[#A02022] shadow-[0_4px_16px_rgba(133,24,26,0.3)] -z-10"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{cat.name}</span>
                </button>
              )
            })}
          </motion.nav>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          CORPS PRINCIPAL (QUESTIONS/RÉPONSES + SIDEBAR NORA)
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden relative z-10">

        {/* ── Zone contenu QA (gauche / principale) ──────────────────── */}
        <main
          id="kb-qa-list"
          role="tabpanel"
          className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-6"
        >
          {/* État : chargement catégories */}
          {loadingCats && (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <div className="spinner w-10 h-10" />
              <span className="text-sm font-sans text-[#6B4035] opacity-70">Chargement des thématiques…</span>
            </div>
          )}

          {/* État : erreur catégories */}
          {errorCats && (
            <div className="flex flex-col items-center gap-4 py-24 text-center">
              <div className="w-16 h-16 rounded-full bg-[#C85A32]/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-[#C85A32]" viewBox="0 0 24 24" fill="none">
                  <path d="M12 8v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <p className="font-sans text-[#3D271D] font-medium">Service temporairement indisponible</p>
              <p className="font-sans text-sm text-[#6B4035] opacity-70">{errorCats}</p>
              <button
                className="mt-2 px-6 py-2.5 rounded-xl bg-gradient-to-br from-[#E07A52] via-[#C85A32] to-[#9E3E1E]
                           text-white font-sans text-sm font-medium shadow-md hover:scale-105 active:scale-95 transition-all"
                onClick={() => window.location.reload()}
              >
                Réessayer
              </button>
            </div>
          )}

          {/* État : catégories chargées, affichage QAs */}
          {!loadingCats && !errorCats && activeCategory && (
            <>
              {/* Titre catégorie active + compteur animé */}
              <motion.div
                className="mb-6 flex items-start justify-between gap-4"
                key={activeCategory.id}
                initial={prefersReduced ? {} : { opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                <div>
                  <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-[#3D271D]">
                    {activeCategory.name}
                  </h1>
                  {!loadingQas && (
                    <p className="font-sans text-sm text-[#6B4035] opacity-75 mt-1 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#85181A]/40 inline-block" />
                      {qas.length} question{qas.length !== 1 ? 's' : ''} répertoriée{qas.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </motion.div>

              {/* Chargement QAs */}
              {loadingQas && (
                <div className="flex items-center justify-center py-16">
                  <div className="flex items-center gap-3 bg-white/80 px-5 py-3 rounded-2xl border border-[#E8DDD0] shadow-sm">
                    <div className="spinner w-5 h-5" />
                    <span className="font-sans text-sm text-[#6B4035] font-medium">Chargement des réponses…</span>
                  </div>
                </div>
              )}

              {/* État vide */}
              {!loadingQas && qas.length === 0 && (
                <motion.div
                  className="flex flex-col items-center gap-3 py-16 text-center bg-white/60 rounded-3xl border border-[#E8DDD0] p-8"
                  initial={prefersReduced ? {} : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="w-14 h-14 rounded-full bg-[#C85A32]/10 flex items-center justify-center">
                    <Search size={24} className="text-[#C85A32]/50" />
                  </div>
                  <p className="font-sans text-sm text-[#6B4035] opacity-75">
                    Aucune question dans cette catégorie pour le moment.
                  </p>
                </motion.div>
              )}

              {/* Liste d'accordéons animée */}
              {!loadingQas && qas.length > 0 && (
                <div className="flex flex-col gap-3.5">
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

        {/* ── Panneau latéral droit interactif NORA ──────────────────── */}
        <motion.aside
          className="hidden lg:flex flex-col items-center gap-5 py-6 px-5
                     bg-white/85 backdrop-blur-md border-l border-[#E8DDD0]
                     w-64 xl:w-72 flex-shrink-0 overflow-y-auto shadow-2xs"
          initial={prefersReduced ? {} : { x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.4, ease: 'easeOut' }}
        >
          {/* Avatar NORA avec animation de respiration et aura pulsante */}
          <div className="flex flex-col items-center gap-2">
            <motion.div
              className="relative w-24 h-24 xl:w-28 xl:h-28"
              animate={prefersReduced ? {} : { y: [0, -6, 0] }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#85181A]/15 via-[#C85A32]/20 to-transparent blur-md animate-pulse" />
              <Avatar3D interactive={true} className="w-full h-full relative z-10" />
            </motion.div>

            {/* Nom NORA */}
            <div className="flex flex-col items-center gap-1 text-center mt-1">
              <span className="font-display text-base font-semibold text-[#3D271D]">NORA</span>
              {/* Badge d'état interactif en ligne */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/60 shadow-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-[10px] font-sans font-medium text-emerald-700">En ligne & interactive</span>
              </div>
            </div>
          </div>

          {/* Bouton "Discuter avec l'assistant" avec effet de brillance / shimmer animé */}
          <button
            id="kb-open-chat-btn"
            onClick={() => onOpenChat?.(activeCategory)}
            className="relative overflow-hidden w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl
                       bg-gradient-to-br from-[#E07A52] via-[#C85A32] to-[#9E3E1E]
                       text-white font-sans text-sm font-semibold shadow-md
                       hover:shadow-[0_12px_36px_rgba(200,90,50,0.35)] hover:scale-[1.02]
                       active:scale-[0.98] transition-all duration-200 group
                       focus:outline-none focus:ring-2 focus:ring-[#C85A32]/50 focus:ring-offset-2"
          >
            {/* Lueur lumineuse balayante */}
            <motion.div
              className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-12 -z-0 pointer-events-none"
              animate={{ x: ['-200%', '300%'] }}
              transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut', repeatDelay: 1.5 }}
            />
            <MessageCircle size={17} className="relative z-10 transition-transform group-hover:rotate-12 duration-200" />
            <span className="relative z-10">Discuter avec l'assistant</span>
          </button>

          {/* Séparateur */}
          <div className="w-full h-px bg-[#E8DDD0]/80" />

          {/* Autres catégories */}
          {otherCategories.length > 0 && (
            <div className="w-full">
              <h3 className="font-sans text-[11px] font-semibold text-[#6B4035] uppercase tracking-widest mb-3 opacity-70 flex items-center gap-1.5">
                <Sparkles size={12} className="text-[#C85A32]" />
                Autres catégories
              </h3>
              <div className="flex flex-col gap-1.5">
                {otherCategories.map((cat) => (
                  <button
                    key={cat.id}
                    id={`kb-side-cat-${cat.id}`}
                    onClick={() => handleCategoryClick(cat)}
                    className="w-full text-left px-3 py-2.5 rounded-xl
                               bg-[#F8F5EE]/70 hover:bg-[#85181A]/10 border border-transparent
                               hover:border-[#85181A]/15 text-[#3D271D] hover:text-[#85181A] font-sans text-sm font-medium
                               transition-all duration-150 active:scale-98
                               focus:outline-none focus:ring-2 focus:ring-[#85181A]/30"
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
          <p className="font-sans text-[10px] text-[#6B4035] opacity-50 text-center">
            ENCG Marrakech · Université Cadi Ayyad
          </p>
        </motion.aside>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          BOUTON FLOTTANT "Discuter" (mobile uniquement)
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
