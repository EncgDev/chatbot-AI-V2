/**
 * ChatInterface.jsx — Écran 3 : Interface de chat NORA (V2)
 * Auteur : Youssef (Frontend)
 *
 * Fonctionnement 100% automatisé :
 *   - Par défaut : IA Gemini V2 (avec mémoire contextuelle & RAG).
 *   - En cas d'indisponibilité IA : Bascule (fallback) automatique et transparente sur la BDD.
 *
 * Améliorations de style :
 *   - Parseur Markdown visuel riche (gras, listes à puces, numérotations, titres, citations)
 *   - Bouton de copie du texte avec retour visuel animé
 *   - Horodatage discret (timestamp)
 *   - Accordéon des sources RAG premium avec étiquettes interactives
 *   - Fiche contact modernisée avec actions directes
 *   - Indicateur de frappe avec halo lumineux
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Phone,
  MapPin,
  Mail,
  ExternalLink,
  Square,
  BookOpen,
  ChevronDown,
  Info,
  Copy,
  Check,
  Bot,
  Globe
} from 'lucide-react'
import { getQAs, sendChatV2, getSessionHistory, checkHealth } from '../api/chatApi'
import Sidebar from './Sidebar'

// ─── Nettoyage des artefacts d'encodage (Mojibake) ────────────────────────────
function sanitizeMojibake(str) {
  if (!str || typeof str !== 'string') return ''
  return str
    .replace(/dÃ©solÃ©e?/gi, 'désolée')
    .replace(/dÃ©sol/gi, 'désol')
    .replace(/trouvÃ©/gi, 'trouvé')
    .replace(/rÃ©ponse/gi, 'réponse')
    .replace(/donnÃ©es/gi, 'données')
    .replace(/TÃ©lÃ©phone/gi, 'Téléphone')
    .replace(/sÃ©lection/gi, 'sélection')
    .replace(/filiÃ¨re/gi, 'filière')
    .replace(/Ã /g, 'à')
    .replace(/Ã©/g, 'é')
    .replace(/Ã¨/g, 'è')
    .replace(/Ãª/g, 'ê')
    .replace(/Ã§/g, 'ç')
    .replace(/Ã´/g, 'ô')
    .replace(/Ã¹/g, 'ù')
    .replace(/Ã®/g, 'î')
    .replace(/Ã¯/g, 'ï')
    .replace(/Ã‰/g, 'É')
    .replace(/Ã€/g, 'À')
    .replace(/ðŸ["\s\w\d]{0,4}/g, '')
}

// ─── Détecteur de message 'Aucune réponse / Fallback' ─────────────────────────
function isUnansweredResponse(text) {
  if (!text) return true
  const lower = text.toLowerCase()
  return (
    lower.includes('pas trouver') ||
    lower.includes('pas trouvé') ||
    lower.includes('pas trouv') ||
    lower.includes('trouvã©') ||
    lower.includes('pas de réponse') ||
    lower.includes('pas de rã©ponse') ||
    lower.includes('désolé') ||
    lower.includes('dã©sol') ||
    lower.includes('base de données') ||
    lower.includes('base de donnã©es') ||
    lower.includes('aucun résultat') ||
    lower.includes('aucune information') ||
    lower.includes('05 24 30 46') ||
    lower.includes('encg@uca.ac.ma')
  )
}

// ─── Formateur Markdown enrichi pour les messages ────────────────────────────
function FormattedMessageContent({ content, isUser }) {
  if (!content || typeof content !== 'string') return null

  // Nettoyage préalable des artefacts d'encodage
  const cleanContent = sanitizeMojibake(content)

  // Découpage en blocs (paragraphes, listes, titres)
  const lines = cleanContent.split('\n')
  const elements = []
  let currentList = []
  let listType = null // 'ul' | 'ol'

  const flushList = () => {
    if (currentList.length > 0) {
      if (listType === 'ol') {
        elements.push(
          <ol key={`ol-${elements.length}`} className="my-2 space-y-1.5 pl-1">
            {currentList.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-sm leading-relaxed">
                <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  isUser ? 'bg-white/20 text-white' : 'bg-[#85181A]/10 text-[#85181A]'
                }`}>
                  {item.num || idx + 1}
                </span>
                <span className="flex-1 min-w-0">{renderInline(item.text, isUser)}</span>
              </li>
            ))}
          </ol>
        )
      } else {
        elements.push(
          <ul key={`ul-${elements.length}`} className="my-2 space-y-1.5 pl-1">
            {currentList.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-sm leading-relaxed">
                <span className={`inline-block w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${
                  isUser ? 'bg-white' : 'bg-[#85181A]'
                }`} />
                <span className="flex-1 min-w-0">{renderInline(item.text, isUser)}</span>
              </li>
            ))}
          </ul>
        )
      }
      currentList = []
      listType = null
    }
  }

  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim()

    // Ligne vide
    if (!trimmed) {
      flushList()
      return
    }

    // Titres Markdown (###, ##, #)
    if (trimmed.startsWith('### ')) {
      flushList()
      elements.push(
        <h4 key={`h4-${lineIdx}`} className={`font-display font-bold text-sm sm:text-base mt-2.5 mb-1 ${
          isUser ? 'text-white' : 'text-[#85181A]'
        }`}>
          {renderInline(trimmed.replace(/^###\s+/, ''), isUser)}
        </h4>
      )
      return
    }

    if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
      flushList()
      elements.push(
        <h3 key={`h3-${lineIdx}`} className={`font-display font-bold text-base sm:text-lg mt-3 mb-1.5 pb-1 border-b ${
          isUser ? 'text-white border-white/20' : 'text-[#85181A] border-[#85181A]/15'
        }`}>
          {renderInline(trimmed.replace(/^#+\s+/, ''), isUser)}
        </h3>
      )
      return
    }

    // Liste numérotée (ex: 1. ou 1-)
    const olMatch = trimmed.match(/^(\d+)[\.\)]\s+(.*)$/)
    if (olMatch) {
      if (listType !== 'ol') flushList()
      listType = 'ol'
      currentList.push({ num: olMatch[1], text: olMatch[2] })
      return
    }

    // Liste à puces (ex: - ou * ou •)
    const ulMatch = trimmed.match(/^[-*•]\s+(.*)$/)
    if (ulMatch) {
      if (listType !== 'ul') flushList()
      listType = 'ul'
      currentList.push({ text: ulMatch[1] })
      return
    }

    // Paragraphe classique
    flushList()
    elements.push(
      <p key={`p-${lineIdx}`} className="text-sm leading-relaxed my-1">
        {renderInline(line, isUser)}
      </p>
    )
  })

  flushList()

  return <div className="space-y-1">{elements}</div>
}

// ─── Formateur inline (Gras, italique, code, liens) ───────────────────────────
function renderInline(text, isUser) {
  if (!text) return ''

  // Regex pour découper les séquences **gras**, `code`, et URLs
  const parts = text.split(/(\*\*.*?\*\*|`.*?`|https?:\/\/[^\s]+)/g)

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldText = part.slice(2, -2)
      return (
        <strong key={i} className={`font-bold ${
          isUser ? 'text-white font-semibold' : 'text-[#85181A] font-bold'
        }`}>
          {boldText}
        </strong>
      )
    }

    if (part.startsWith('`') && part.endsWith('`')) {
      const codeText = part.slice(1, -1)
      return (
        <code key={i} className={`px-1.5 py-0.5 rounded text-xs font-mono ${
          isUser ? 'bg-white/20 text-white' : 'bg-[#FAF5EE] text-[#85181A] border border-[#E8DDD0]'
        }`}>
          {codeText}
        </code>
      )
    }

    if (part.match(/^https?:\/\//)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className={`underline underline-offset-2 hover:opacity-80 transition-opacity inline-flex items-center gap-0.5 ${
            isUser ? 'text-white font-medium' : 'text-[#85181A] font-medium'
          }`}
        >
          <span>{part.replace(/^https?:\/\/(www\.)?/, '')}</span>
          <ExternalLink size={11} className="inline opacity-70" />
        </a>
      )
    }

    return part
  })
}

// ─── Effet dactylographie / Machine à écrire (lettre par lettre) ──────────────
function TypewriterFormattedContent({ content, isUser, animate = false, onScroll }) {
  const [displayedLength, setDisplayedLength] = useState(() => (animate && !isUser ? 1 : content.length))
  const [isDone, setIsDone] = useState(() => !animate || isUser)

  useEffect(() => {
    if (!animate || isUser || isDone) {
      setDisplayedLength(content.length)
      setIsDone(true)
      return
    }

    if (displayedLength >= content.length) {
      setIsDone(true)
      return
    }

    // Vitesse dynamique d'écriture fluide caractère par caractère
    const chunk = content.length > 400 ? 3 : content.length > 150 ? 2 : 1
    const timer = setTimeout(() => {
      setDisplayedLength((prev) => {
        const next = Math.min(content.length, prev + chunk)
        if (next >= content.length) {
          setIsDone(true)
        }
        return next
      })
      if (onScroll) onScroll()
    }, 15)

    return () => clearTimeout(timer)
  }, [content, displayedLength, animate, isUser, isDone, onScroll])

  const visibleText = content.slice(0, displayedLength)

  return (
    <div className="relative">
      <FormattedMessageContent content={visibleText} isUser={isUser} />
      {!isDone && (
        <span className="inline-block w-1.5 h-3.5 bg-[#85181A] ml-0.5 animate-pulse align-middle rounded-xs" />
      )}
    </div>
  )
}

// ─── Bulle de message enrichie ───────────────────────────────────────────────
function MessageBubble({
  msg,
  isLastNora,
  isLoading,
  onRegenerate,
  onScroll
}) {
  const isUser = msg.role === 'user'
  const isSystemNotice = msg.isSystemNotice
  const [showSources, setShowSources] = useState(false)
  const [copied, setCopied] = useState(false)

  // Détection si c'est un message de non-réponse / contact
  const isContactCard =
    msg.showContactCard ||
    (!isUser && isUnansweredResponse(msg.content))

  // Texte propre à afficher (remplace le texte brut doublon en cas de contact card)
  const displayContent = isContactCard
    ? `Je n'ai pas trouvé de réponse exacte à votre question dans la base de données de l'ENCG.\n\nVous pouvez contacter directement les services de l'ENCG Marrakech :`
    : msg.content

  // Formatage de l'heure du message (timestamp)
  const timeString = msg.timestamp
    ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  // Action copier le texte
  const handleCopy = () => {
    if (!displayContent) return
    navigator.clipboard?.writeText(displayContent).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // Message système discret (ex: "Requête annulée.")
  if (isSystemNotice) {
    return (
      <motion.div
        className="flex justify-center my-1.5"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
      >
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAF5EE] border border-[#E8DDD0] text-xs font-sans text-[#707070] shadow-2xs">
          <Info size={13} className="text-[#85181A]/70" />
          <span>{msg.content}</span>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} group`}
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {/* Avatar bulle NORA */}
      {!isUser && (
        <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-[#FAF5EE] to-[#EFE7D8] border border-[#E4D6C4] flex items-center justify-center flex-shrink-0 shadow-xs mt-1 ring-2 ring-[#85181A]/10">
          <img
            src="/nora_robot_clean.png"
            alt="Nora"
            className="w-6 h-6 object-contain"
          />
          <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-[#10B981] ring-1 ring-white" />
        </div>
      )}

      <div className={`max-w-[88%] sm:max-w-[78%] flex flex-col gap-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
        {/* En-tête de bulle avec rôle et heure */}
        <div className={`flex items-center gap-2 px-1 text-[11px] font-sans ${isUser ? 'flex-row-reverse text-[#85181A]/70' : 'text-[#6B4035]/70'}`}>
          <span className="font-semibold">{isUser ? 'Vous' : 'NORA'}</span>
          <span className="text-[10px] opacity-60">{timeString}</span>
        </div>

        {/* Bulle de contenu principal */}
        <div
          className={`relative px-4 py-3 rounded-2xl text-sm font-sans leading-relaxed transition-all duration-200 ${
            isUser
              ? 'bg-gradient-to-br from-[#85181A] via-[#781416] to-[#600E10] text-white rounded-br-sm shadow-md'
              : 'bg-white border border-[#E8DDD0] text-[#2D1F17] rounded-bl-sm shadow-card hover:shadow-card-hover'
          }`}
        >
          {/* Contenu avec effet dactylographie lettre par lettre */}
          <TypewriterFormattedContent
            content={displayContent}
            isUser={isUser}
            animate={msg.isNew}
            onScroll={onScroll}
          />

          {/* ── Accordéon des Sources RAG ─────────────────────────── */}
          {msg.sources && Array.isArray(msg.sources) && msg.sources.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-[#E8DDD0]/80">
              <button
                onClick={() => setShowSources((prev) => !prev)}
                className="flex items-center justify-between w-full text-xs font-sans font-semibold text-[#85181A] hover:text-[#A02022] transition-colors py-1 px-2 rounded-lg bg-[#FAF5EE] border border-[#E8DDD0]/70 focus:outline-none"
                aria-expanded={showSources}
              >
                <div className="flex items-center gap-1.5">
                  <BookOpen size={13} className="text-[#85181A]" />
                  <span>Sources de référence ({msg.sources.length})</span>
                </div>
                <motion.div
                  animate={{ rotate: showSources ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown size={14} />
                </motion.div>
              </button>

              <AnimatePresence>
                {showSources && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="mt-2 space-y-1.5 overflow-hidden"
                  >
                    {msg.sources.map((src, idx) => (
                      <div
                        key={src.id || idx}
                        className="text-[11px] font-sans text-[#503225] bg-[#FAF7F2] border border-[#E8DDD0] px-3 py-2 rounded-xl flex items-start gap-2 shadow-2xs"
                      >
                        <span className="w-4 h-4 rounded-full bg-[#85181A]/10 text-[#85181A] flex items-center justify-center font-bold text-[9px] flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="leading-snug">{src.question || (typeof src === 'string' ? src : 'Document institutionnel')}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Carte interactive des coordonnées ENCG */}
          {isContactCard && (
            <div className="mt-3 pt-3 border-t border-[#E8DDD0] flex flex-col gap-2.5 bg-gradient-to-br from-[#FAF7F2] to-[#F5ECE0] p-3.5 rounded-xl border border-[#E8DDD0]/80">
              <span className="font-sans font-bold text-xs text-[#85181A] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={13} />
                Contact & Administration ENCG Marrakech
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                {/* Téléphone */}
                <a
                  href="tel:0524304692"
                  className="flex items-center gap-2 text-xs font-sans text-[#1A1A1A] hover:text-[#85181A] transition-colors p-2 rounded-lg bg-white/80 border border-[#E8DDD0] hover:bg-white hover:shadow-2xs"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#85181A]/10 text-[#85181A] flex items-center justify-center flex-shrink-0">
                    <Phone size={13} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] text-[#707070]">Téléphone</span>
                    <span className="font-semibold truncate">05 24 30 46 92</span>
                  </div>
                </a>

                {/* Email */}
                <a
                  href="mailto:encg@uca.ac.ma"
                  className="flex items-center gap-2 text-xs font-sans text-[#1A1A1A] hover:text-[#85181A] transition-colors p-2 rounded-lg bg-white/80 border border-[#E8DDD0] hover:bg-white hover:shadow-2xs"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#85181A]/10 text-[#85181A] flex items-center justify-center flex-shrink-0">
                    <Mail size={13} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] text-[#707070]">Email officiel</span>
                    <span className="font-semibold truncate">encg@uca.ac.ma</span>
                  </div>
                </a>

                {/* Site Web */}
                <a
                  href="https://www.uca.ma/encg/fr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs font-sans text-[#1A1A1A] hover:text-[#85181A] transition-colors p-2 rounded-lg bg-white/80 border border-[#E8DDD0] hover:bg-white hover:shadow-2xs"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#85181A]/10 text-[#85181A] flex items-center justify-center flex-shrink-0">
                    <Globe size={13} />
                  </div>
                  <div className="flex items-center justify-between flex-1 min-w-0">
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] text-[#707070]">Site web</span>
                      <span className="font-semibold truncate">uca.ma/encg/fr</span>
                    </div>
                    <ExternalLink size={12} className="flex-shrink-0 opacity-60 ml-1 text-[#85181A]" />
                  </div>
                </a>

                {/* Adresse */}
                <a
                  href="https://www.google.com/search?q=national+school+of+commerce+and+management+of+marrakech+address"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs font-sans text-[#1A1A1A] hover:text-[#85181A] transition-colors p-2 rounded-lg bg-white/80 border border-[#E8DDD0] hover:bg-white hover:shadow-2xs"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#85181A]/10 text-[#85181A] flex items-center justify-center flex-shrink-0">
                    <MapPin size={13} />
                  </div>
                  <div className="flex items-center justify-between flex-1 min-w-0">
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] text-[#707070]">Campus</span>
                      <span className="font-semibold truncate">Bd Allal Al Fassi</span>
                    </div>
                    <ExternalLink size={12} className="flex-shrink-0 opacity-60 ml-1 text-[#85181A]" />
                  </div>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* ── Actions sous la bulle : Copier, Badge fallback & Régénérer ── */}
        {!isUser && (
          <div className="flex items-center gap-2 px-1">
            {/* Bouton Copier le texte */}
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-[#FAF5EE] text-[11px] font-sans text-[#707070] hover:text-[#85181A] transition-colors border border-transparent hover:border-[#E8DDD0]"
              title="Copier le message"
              aria-label="Copier le message"
            >
              {copied ? (
                <>
                  <Check size={12} className="text-[#10B981]" />
                  <span className="text-[#10B981] font-medium">Copié !</span>
                </>
              ) : (
                <>
                  <Copy size={12} />
                  <span>Copier</span>
                </>
              )}
            </button>

            {/* Badge Mode économisé (fallback discret) */}
            {msg.isFallback && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FAF5EE] border border-[#E8DDD0] text-[10px] font-sans text-[#707070]">
                Mode économisé
              </span>
            )}

            {/* Bouton Régénérer la réponse (dernière bulle NORA) */}
            {isLastNora && !isLoading && onRegenerate && (
              <button
                onClick={onRegenerate}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-[#FAF5EE] text-[11px] font-sans text-[#707070] hover:text-[#85181A] transition-colors border border-transparent hover:border-[#E8DDD0]"
                title="Régénérer cette réponse"
              >
                <RotateCcw size={12} />
                <span>Régénérer</span>
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── Indicateur d'attente NORA ───────────────────────────────────────────────
function TypingIndicator() {
  return (
    <motion.div
      className="flex gap-3 items-end"
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <div className="relative w-8 h-8 rounded-full overflow-hidden bg-[#FAF5EE] border border-[#E4D6C4] flex items-center justify-center flex-shrink-0 shadow-xs mb-0.5 ring-2 ring-[#85181A]/20">
        <img
          src="/nora_robot_clean.png"
          alt="Nora"
          className="w-6 h-6 object-contain"
        />
      </div>

      <div className="bg-white border border-[#E8DDD0] rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-card flex items-center gap-3 min-h-[40px]">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-2 h-2 rounded-full bg-[#85181A]"
              animate={{
                y: [0, -5, 0],
                opacity: [0.4, 1, 0.4],
                scale: [0.85, 1.15, 0.85],
              }}
              transition={{
                duration: 0.7,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
        <span className="text-xs font-sans text-[#85181A] font-medium">NORA rédige sa réponse…</span>
      </div>
    </motion.div>
  )
}

// ─── Composant principal ───────────────────────────────────────────────────────
export default function ChatInterface({ category, onBack }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [isOnline, setIsOnline] = useState(true)

  // Persistance de sessionId via sessionStorage
  const [sessionId, setSessionId] = useState(() => {
    try {
      return sessionStorage.getItem('nora_session_id') || null
    } catch {
      return null
    }
  })

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const abortControllerRef = useRef(null)

  // ── Scroll automatique vers le bas ────────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(scrollToBottom, [messages, isLoading, scrollToBottom])

  // ── Vérification santé backend ────────────────────────────────────────────
  useEffect(() => {
    checkHealth().then(setIsOnline)
  }, [])

  // ── Chargement de l'historique de session existante ou message d'accueil ───
  useEffect(() => {
    let cancelled = false

    const initChat = async () => {
      // Si un sessionId existe, on tente de recharger l'historique
      if (sessionId) {
        try {
          const history = await getSessionHistory(sessionId)
          if (!cancelled && Array.isArray(history) && history.length > 0) {
            const restored = history.map((item, idx) => ({
              id: item.id || `hist-${idx}`,
              role: item.role,
              content: item.content,
              version: item.version,
              sources: item.sources || [],
              timestamp: item.created_at || Date.now(),
            }))
            setMessages(restored)
            return
          }
        } catch {
          // Erreur ignorée, on affichera le message par défaut
        }
      }

      // Message d'accueil initial
      if (!cancelled) {
        const welcome = {
          id: 'welcome',
          role: 'nora',
          timestamp: Date.now(),
          content: category
            ? `Bonjour ! Je suis NORA, votre assistante ENCG 😊\nJe suis prête à répondre à vos questions sur **${category.name}**.\n\nSélectionnez une question ci-dessous ou écrivez directement votre message !`
            : 'Bonjour ! Je suis NORA, votre assistante ENCG 😊\nComment puis-je vous aider ?\n\nSélectionnez une question ci-dessous ou écrivez directement votre message !',
        }
        setMessages([welcome])
      }
    }

    initChat()

    // Charger les questions de suggestions
    if (category?.id) {
      getQAs(category.id)
        .then((qas) => {
          if (!cancelled) setSuggestions(qas.map((qa) => qa.question).filter(Boolean))
        })
        .catch(() => {
          if (!cancelled) setSuggestions([])
        })
    } else {
      getQAs()
        .then((qas) => {
          if (!cancelled) setSuggestions(qas.map((qa) => qa.question).filter(Boolean))
        })
        .catch(() => {
          if (!cancelled) setSuggestions([])
        })
    }

    return () => {
      cancelled = true
    }
  }, [category, sessionId])

  // ── Annuler la requête en cours ───────────────────────────────────────────
  const handleCancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsLoading(false)
    setMessages((prev) => [
      ...prev,
      {
        id: `abort-${Date.now()}`,
        role: 'nora',
        content: 'Requête annulée.',
        isSystemNotice: true,
      },
    ])
  }, [])

  // ── Envoi d'un message (Mode IA automatique avec fallback BDD) ────────────
  const sendMessage = useCallback(
    async (text, replaceLastNora = false) => {
      const trimmed = text.trim()
      if (!trimmed || isLoading) return

      // Si ce n'est pas une régénération, on ajoute la bulle utilisateur
      if (!replaceLastNora) {
        const userMsg = {
          id: `user-${Date.now()}`,
          role: 'user',
          content: trimmed,
          timestamp: Date.now(),
        }
        setMessages((prev) => [...prev, userMsg])
        setInput('')
      } else {
        // En cas de régénération, on retire la dernière bulle NORA
        setMessages((prev) => {
          const lastIdx = [...prev].reverse().findIndex((m) => m.role === 'nora' && !m.isSystemNotice)
          if (lastIdx !== -1) {
            const realIdx = prev.length - 1 - lastIdx
            return prev.filter((_, i) => i !== realIdx)
          }
          return prev
        })
      }

      setIsLoading(true)

      // Initialiser AbortController
      const controller = new AbortController()
      abortControllerRef.current = controller

      try {
        // Envoi toujours via sendChatV2 (IA Gemini + Fallback BDD automatique côté serveur)
        const res = await sendChatV2(trimmed, sessionId, controller.signal)

        // Sauvegarde du session_id s'il est retourné
        if (res.sessionId && res.sessionId !== sessionId) {
          setSessionId(res.sessionId)
          try {
            sessionStorage.setItem('nora_session_id', res.sessionId)
          } catch {
            // Ignorer si sessionStorage non disponible
          }
        }

        const replyText = res.reply?.trim() || ''
        const isUnanswered = isUnansweredResponse(replyText)

        const noraMsg = {
          id: `nora-${Date.now()}`,
          role: 'nora',
          timestamp: Date.now(),
          content: isUnanswered
            ? `Je n'ai pas trouvé de réponse exacte à votre question dans la base de données de l'ENCG.\n\nVous pouvez contacter directement les services de l'ENCG Marrakech :`
            : replyText,
          source: res.source,
          version: res.version,
          isFallback: isUnanswered || res.isFallback,
          fallbackReason: res.fallbackReason,
          sources: res.sources || [],
          showContactCard: isUnanswered,
          isNew: true,
        }

        setMessages((prev) => [...prev, noraMsg])
      } catch (err) {
        if (err.isAbort || err.name === 'AbortError' || err.name === 'CanceledError') {
          // Annulation déjà gérée par handleCancelRequest
          return
        }

        const errMsg = {
          id: `err-${Date.now()}`,
          role: 'nora',
          timestamp: Date.now(),
          content: `⚠️ Une erreur s'est produite lors du traitement de votre demande.\n\nVous pouvez joindre directement l'administration de l'ENCG Marrakech :`,
          showContactCard: true,
          isNew: true,
        }
        setMessages((prev) => [...prev, errMsg])
        setIsOnline(false)
      } finally {
        setIsLoading(false)
        abortControllerRef.current = null
      }
    },
    [isLoading, sessionId]
  )

  // ── Régénérer la dernière réponse NORA ─────────────────────────────────────
  const handleRegenerate = useCallback(() => {
    if (isLoading) return
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')
    if (lastUserMessage) {
      sendMessage(lastUserMessage.content, true)
    }
  }, [messages, isLoading, sendMessage])

  const handleSubmit = (e) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleSuggestion = (q) => sendMessage(q)

  // ── Réinitialiser la session et les messages ──────────────────────────────
  const handleReset = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setSessionId(null)
    try {
      sessionStorage.removeItem('nora_session_id')
    } catch {
      // Ignorer
    }

    setMessages([])
    setSuggestions([])
    const welcome = {
      id: `welcome-${Date.now()}`,
      role: 'nora',
      content: 'Conversation réinitialisée. Comment puis-je vous aider ?',
    }
    setMessages([welcome])

    if (category?.id) {
      getQAs(category.id)
        .then((qas) => {
          setSuggestions(qas.map((qa) => qa.question).filter(Boolean))
        })
        .catch(() => {})
    } else {
      getQAs()
        .then((qas) => {
          setSuggestions(qas.map((qa) => qa.question).filter(Boolean))
        })
        .catch(() => {})
    }
  }

  // ── Filtrage des suggestions ──────────────────────────────────────────────
  const normalizedInput = input.trim().toLowerCase()
  const filteredSuggestions = suggestions.filter(
    (q) => normalizedInput === '' || q.toLowerCase().includes(normalizedInput)
  )

  // Identifier le dernier message NORA pour le bouton de régénération
  const lastNoraMsgId = [...messages].reverse().find((m) => m.role === 'nora' && !m.isSystemNotice)?.id

  return (
    <motion.div
      className="relative w-full h-full min-h-screen flex overflow-hidden bg-encg-cream-light"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* ── Sidebar ───────────────────────────────────────────────── */}
      <Sidebar
        category={category}
        isOnline={isOnline}
        onBack={onBack}
      />

      {/* ── Zone principale ───────────────────────────────────────── */}
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* ── Header chat épuré (100% IA automatique avec fallback) ── */}
        <header className="flex items-center justify-between px-3.5 sm:px-6 py-2.5 sm:py-3.5
                           border-b border-[#E8DDD0] bg-white/95 backdrop-blur-md z-20 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              id="chat-back-btn"
              onClick={onBack}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center
                         bg-[#FAF7F2] hover:bg-[#85181A]/10 text-[#85181A] border border-[#E8DDD0] transition-colors flex-shrink-0"
              aria-label="Retour"
              title="Retour aux catégories"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="min-w-0">
              <h2 className="font-display font-bold text-[#1A1A1A] text-sm sm:text-base md:text-lg leading-tight truncate">
                {category?.name ?? 'NORA — ENCG Marrakech'}
              </h2>
              <p className="font-sans text-[11px] sm:text-xs text-[#85181A] font-medium flex items-center gap-1.5 mt-0.5">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isOnline ? 'bg-[#10B981] animate-pulse' : 'bg-[#EF4444]'}`} />
                <span>{isOnline ? 'Nora est en ligne' : 'Hors ligne'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            {/* Réinitialiser la conversation */}
            <button
              id="chat-reset-btn"
              onClick={handleReset}
              className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl flex items-center gap-1.5
                         bg-[#FAF7F2] hover:bg-[#85181A]/10 text-[#505050] hover:text-[#85181A]
                         border border-[#E8DDD0] text-[11px] sm:text-xs font-semibold transition-all"
              title="Nouvelle conversation"
              aria-label="Réinitialiser"
            >
              <RotateCcw size={13} />
              <span className="hidden sm:inline">Effacer</span>
            </button>

            {/* Logo officiel ENCG */}
            <img
              src="/Logo ENCG couleur.png"
              alt="ENCG Marrakech"
              className="h-8 sm:h-10 w-auto object-contain select-none pointer-events-none"
              loading="eager"
            />
          </div>
        </header>

        {/* ── Suggestions en haut ───────────────────────────────────── */}
        <AnimatePresence>
          {filteredSuggestions.length > 0 && !isLoading && (
            <motion.div
              className="px-3.5 sm:px-6 py-3 bg-white/80 border-b border-[#E8DDD0] backdrop-blur-md flex flex-col gap-2 z-10 flex-shrink-0 shadow-xs"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              <div className="flex items-center justify-between px-0.5">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-lg bg-[#85181A]/10 text-[#85181A] flex items-center justify-center">
                    <Sparkles size={13} />
                  </div>
                  <span className="font-sans text-xs sm:text-sm font-bold uppercase tracking-wider text-[#85181A]">
                    {normalizedInput
                      ? `Questions correspondantes (${filteredSuggestions.length})`
                      : `Questions fréquentes (${filteredSuggestions.length})`}
                  </span>
                </div>
                <span className="text-[11px] text-[#505050] font-sans hidden sm:inline opacity-75">
                  Touchez une question pour l'envoyer
                </span>
              </div>
              <div className="flex flex-wrap gap-2 max-h-36 sm:max-h-44 overflow-y-auto pr-1 pb-1 scrollbar-thin">
                {filteredSuggestions.map((q, i) => (
                  <button
                    key={i}
                    id={`suggestion-${i}`}
                    onClick={() => handleSuggestion(q)}
                    className="text-left px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-white border border-[#E8DDD0]
                               text-[#1A1A1A] text-xs sm:text-sm font-sans font-medium
                               hover:border-[#85181A] hover:bg-[#85181A] hover:text-white
                               transition-all duration-150 shadow-2xs hover:shadow-xs active:scale-97 leading-relaxed"
                    title={q}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Messages de la conversation ───────────────────────────── */}
        <div
          id="chat-messages"
          className="flex-1 overflow-y-auto px-3.5 sm:px-6 py-4 sm:py-5 flex flex-col gap-3.5 sm:gap-4"
        >
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              isLastNora={msg.id === lastNoraMsgId}
              isLoading={isLoading}
              onRegenerate={handleRegenerate}
              onScroll={scrollToBottom}
            />
          ))}

          {/* Indicateur de frappe NORA */}
          <AnimatePresence>
            {isLoading && <TypingIndicator key="typing" />}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>

        {/* ── Barre de saisie avec bouton Annuler ────────────────────── */}
        <div className="px-3.5 sm:px-6 pb-4 sm:pb-6 pt-2 sm:pt-3 border-t border-[#E8DDD0] bg-white/95 backdrop-blur-md flex-shrink-0">
          <form
            id="chat-input-form"
            onSubmit={handleSubmit}
            className="flex items-end gap-2 sm:gap-3"
          >
            <textarea
              ref={inputRef}
              id="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage(input)
                }
              }}
              placeholder="Posez votre question à NORA…"
              rows={1}
              disabled={isLoading}
              className="flex-1 resize-none rounded-xl border border-[#E8DDD0] bg-[#FAF7F2]
                         px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-sans text-[#3D271D] placeholder:text-[#6B4035]/50
                         focus:outline-none focus:ring-2 focus:ring-[#85181A]/30 focus:border-[#85181A]/50
                         disabled:opacity-60 disabled:cursor-not-allowed
                         transition-colors duration-150 max-h-28 sm:max-h-32 overflow-auto"
              style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
              aria-label="Message à NORA"
            />

            {/* Bouton Annuler (visible uniquement pendant le chargement) */}
            {isLoading ? (
              <button
                type="button"
                id="chat-cancel-btn"
                onClick={handleCancelRequest}
                className="h-10 sm:h-11 px-3 sm:px-4 rounded-xl bg-[#FAF5EE] hover:bg-[#85181A]/10 border border-[#E8DDD0] text-[#85181A] flex items-center justify-center gap-1.5 text-xs font-sans font-semibold transition-all active:scale-95 shadow-xs flex-shrink-0"
                title="Annuler la requête"
                aria-label="Annuler la génération"
              >
                <Square size={13} className="fill-current" />
                <span className="hidden sm:inline">Annuler</span>
              </button>
            ) : (
              <button
                id="chat-send-btn"
                type="submit"
                disabled={!input.trim()}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-[#85181A] to-[#661012] flex items-center justify-center
                           text-white shadow-md disabled:opacity-40 disabled:cursor-not-allowed
                           hover:shadow-card-hover transition-all duration-150 flex-shrink-0 active:scale-95"
                aria-label="Envoyer"
              >
                <Send size={16} />
              </button>
            )}
          </form>

          {/* Note informative discrète */}
          <p className="mt-1.5 sm:mt-2 text-center text-[9px] sm:text-[10px] font-sans text-[#505050] opacity-60">
            NORA · Assistante d'orientation et d'information interactive — ENCG Marrakech
          </p>
        </div>
      </div>
    </motion.div>
  )
}
