/**
 * App.jsx — Routeur principal de NORA
 * Auteur : Youssef (Frontend)
 *
 * Gestion des 4 écrans avec Framer Motion AnimatePresence :
 *   Écran 1 : WelcomeScreen   → Écran 2 au clic
 *   Écran 2 : CategoryGrid    → Écran 3 au choix de catégorie / Écran 4 via "Parcourir"
 *   Écran 3 : ChatInterface   → Écran 2 au retour
 *   Écran 4 : KnowledgeBase   → Écran 2 au retour / Écran 3 via "Discuter"
 *
 * Pas de react-router : navigation par état local (parfait pour borne tactile SPA).
 */

import React, { useState, useCallback, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import WelcomeScreen from './components/WelcomeScreen'
import CategoryGrid from './components/CategoryGrid'
import ChatInterface from './components/ChatInterface'
import KnowledgeBase from './components/KnowledgeBase'

// Écrans possibles
const SCREENS = {
  WELCOME: 'welcome',
  CATEGORIES: 'categories',
  CHAT: 'chat',
  KNOWLEDGE: 'knowledge',
}

// Durée d'inactivité avant redirection automatique vers l'accueil (30 secondes)
const INACTIVITY_TIMEOUT_MS = 30 * 1000

// Durée d'inactivité SUR l'accueil avant purge de la session de chat (30 secondes)
// Borne tactile : le visiteur suivant doit démarrer une conversation 100% neuve
const SESSION_PURGE_TIMEOUT_MS = 30 * 1000

export default function App() {
  const [screen, setScreen] = useState(SCREENS.WELCOME)
  const [activeCategory, setActiveCategory] = useState(null)

  // ── Transitions ──────────────────────────────────────────────────────────
  const handleStart = useCallback(() => {
    setScreen(SCREENS.CATEGORIES)
  }, [])

  const handleSelectCategory = useCallback((category) => {
    setActiveCategory(category)
    setScreen(SCREENS.CHAT)
  }, [])

  const handleBackToCategories = useCallback(() => {
    setScreen(SCREENS.CATEGORIES)
    setActiveCategory(null)
  }, [])

  const handleBackToWelcome = useCallback(() => {
    setScreen(SCREENS.WELCOME)
    setActiveCategory(null)
  }, [])

  // ── Knowledge Base ───────────────────────────────────────────────────────
  const handleOpenKnowledge = useCallback(() => {
    setScreen(SCREENS.KNOWLEDGE)
  }, [])

  const handleKnowledgeToChat = useCallback((category) => {
    setActiveCategory(category)
    setScreen(SCREENS.CHAT)
  }, [])

  const handleBackFromKnowledge = useCallback(() => {
    setScreen(SCREENS.CATEGORIES)
    setActiveCategory(null)
  }, [])

  // ── ⏱️ Redirection automatique vers l'accueil après 30s d'inactivité ──────
  useEffect(() => {
    if (screen === SCREENS.WELCOME) return

    let idleTimer = null

    const resetIdleTimer = () => {
      if (idleTimer) clearTimeout(idleTimer)
      idleTimer = setTimeout(() => {
        handleBackToWelcome()
      }, INACTIVITY_TIMEOUT_MS)
    }

    // Événements d'interaction tactile, souris et clavier
    const userEvents = [
      'touchstart',
      'touchend',
      'touchmove',
      'pointerdown',
      'pointermove',
      'mousemove',
      'mousedown',
      'keydown',
      'scroll',
      'click',
    ]

    userEvents.forEach((evt) => {
      window.addEventListener(evt, resetIdleTimer, { passive: true })
    })

    // Lance le décompte initial de 30 secondes
    resetIdleTimer()

    return () => {
      if (idleTimer) clearTimeout(idleTimer)
      userEvents.forEach((evt) => {
        window.removeEventListener(evt, resetIdleTimer)
      })
    }
  }, [screen, handleBackToWelcome])

  // ── 🧹 Purge de la session de chat après 30 s d'inactivité SUR l'accueil ────
  //    Enchaînement borne tactile :
  //      1) 30 s d'inactivité dans le chat → retour accueil (effet ci-dessus)
  //      2) 30 s d'inactivité sur l'accueil → session oubliée (cet effet)
  //    Si l'utilisateur repart avant, le timer est annulé et la session conservée.
  useEffect(() => {
    if (screen !== SCREENS.WELCOME) return

    const purgeTimer = setTimeout(() => {
      try {
        sessionStorage.removeItem('nora_session_id')
      } catch {
        // sessionStorage indisponible (navigation privée...) — rien à faire
      }
    }, SESSION_PURGE_TIMEOUT_MS)

    return () => clearTimeout(purgeTimer)
  }, [screen])


  return (
    <div className="w-full h-full min-h-screen bg-[#F8F3EA] overflow-hidden">
      <AnimatePresence mode="wait">
        {screen === SCREENS.WELCOME && (
          <WelcomeScreen
            key="welcome"
            onStart={handleStart}
          />
        )}

        {screen === SCREENS.CATEGORIES && (
          <CategoryGrid
            key="categories"
            onSelectCategory={handleSelectCategory}
            onBack={handleBackToWelcome}
            onOpenKnowledge={handleOpenKnowledge}
            onOpenChat={() => handleSelectCategory(null)}
          />
        )}

        {screen === SCREENS.CHAT && (
          <ChatInterface
            key="chat"
            category={activeCategory}
            onBack={handleBackToCategories}
          />
        )}

        {screen === SCREENS.KNOWLEDGE && (
          <KnowledgeBase
            key="knowledge"
            onBack={handleBackFromKnowledge}
            onOpenChat={handleKnowledgeToChat}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
