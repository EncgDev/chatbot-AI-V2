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

import React, { useState, useCallback } from 'react'
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
