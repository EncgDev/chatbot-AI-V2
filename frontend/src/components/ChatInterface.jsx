/**
 * ChatInterface.jsx — Écran 3 : Interface de chat NORA (V2)
 * Auteur : Youssef (Frontend)
 *
 * Fonctionnement 100% automatisé :
 *   - Par défaut : IA Gemini V2 (avec mémoire contextuelle & RAG).
 *   - En cas d'indisponibilité IA : Bascule (fallback) automatique et transparente sur la BDD.
 *
 * Consomme :
 *   GET  /api/qas?category_id=X       → suggestions cliquables
 *   POST /api/chat/v2                  → réponse IA Gemini avec mémoire + RAG + AbortSignal (+ fallback BDD)
 *   GET  /api/chat/sessions/<id>       → historique de la session
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
  Info
} from 'lucide-react'
import { getQAs, sendChatV2, getSessionHistory, checkHealth } from '../api/chatApi'
import Sidebar from './Sidebar'

// ─── Bulle de message enrichie ───────────────────────────────────────────────
function MessageBubble({
  msg,
  isLastNora,
  isLoading,
  onRegenerate
}) {
  const isUser = msg.role === 'user'
  const isSystemNotice = msg.isSystemNotice
  const [showSources, setShowSources] = useState(false)

  // Message système discret (ex: "Requête annulée.")
  if (isSystemNotice) {
    return (
      <motion.div
        className="flex justify-center my-1"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
      >
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF5EE] border border-[#E8DDD0] text-xs font-sans text-[#707070] shadow-2xs">
          <Info size={13} className="text-[#85181A]/60" />
          <span>{msg.content}</span>
        </div>
      </motion.div>
    )
  }

  // Détection si le message contient des informations de contact / fallback
  const isContactCard =
    msg.showContactCard ||
    (typeof msg.content === 'string' &&
      (msg.content.includes('05 24 30 46 92') || msg.content.includes('encg@uca.ac.ma')))

  return (
    <motion.div
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {/* Avatar bulle NORA */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full overflow-hidden bg-[#FAF5EE] border border-[#E4D6C4] flex items-center justify-center flex-shrink-0 shadow-xs mt-1">
          <img
            src="/nora_robot_clean.png"
            alt="Nora"
            className="w-6 h-6 object-contain"
          />
        </div>
      )}

      <div className={`max-w-[88%] sm:max-w-[78%] flex flex-col gap-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Bulle de contenu principal */}
        <div
          className={`px-4 py-3 rounded-2xl text-sm font-sans leading-relaxed whitespace-pre-wrap ${
            isUser
              ? 'bg-[#85181A] text-white rounded-br-sm shadow-sm'
              : 'bg-white border border-[#E8DDD0] text-[#1A1A1A] rounded-bl-sm shadow-card'
          }`}
        >
          {msg.content}

          {/* ── Accordéon des Sources RAG ─────────────────────────── */}
          {msg.sources && Array.isArray(msg.sources) && msg.sources.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-[#E8DDD0]/80">
              <button
                onClick={() => setShowSources((prev) => !prev)}
                className="flex items-center gap-1.5 text-xs font-sans font-semibold text-[#85181A] hover:text-[#A02022] transition-colors py-0.5 focus:outline-none"
                aria-expanded={showSources}
              >
                <BookOpen size={13} />
                <span>NORA s'est appuyée sur {msg.sources.length} question{msg.sources.length > 1 ? 's' : ''} fréquente{msg.sources.length > 1 ? 's' : ''}</span>
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
                        className="text-[11px] font-sans text-[#503225] bg-[#FAF5EE] border border-[#E8DDD0]/80 px-2.5 py-1.5 rounded-lg flex items-start gap-1.5"
                      >
                        <span className="text-[#85181A] font-bold">Q :</span>
                        <span>{src.question || (typeof src === 'string' ? src : 'Document de référence')}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Carte interactive des coordonnées ENCG */}
          {isContactCard && (
            <div className="mt-3 pt-3 border-t border-[#E8DDD0] flex flex-col gap-2 bg-[#FAF7F2] p-3 rounded-xl">
              <span className="font-sans font-bold text-xs text-[#85181A] uppercase tracking-wider">
                Contact & Administration ENCG Marrakech
              </span>

              {/* Téléphone */}
              <a
                href="tel:0524304692"
                className="flex items-center gap-2 text-xs font-sans text-[#1A1A1A] hover:text-[#85181A] transition-colors p-1.5 rounded-lg hover:bg-white"
              >
                <div className="w-6 h-6 rounded-full bg-[#85181A]/10 text-[#85181A] flex items-center justify-center flex-shrink-0">
                  <Phone size={13} />
                </div>
                <span><strong>Tél :</strong> 05 24 30 46 92</span>
              </a>

              {/* Email */}
              <a
                href="mailto:encg@uca.ac.ma"
                className="flex items-center gap-2 text-xs font-sans text-[#1A1A1A] hover:text-[#85181A] transition-colors p-1.5 rounded-lg hover:bg-white"
              >
                <div className="w-6 h-6 rounded-full bg-[#85181A]/10 text-[#85181A] flex items-center justify-center flex-shrink-0">
                  <Mail size={13} />
                </div>
                <span><strong>Email :</strong> encg@uca.ac.ma</span>
              </a>

              {/* Adresse */}
              <a
                href="https://www.google.com/search?sca_esv=a32034c9d82639b0&sxsrf=APpeQntcpealz23IV8otmykwn0yHBGIW1A:1789124112052&q=national+school+of+commerce+and+management+of+marrakech+address&ludocid=2651658281646063652&sa=X&sqi=2&ved=2ahUKEwjjtaHZruaWAxXJUKQEHVfhI4oQ6BN6BAg1EAI"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs font-sans text-[#1A1A1A] hover:text-[#85181A] transition-colors p-1.5 rounded-lg hover:bg-white"
              >
                <div className="w-6 h-6 rounded-full bg-[#85181A]/10 text-[#85181A] flex items-center justify-center flex-shrink-0">
                  <MapPin size={13} />
                </div>
                <div className="flex items-center gap-1 min-w-0">
                  <span className="truncate"><strong>Adresse :</strong> MX2X+J8P, Bd Allal Al Fassi, Marrakech 40000</span>
                  <ExternalLink size={12} className="flex-shrink-0 opacity-60" />
                </div>
              </a>
            </div>
          )}
        </div>

        {/* ── Bas de bulle : Badge fallback & Bouton Régénérer ── */}
        {!isUser && (
          <div className="flex items-center gap-2 px-1">
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
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-[#FAF5EE] text-[11px] font-sans text-[#707070] hover:text-[#85181A] transition-colors"
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
      <div className="w-8 h-8 rounded-full overflow-hidden bg-[#FAF5EE] border border-[#E4D6C4] flex items-center justify-center flex-shrink-0 shadow-xs mb-0.5">
        <img
          src="/nora_robot_clean.png"
          alt="Nora"
          className="w-6 h-6 object-contain"
        />
      </div>

      <div className="bg-white border border-[#E8DDD0] rounded-2xl rounded-bl-sm px-4 py-3 shadow-card flex items-center gap-1.5 min-h-[38px]">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-[#85181A]"
            animate={{
              y: [0, -6, 0],
              opacity: [0.35, 1, 0.35],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 0.7,
              repeat: Infinity,
              delay: i * 0.16,
              ease: 'easeInOut',
            }}
          />
        ))}
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
        const userMsg = { id: `user-${Date.now()}`, role: 'user', content: trimmed }
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
        const isUnanswered =
          !replyText ||
          replyText.toLowerCase().includes('pas trouver') ||
          replyText.toLowerCase().includes('pas de réponse') ||
          replyText.toLowerCase().includes('désolé')

        const noraMsg = {
          id: `nora-${Date.now()}`,
          role: 'nora',
          content: isUnanswered
            ? `Je n'ai pas trouvé de réponse précise à votre demande dans la base actuelle.\n\nVous pouvez contacter directement les services de l'ENCG Marrakech :`
            : replyText,
          source: res.source,
          version: res.version,
          isFallback: res.isFallback,
          fallbackReason: res.fallbackReason,
          sources: res.sources || [],
          showContactCard: isUnanswered,
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
          content: `⚠️ Une erreur s'est produite lors du traitement de votre demande.\n\nVous pouvez joindre directement l'administration de l'ENCG Marrakech :`,
          showContactCard: true,
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
