/**
 * App.jsx — Routeur principal de NORA
 * Auteur : Youssef (Frontend)
 *
 * Gestion des 3 écrans avec Framer Motion AnimatePresence :
 *   Écran 1 : WelcomeScreen  → Écran 2 au clic
 *   Écran 2 : CategoryGrid   → Écran 3 au choix de catégorie
 *   Écran 3 : ChatInterface  → Écran 2 au retour
 *
 * Pas de react-router : navigation par état local (parfait pour borne tactile SPA).
 */

import React, { useState, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import WelcomeScreen  from './components/WelcomeScreen'
import CategoryGrid   from './components/CategoryGrid'
import ChatInterface  from './components/ChatInterface'

// Écrans possibles
const SCREENS = {
  WELCOME:   'welcome',
  CATEGORIES: 'categories',
  CHAT:       'chat',
}

export default function App() {
  const [screen,          setScreen]          = useState(SCREENS.WELCOME)
  const [activeCategory,  setActiveCategory]  = useState(null)

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

  return (
    <div className="w-full h-full overflow-hidden">
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
          />
        )}

        {screen === SCREENS.CHAT && (
          <ChatInterface
            key="chat"
            category={activeCategory}
            onBack={handleBackToCategories}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
