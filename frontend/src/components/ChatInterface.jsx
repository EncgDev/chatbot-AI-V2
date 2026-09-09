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
import { Send, ArrowLeft, RotateCcw } from 'lucide-react'
import { getQAs, sendChatV1, sendChatV2, checkHealth } from '../api/chatApi'
import Sidebar from './Sidebar'
import VersionToggle from './VersionToggle'

// ─── Constantes ───────────────────────────────────────────────────────────────
const MAX_SUGGESTIONS = 4

// ─── Bulle de message ─────────────────────────────────────────────────────────
function MessageBubble({ msg, index }) {
  const isUser = msg.role === 'user'

  return (
    <motion.div
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {/* Avatar bulle NORA */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full terracotta-gradient flex items-center justify-center
                        flex-shrink-0 text-white text-xs font-bold shadow-sm mt-1">
          N
        </div>
      )}

      <div className={`max-w-[75%] flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Contenu */}
        <div
          className={`px-4 py-3 rounded-2xl text-sm font-sans leading-relaxed whitespace-pre-wrap
            ${isUser
              ? 'terracotta-gradient text-white rounded-br-sm'
              : 'bg-encg-white border border-encg-border text-encg-text-brown rounded-bl-sm shadow-card'
            }`}
        >
          {msg.content}
        </div>

        {/* Source badge (V1/V2) */}
        {!isUser && msg.source && (
          <span className="text-[10px] font-sans text-encg-text-brown-light opacity-50 px-1">
            {msg.version === 'v2' ? '✨ IA Gemini' : '⚡ Recherche rapide'}
            {msg.source && msg.source !== 'sql' && msg.source !== 'v1' && ` · ${msg.source}`}
          </span>
        )}
      </div>
    </motion.div>
  )
}

// ─── Indicateur de frappe NORA ────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <motion.div
      className="flex gap-3 items-center"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.25 }}
    >
      <div className="w-8 h-8 rounded-full terracotta-gradient flex items-center justify-center
                      flex-shrink-0 text-white text-xs font-bold shadow-sm">
        N
      </div>
      <div className="bg-encg-white border border-encg-border rounded-2xl rounded-bl-sm px-4 py-3 shadow-card">
        <div className="flex gap-1.5 items-center">
          {[0, 0.15, 0.30].map((delay, i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-encg-terracotta/60"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay, ease: 'easeInOut' }}
            />
          ))}
        </div>
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
  const [messages,     setMessages]     = useState([])
  const [input,        setInput]        = useState('')
  const [version,      setVersion]      = useState('v1')
  const [isLoading,    setIsLoading]    = useState(false)
  const [suggestions,  setSuggestions]  = useState([])
  const [isOnline,     setIsOnline]     = useState(true)
  const messagesEndRef = useRef(null)
  const inputRef       = useRef(null)

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
      id:      Date.now(),
      role:    'nora',
      content: category
        ? `Bonjour ! Je suis NORA, votre assistante ENCG 😊\nJe suis prête à répondre à vos questions sur **${category.name}**.\n\nVoici quelques sujets fréquents — touchez ou saisissez votre question !`
        : 'Bonjour ! Je suis NORA, votre assistante ENCG 😊\nComment puis-je vous aider ?',
    }
    setMessages([welcome])

    // Charger suggestions depuis l'API
    if (category?.id) {
      getQAs(category.id)
        .then((qas) => {
          // Prend les N premières questions comme suggestions
          // Champ exact du contrat : "question"
          setSuggestions(qas.slice(0, MAX_SUGGESTIONS).map((qa) => qa.question))
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
      const fn  = version === 'v2' ? sendChatV2 : sendChatV1
      const res = await fn(trimmed)

      const noraMsg = {
        id:      Date.now() + 1,
        role:    'nora',
        content: res.reply || 'Je n\'ai pas pu obtenir de réponse. Veuillez réessayer.',
        source:  res.source,
        version: res.version,
      }
      setMessages((prev) => [...prev, noraMsg])
    } catch (err) {
      const errMsg = {
        id:      Date.now() + 1,
        role:    'nora',
        content: `⚠️ Une erreur s'est produite : ${err.message}\n\nVérifiez votre connexion ou contactez l'ENCG :\n📞 +212 524 33 70 26`,
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
    // Re-déclenche le welcome
    const welcome = {
      id:      Date.now(),
      role:    'nora',
      content: 'Conversation réinitialisée. Comment puis-je vous aider ?',
    }
    setMessages([welcome])
    if (category?.id) {
      getQAs(category.id).then((qas) => {
        setSuggestions(qas.slice(0, MAX_SUGGESTIONS).map((qa) => qa.question))
      }).catch(() => {})
    }
  }

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
        <header className="flex items-center justify-between px-5 py-4
                           border-b border-encg-border bg-encg-white/90 backdrop-blur-xs">
          <div className="flex items-center gap-3">
            <button
              id="chat-back-btn"
              onClick={onBack}
              className="md:hidden w-9 h-9 rounded-full flex items-center justify-center
                         hover:bg-encg-cream-bg text-encg-text-brown transition-colors"
              aria-label="Retour"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2 className="font-display font-semibold text-encg-text-brown text-base">
                {category?.name ?? 'NORA'}
              </h2>
              <p className="font-sans text-xs text-encg-text-brown-light opacity-60">
                {isOnline ? '● En ligne' : '● Hors ligne'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Toggle V1/V2 */}
            <VersionToggle
              version={version}
              onChange={setVersion}
              disabled={isLoading}
            />

            {/* Réinitialiser */}
            <button
              id="chat-reset-btn"
              onClick={handleReset}
              className="w-9 h-9 rounded-full flex items-center justify-center
                         hover:bg-encg-cream-bg text-encg-text-brown-light transition-colors"
              title="Réinitialiser la conversation"
              aria-label="Réinitialiser"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </header>

        {/* ── Messages ─────────────────────────────────────────────── */}
        <div
          id="chat-messages"
          className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4"
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

        {/* ── Suggestions ──────────────────────────────────────────── */}
        <AnimatePresence>
          {suggestions.length > 0 && messages.length <= 1 && !isLoading && (
            <motion.div
              className="px-5 pb-3 flex flex-wrap gap-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {suggestions.map((q, i) => (
                <button
                  key={i}
                  id={`suggestion-${i}`}
                  onClick={() => handleSuggestion(q)}
                  className="text-left px-3 py-2 rounded-xl bg-encg-white border border-encg-border
                             text-encg-text-brown text-xs font-sans
                             hover:border-encg-terracotta/50 hover:bg-encg-terracotta/5
                             transition-colors duration-150 shadow-sm max-w-[48%] truncate"
                  title={q}
                >
                  {q.length > 55 ? q.slice(0, 52) + '…' : q}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Barre de saisie ──────────────────────────────────────── */}
        <div className="px-5 pb-6 pt-3 border-t border-encg-border bg-encg-white/90 backdrop-blur-xs">
          <form
            id="chat-input-form"
            onSubmit={handleSubmit}
            className="flex items-end gap-3"
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
                         px-4 py-3 text-sm font-sans text-encg-text-brown placeholder:text-encg-text-brown-light/50
                         focus:outline-none focus:ring-2 focus:ring-encg-terracotta/40 focus:border-encg-terracotta/50
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors duration-150 max-h-32 overflow-auto"
              style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
              aria-label="Message à NORA"
            />
            <button
              id="chat-send-btn"
              type="submit"
              disabled={isLoading || !input.trim()}
              className="w-11 h-11 rounded-xl terracotta-gradient flex items-center justify-center
                         text-white shadow-md disabled:opacity-40 disabled:cursor-not-allowed
                         hover:shadow-card-hover transition-all duration-150 flex-shrink-0"
              aria-label="Envoyer"
            >
              {isLoading
                ? <div className="spinner w-5 h-5" />
                : <Send size={17} />
              }
            </button>
          </form>

          {/* Mention version active */}
          <p className="mt-2 text-center text-[10px] font-sans text-encg-text-brown-light opacity-40">
            Mode {version === 'v2' ? 'IA Gemini (peut être lent)' : 'recherche rapide SQL'}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
