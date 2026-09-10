/**
 * CategoryGrid.jsx — Écran 2 : Grille des catégories NORA
 * Auteur : Youssef (Frontend)
 *
 * Reproduction fidèle, ultra-moderne et professionnelle de la maquette ENCG Marrakech :
 * - Trame de micro-points dorés & motif organique en filigrane
 * - En-tête avec ENCG Marrakech, horloge temps réel et date complète
 * - Badge "Nora vous accueille" avec avatar et pastille verte
 * - Grand titre sérif : "Bonjour, comment puis-je vous aider aujourd'hui ?"
 * - Barre de recherche "Rechercher une information..."
 * - Grille de cartes épurées en ton crème chaleureux avec boîte d'icône blanche,
 *   titre en gras, compteur "X questions fréquentes" et bouton chevron animé au survol
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home,
  School,
  Layers,
  Compass,
  GitFork,
  Network,
  BarChart2,
  Briefcase,
  Globe,
  ShieldCheck,
  Sparkles,
  Search,
  ChevronRight,
  ArrowLeft,
  BookOpen,
  X,
  RefreshCw,
  HelpCircle
} from 'lucide-react'
import { getCategories } from '../api/chatApi'

// ─── Correspondance des icônes selon la maquette exacte ───────────────────────
function getCategoryIcon(cat) {
  const id = Number(cat.id)
  const name = (cat.name || '').toLowerCase()

  if (id === 1 || name.includes('encg marrakech')) {
    return <Home className="w-5 h-5 sm:w-6 sm:h-6 text-[#7C3822]" strokeWidth={1.8} />
  }
  if (id === 2 || name.includes('parcours') || name.includes('organisation')) {
    return <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-[#7C3822]" strokeWidth={1.8} />
  }
  if (id === 3 || name.includes('orientation')) {
    return <Compass className="w-5 h-5 sm:w-6 sm:h-6 text-[#7C3822]" strokeWidth={1.8} />
  }
  if (id === 4 || name.includes('filières') && !name.includes('comparaison')) {
    return <GitFork className="w-5 h-5 sm:w-6 sm:h-6 text-[#7C3822]" strokeWidth={1.8} />
  }
  if (id === 5 || name.includes('compétences')) {
    return <BarChart2 className="w-5 h-5 sm:w-6 sm:h-6 text-[#7C3822]" strokeWidth={1.8} />
  }
  if (id === 6 || name.includes('débouchés') || name.includes('professionnels')) {
    return <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-[#7C3822]" strokeWidth={1.8} />
  }
  if (id === 7 || name.includes('langue')) {
    return <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-[#7C3822]" strokeWidth={1.8} />
  }
  if (id === 8 || name.includes('admiss') || name.includes('accès')) {
    return <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-[#7C3822]" strokeWidth={1.8} />
  }
  if (id === 9 || name.includes('comparaison')) {
    return <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-[#7C3822]" strokeWidth={1.8} />
  }
  if (id === 10 || name.includes('intégrité')) {
    return <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-[#7C3822]" strokeWidth={1.8} />
  }

  return <School className="w-5 h-5 sm:w-6 sm:h-6 text-[#7C3822]" strokeWidth={1.8} />
}

// ─── Formatage de la date en français ─────────────────────────────────────────
function getFormattedDate(now) {
  const jours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  const mois = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ]
  const jourNom = jours[now.getDay()]
  const jourNum = now.getDate()
  const moisNom = mois[now.getMonth()]
  const annee = now.getFullYear()
  return `${jourNom} ${jourNum} ${moisNom} ${annee}`
}

function getFormattedTime(now) {
  const h = String(now.getHours()).padStart(2, '0')
  const m = String(now.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

// ─── Arrière-plan fidèle à la maquette ─────────────────────────────────────────
function KioskBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {/* Fond crème chaleureux */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: '#F8F3EA',
        }}
      />

      {/* Trame de grille de points subtils */}
      <div
        className="absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage: `radial-gradient(#8E4828 1.15px, transparent 1.15px)`,
          backgroundSize: '28px 28px',
        }}
      />

      {/* Forme organique décorative en haut à droite (comme sur la maquette) */}
      <svg
        className="absolute -top-12 -right-12 w-[340px] sm:w-[460px] h-[340px] sm:h-[460px] opacity-[0.45] pointer-events-none select-none"
        viewBox="0 0 400 400"
        fill="none"
      >
        <circle cx="280" cy="120" r="140" fill="#EADFCE" />
        <circle cx="220" cy="60" r="110" fill="#F1E7DA" opacity="0.8" />
        <path
          d="M 120 0 Q 220 180 380 160"
          stroke="#E4D5C2"
          strokeWidth="38"
          strokeLinecap="round"
          opacity="0.5"
        />
      </svg>
    </div>
  )
}

