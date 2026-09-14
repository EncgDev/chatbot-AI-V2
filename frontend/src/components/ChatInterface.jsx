/**
 * ChatInterface.jsx — Écran 3 : Interface de chat NORA
 * Auteur : Youssef (Frontend)
 *
 * Consomme :
 *   GET  /api/qas?category_id=X  → suggestions cliquables
 *   POST /api/chat/v1             → réponse SQL rapide
 *   POST /api/chat/v2             → réponse IA Gemini
 *
 * Noms de champs stricts (contrat README) :
 *   question, response, category_id (pour les QAs)
 *   reply, source (normalisés côté chatApi.js)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, ArrowLeft, RotateCcw, Sparkles, Phone, MapPin, Mail, ExternalLink } from 'lucide-react'
import { getQAs, sendChatV1, sendChatV2, checkHealth } from '../api/chatApi'
import Sidebar from './Sidebar'

// ─── Bulle de message ─────────────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isUser = msg.role === 'user'

  // Détection si le message contient des informations de contact / fallback
  const isContactCard = msg.showContactCard || 
    (typeof msg.content === 'string' && (msg.content.includes('05 24 30 46 92') || msg.content.includes('encg@uca.ac.ma')))

  return (
    <motion.div
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {/* Avatar bulle NORA avec icône robot */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full overflow-hidden bg-[#FAF5EE] border border-[#E4D6C4] flex items-center justify-center flex-shrink-0 shadow-xs mt-1">
          <img
            src="/nora_robot_clean.png"
            alt="Nora"
            className="w-6 h-6 object-contain"
          />
        </div>
      )}

      <div className={`max-w-[85%] sm:max-w-[75%] flex flex-col gap-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Contenu */}
        <div
          className={`px-4 py-3 rounded-2xl text-sm font-sans leading-relaxed whitespace-pre-wrap
            ${isUser
              ? 'bg-[#85181A] text-white rounded-br-sm shadow-sm'
              : 'bg-white border border-[#E8DDD0] text-[#1A1A1A] rounded-bl-sm shadow-card'
            }`}
        >
          {msg.content}

          {/* Carte interactive des coordonnées ENCG en cas de question sans réponse ou erreur */}
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
      </div>
    </motion.div>
  )
}

// ─── Indicateur d'attente NORA (Trois points dans la conversation) ────────────
function TypingIndicator() {
  return (
    <motion.div
      className="flex gap-3 items-end"
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {/* Avatar NORA */}
      <div className="w-8 h-8 rounded-full overflow-hidden bg-[#FAF5EE] border border-[#E4D6C4] flex items-center justify-center flex-shrink-0 shadow-xs mb-0.5">
        <img
          src="/nora_robot_clean.png"
          alt="Nora"
          className="w-6 h-6 object-contain"
        />
      </div>

      {/* Bulle contenant uniquement les 3 points rebondissants */}
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
/**
 * @param {Object}   props
 * @param {Object}   props.category    — { id, name } catégorie sélectionnée
 * @param {Function} props.onBack      — retour vers CategoryGrid
 */
export default function ChatInterface({ category, onBack }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [version, setVersion] = useState('v1')
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [isOnline, setIsOnline] = useState(true)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // ── Scroll automatique vers le bas ────────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(scrollToBottom, [messages, isLoading, scrollToBottom])

  // ── Vérification santé backend ────────────────────────────────────────────
  useEffect(() => {
    checkHealth().then(setIsOnline)
  }, [])

  // ── Message de bienvenue + chargement suggestions ────────────────────────
  useEffect(() => {
    const welcome = {
      id: Date.now(),
      role: 'nora',
      content: category
        ? `Bonjour ! Je suis NORA, votre assistante ENCG 😊\nJe suis prête à répondre à vos questions sur **${category.name}**.\n\nSélectionnez une question en haut ou posez directement votre question ci-dessous !`
        : 'Bonjour ! Je suis NORA, votre assistante ENCG 😊\nComment puis-je vous aider ?\n\nSélectionnez une question en haut ou posez directement votre question ci-dessous !',
    }
    setMessages([welcome])

    // Charger TOUTES les questions depuis l'API pour la catégorie
    if (category?.id) {
      getQAs(category.id)
        .then((qas) => {
          setSuggestions(qas.map((qa) => qa.question).filter(Boolean))
        })
        .catch(() => setSuggestions([]))
    } else {
      getQAs()
        .then((qas) => {
          setSuggestions(qas.map((qa) => qa.question).filter(Boolean))
        })
        .catch(() => setSuggestions([]))
    }
  }, [category])

  // ── Envoi d'un message ────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text) => {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return

    // Ajoute le message utilisateur
    const userMsg = { id: Date.now(), role: 'user', content: trimmed }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const fn = version === 'v2' ? sendChatV2 : sendChatV1
      const res = await fn(trimmed)

      const replyText = res.reply?.trim() || ''
      const isUnanswered = !replyText || 
        replyText.toLowerCase().includes('pas trouver') || 
        replyText.toLowerCase().includes('pas de réponse') ||
        replyText.toLowerCase().includes('désolé')

      const noraMsg = {
        id: Date.now() + 1,
        role: 'nora',
        content: isUnanswered
          ? `Je n'ai pas trouvé de réponse précise à votre demande dans la base actuelle.\n\nVous pouvez contacter directement les services de l'ENCG Marrakech :`
          : replyText,
        source: res.source,
        version: res.version,
        showContactCard: isUnanswered,
      }
      setMessages((prev) => [...prev, noraMsg])
    } catch (err) {
      const errMsg = {
        id: Date.now() + 1,
        role: 'nora',
        content: `⚠️ Une erreur s'est produite lors du traitement de votre demande.\n\nVous pouvez joindre directement l'administration de l'ENCG Marrakech :`,
        showContactCard: true,
      }
      setMessages((prev) => [...prev, errMsg])
      setIsOnline(false)
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, version])

  const handleSubmit = (e) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleSuggestion = (q) => sendMessage(q)

  const handleReset = () => {
    setMessages([])
    setSuggestions([])
    const welcome = {
      id: Date.now(),
      role: 'nora',
      content: 'Conversation réinitialisée. Comment puis-je vous aider ?',
    }
    setMessages([welcome])
    if (category?.id) {
      getQAs(category.id).then((qas) => {
        setSuggestions(qas.map((qa) => qa.question).filter(Boolean))
      }).catch(() => { })
    } else {
      getQAs().then((qas) => {
        setSuggestions(qas.map((qa) => qa.question).filter(Boolean))
      }).catch(() => { })
    }
  }

  // ── Filtrage en direct des questions selon la saisie ────────────────────
  const normalizedInput = input.trim().toLowerCase()
  const filteredSuggestions = suggestions.filter((q) =>
    normalizedInput === '' || q.toLowerCase().includes(normalizedInput)
  )

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
        version={version}
        isOnline={isOnline}
        onBack={onBack}
      />

      {/* ── Zone principale ───────────────────────────────────────── */}
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* ── Header chat ──────────────────────────────────────────── */}
        <header className="flex items-center justify-between px-3.5 sm:px-6 py-2.5 sm:py-4
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
              <h2 className="font-display font-bold text-[#1A1A1A] text-sm sm:text-lg leading-tight truncate">
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
              title="Réinitialiser la conversation"
              aria-label="Réinitialiser"
            >
              <RotateCcw size={13} />
              <span className="hidden sm:inline">Effacer</span>
            </button>

            {/* Logo officiel ENCG couleur à droite */}
            <img
              src="/Logo ENCG couleur.png"
              alt="ENCG Marrakech — Université Cadi Ayyad"
              className="h-8 sm:h-11 w-auto object-contain drop-shadow-xs select-none pointer-events-none"
              loading="eager"
            />
          </div>
        </header>

        {/* ── Suggestions : PLACÉES EN HAUT DU CHAT ────────────────────────── */}
        <AnimatePresence>
          {filteredSuggestions.length > 0 && !isLoading && (
            <motion.div
              className="px-3.5 sm:px-6 py-2.5 bg-white/70 border-b border-[#E8DDD0]/80 backdrop-blur-xs flex flex-col gap-1.5 z-10 flex-shrink-0"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              <div className="flex items-center justify-between px-0.5">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={13} className="text-[#85181A] flex-shrink-0" />
                  <span className="font-sans text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#85181A]/90">
                    {normalizedInput
                      ? `Questions correspondantes (${filteredSuggestions.length}) :`
                      : `Questions suggérées (${filteredSuggestions.length}) :`}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {filteredSuggestions.map((q, i) => (
                  <button
                    key={i}
                    id={`suggestion-${i}`}
                    onClick={() => handleSuggestion(q)}
                    className="flex-shrink-0 whitespace-nowrap px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-full bg-white border border-[#E8DDD0]
                               text-[#1A1A1A] text-[11px] sm:text-xs font-sans font-medium
                               hover:border-[#85181A]/60 hover:bg-[#85181A] hover:text-white
                               transition-all duration-150 shadow-xs hover:shadow-sm active:scale-95"
                    title={q}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Messages ─────────────────────────────────────────────── */}
        <div
          id="chat-messages"
          className="flex-1 overflow-y-auto px-3.5 sm:px-6 py-3.5 sm:py-5 flex flex-col gap-3.5 sm:gap-4"
        >
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}

          {/* Typing indicator */}
          <AnimatePresence>
            {isLoading && <TypingIndicator key="typing" />}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>

        {/* ── Barre de saisie ──────────────────────────────────────── */}
        <div className="px-3.5 sm:px-6 pb-4 sm:pb-6 pt-2 sm:pt-3 border-t border-encg-border bg-encg-white/90 backdrop-blur-xs flex-shrink-0">
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
              className="flex-1 resize-none rounded-xl border border-encg-border bg-encg-cream-light
                         px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-sans text-encg-text-brown placeholder:text-encg-text-brown-light/50
                         focus:outline-none focus:ring-2 focus:ring-encg-terracotta/40 focus:border-encg-terracotta/50
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors duration-150 max-h-28 sm:max-h-32 overflow-auto"
              style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
              aria-label="Message à NORA"
            />
            <button
              id="chat-send-btn"
              type="submit"
              disabled={isLoading || !input.trim()}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-[#85181A] to-[#661012] flex items-center justify-center
                         text-white shadow-md disabled:opacity-40 disabled:cursor-not-allowed
                         hover:shadow-card-hover transition-all duration-150 flex-shrink-0"
              aria-label="Envoyer"
            >
              {isLoading
                ? <div className="spinner w-4 h-4 sm:w-5 sm:h-5 border-white border-t-transparent" />
                : <Send size={16} />
              }
            </button>
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