// ─── Carte de Catégorie fidèle à la maquette ──────────────────────────────────
function KioskCategoryCard({ category, index, onClick }) {
  const [isHovered, setIsHovered] = useState(false)
  const icon = getCategoryIcon(category)
  const count = category.qa_count != null ? category.qa_count : 4

  return (
    <motion.button
      id={`category-card-${category.id}`}
      onClick={() => onClick(category)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative text-left w-full rounded-[26px] p-6 sm:p-7
                 flex flex-col justify-between min-h-[170px] sm:min-h-[190px]
                 transition-all duration-300 ease-out focus:outline-none
                 border border-[#E4D6C4]/60"
      style={{
        backgroundColor: '#EFE4D4',
      }}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: Math.min(0.04 * index, 0.35),
        duration: 0.45,
        ease: [0.25, 0.8, 0.25, 1],
      }}
      whileHover={{
        y: -4,
        scale: 1.015,
        boxShadow: '0 16px 32px -10px rgba(110, 60, 30, 0.14)',
      }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Haut : Boîte blanche carrée arrondie avec l'icône */}
      <div className="flex items-start justify-between w-full">
        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center group-hover:shadow transition-all duration-200">
          {icon}
        </div>
      </div>

      {/* Bas : Titre et compteur de questions */}
      <div className="mt-5 sm:mt-6">
        <h3 className="font-sans font-bold text-base sm:text-lg text-[#2D1F17] leading-tight group-hover:text-[#7C3822] transition-colors">
          {category.name}
        </h3>
        <p className="font-sans text-xs sm:text-sm text-[#7C5C4F]/85 mt-1 font-normal">
          {count} questions fréquentes
        </p>
      </div>

      {/* Bouton rond avec flèche chevron en bas à droite (comme sur la carte 2 de la maquette) */}
      <motion.div
        className="absolute bottom-5 right-5 w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center text-[#7C3822] pointer-events-none"
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{
          opacity: isHovered ? 1 : 0,
          scale: isHovered ? 1 : 0.7,
          x: isHovered ? 0 : 4,
        }}
        transition={{ duration: 0.2 }}
      >
        <ChevronRight size={18} strokeWidth={2.2} />
      </motion.div>
    </motion.button>
  )
}

// ─── Composant Principal ──────────────────────────────────────────────────────
export default function CategoryGrid({ onSelectCategory, onBack, onOpenKnowledge }) {
  const [categories,   setCategories]   = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)
  const [searchQuery,  setSearchQuery]  = useState('')
  const [currentTime,  setCurrentTime]  = useState(new Date())

  // Horloge en temps réel
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000)
    return () => clearInterval(timer)
  }, [])

  // Chargement des catégories depuis l'API
  const fetchCategories = useCallback(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    getCategories()
      .then((data) => {
        if (!cancelled) {
          setCategories(data || [])
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Impossible de joindre le serveur.')
          setLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const cleanup = fetchCategories()
    return cleanup
  }, [fetchCategories])

  // Filtrage en direct par la barre de recherche
  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return categories

    return categories.filter((cat) => (cat.name || '').toLowerCase().includes(q))
  }, [categories, searchQuery])

  const handleSelect = useCallback((cat) => {
    onSelectCategory?.(cat)
  }, [onSelectCategory])

  return (
    <div className="relative w-full h-full min-h-screen flex flex-col overflow-x-hidden overflow-y-auto select-none">
      {/* Fond et motifs */}
      <KioskBackground />

      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 sm:px-10 py-8 flex flex-col flex-1">

        {/* ── 1. En-tête : ENCG Marrakech à gauche & Heure/Date à droite ── */}
        <header className="flex items-start justify-between gap-4 pb-6">
          {/* Logo / Titre Institutionnel */}
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-xl bg-white/70 hover:bg-white text-[#7C3822] transition-colors shadow-xs mr-1"
                title="Retour"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <img
              src="/logo1.png"
              alt="ENCG Marrakech — Université Cadi Ayyad"
              className="h-12 sm:h-14 w-auto object-contain drop-shadow-sm select-none"
              loading="eager"
            />
          </div>

          {/* Heure & Date en direct (typographie élégante comme sur la capture) */}
          <div className="text-right">
            <p className="font-serif font-bold text-2xl sm:text-3xl text-[#7C3822] leading-none">
              {getFormattedTime(currentTime)}
            </p>
            <p className="font-sans text-xs sm:text-sm text-[#8A3A1C]/75 mt-1 font-medium">
              {getFormattedDate(currentTime)}
            </p>
          </div>
        </header>

        {/* ── 2. Badge Nora vous accueille ────────────────────────────── */}
        <div className="pt-2 pb-3">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/95 border border-[#E4D6C4] shadow-xs">
            <div className="w-7 h-7 rounded-full overflow-hidden bg-[#FAF5EE] border border-[#E4D6C4] flex items-center justify-center flex-shrink-0">
              <img
                src="/nora_robot_clean.png"
                alt="Nora Robot"
                className="w-6 h-6 object-contain"
              />
            </div>
            <span className="font-sans text-xs sm:text-sm font-semibold text-[#7C3822]">
              Nora vous accueille
            </span>
            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
          </div>
        </div>

        {/* ── 3. Titre Principal Sérif & Sous-titre ─────────────────────── */}
        <div className="py-2">
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#2D1F17] leading-[1.18] max-w-2xl">
            Bonjour, comment puis-je <br />
            vous aider aujourd'hui ?
          </h2>
          <p className="font-sans text-sm sm:text-base text-[#6B4035] opacity-90 mt-3 font-normal max-w-xl">
            Choisissez une catégorie ou posez directement votre question à Nora.
          </p>
        </div>

        {/* ── 4. Barre de Recherche stylée ─────────────────────────────── */}
        <div className="pt-5 pb-6">
          <div className="relative w-full rounded-2xl bg-white border border-[#E2D6C7] shadow-[0_2px_8px_rgba(61,39,29,0.04)] focus-within:border-[#C85A32]/60 focus-within:ring-2 focus-within:ring-[#C85A32]/25 transition-all">
            <div className="flex items-center px-4 py-3 sm:py-3.5 gap-3">
              <Search size={18} className="text-[#8A3A1C]/60 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une information..."
                className="w-full bg-transparent border-none outline-none font-sans text-sm sm:text-base text-[#2D1F17] placeholder-[#7C5C4F]/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-1 rounded-full text-[#8A3A1C]/60 hover:text-[#8A3A1C] hover:bg-black/5 transition-colors"
                  title="Effacer"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Accès rapide Base de Connaissances (Optionnel / Discret) ─── */}
        {onOpenKnowledge && (
          <div className="flex items-center justify-between pb-3 text-xs text-[#7C5C4F]">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-[#7C3822]/80">
              Catégories principales ({filteredCategories.length})
            </span>
            <button
              onClick={onOpenKnowledge}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7C3822] hover:underline"
            >
              <BookOpen size={14} />
              <span>Parcourir toutes les informations</span>
            </button>
          </div>
        )}

        {/* ── 5. Grille des Catégories en 3 colonnes ───────────────────── */}
        <main className="flex-1 pb-10">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-[26px] p-7 min-h-[180px] bg-[#EFE4D4]/70 border border-[#E4D6C4]/60 animate-pulse flex flex-col justify-between"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white/80" />
                  <div className="space-y-2 mt-4">
                    <div className="h-5 bg-[#DFD3C2] rounded-md w-3/4" />
                    <div className="h-3.5 bg-[#DFD3C2]/60 rounded-md w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-white/80 rounded-[26px] border border-[#E4D6C4]">
              <HelpCircle size={36} className="text-[#C85A32] mb-3" />
              <p className="font-sans font-semibold text-base text-[#2D1F17]">
                Impossible de charger les catégories
              </p>
              <p className="font-sans text-xs sm:text-sm text-[#7C5C4F] opacity-80 mt-1 max-w-sm">
                {error}
              </p>
              <button
                onClick={fetchCategories}
                className="mt-4 inline-flex items-center gap-2 px-5 py-2 rounded-xl terracotta-gradient text-white text-xs font-semibold shadow-sm"
              >
                <RefreshCw size={14} />
                Réessayer
              </button>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-white/60 rounded-[26px] border border-[#E4D6C4]/60">
              <Search size={32} className="text-[#8A3A1C]/40 mb-2" />
              <p className="font-sans font-semibold text-sm text-[#2D1F17]">
                Aucune catégorie trouvée pour « {searchQuery} »
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-3 px-4 py-1.5 rounded-xl bg-[#7C3822]/10 text-[#7C3822] text-xs font-semibold hover:bg-[#7C3822]/20 transition-colors"
              >
                Réinitialiser la recherche
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {filteredCategories.map((cat, i) => (
                <KioskCategoryCard
                  key={cat.id}
                  category={cat}
                  index={i}
                  onClick={handleSelect}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
