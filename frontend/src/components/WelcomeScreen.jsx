/**
 * WelcomeScreen.jsx — Écran d'accueil NORA (borne tactile ENCG Marrakech)
 *
 * Conforme au schéma de l'utilisateur :
 *   - Message déplacé directement dans la bulle de parole à côté du robot (comme indiqué par la flèche rouge)
 *   - Fond du robot 100% transparent (détourage parfait, corps plein sans trou)
 *   - Bulle de parole agrandie, élégante et chaleureuse :
 *       • En-tête « NORA VOUS ACCUEILLE » avec indicateur en ligne
 *       • Grand titre sérif « Bienvenue à l'ENCG Marrakech ! »
 *       • Sous-titre « Votre assistante virtuelle interactive est à votre écoute. »
 *       • Queue de bulle pointant vers le robot
 *   - Logo officiel ENCG Marrakech (logo1.png transparent)
 *   - Fond sable/crème noble avec éventail de palmes royales doucement animées
 *   - Invitation tactile « Touchez l'écran pour commencer »
 */

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Avatar3D from './Avatar3D'

// ─── Palmes royales animées en arrière-plan ──────────────────────────────────
function AnimatedPalmBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* 1. Gradient de fond sable chaud / crème impériale */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 36%, #FAF6EE 0%, #F5EEE2 55%, #EFE5D4 100%)',
        }}
      />

      {/* 2. Trame de micro-points subtils */}
      <div
        className="absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage: `radial-gradient(#8E4828 1.1px, transparent 1.1px)`,
          backgroundSize: '28px 28px',
        }}
      />

      {/* 3. Palmes royales avec doux balancement au vent */}
      <motion.svg
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[58%] w-[980px] h-[980px] max-w-none select-none opacity-80"
        viewBox="0 0 800 800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        animate={{
          rotate: [-1.2, 1.2, -1.2],
        }}
        transition={{
          duration: 8.0,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <defs>
          <linearGradient id="palmGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#C85A32" stopOpacity="0.03" />
            <stop offset="60%" stopColor="#C85A32" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#8E3E1E" stopOpacity="0.24" />
          </linearGradient>

          <g id="single-palm-frond">
            <path
              d="M 400 440 Q 400 240 400 60"
              stroke="url(#palmGrad)"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Folioles fuselées */}
            <path d="M 400 80 Q 380 50 360 40 Q 390 65 400 85" fill="url(#palmGrad)" />
            <path d="M 400 80 Q 420 50 440 40 Q 410 65 400 85" fill="url(#palmGrad)" />
            <path d="M 400 110 Q 360 70 330 65 Q 375 95 400 115" fill="url(#palmGrad)" />
            <path d="M 400 110 Q 440 70 470 65 Q 425 95 400 115" fill="url(#palmGrad)" />
            <path d="M 400 145 Q 345 105 305 100 Q 360 130 400 150" fill="url(#palmGrad)" />
            <path d="M 400 145 Q 455 105 495 100 Q 440 130 400 150" fill="url(#palmGrad)" />
            <path d="M 400 185 Q 330 145 285 145 Q 350 170 400 190" fill="url(#palmGrad)" />
            <path d="M 400 185 Q 470 145 515 145 Q 450 170 400 190" fill="url(#palmGrad)" />
            <path d="M 400 230 Q 320 195 270 200 Q 345 220 400 235" fill="url(#palmGrad)" />
            <path d="M 400 230 Q 480 195 530 200 Q 455 220 400 235" fill="url(#palmGrad)" />
            <path d="M 400 280 Q 315 250 265 260 Q 345 272 400 285" fill="url(#palmGrad)" />
            <path d="M 400 280 Q 485 250 535 260 Q 455 272 400 285" fill="url(#palmGrad)" />
            <path d="M 400 330 Q 325 305 280 325 Q 350 328 400 335" fill="url(#palmGrad)" />
            <path d="M 400 330 Q 475 305 520 325 Q 450 328 400 335" fill="url(#palmGrad)" />
            <path d="M 400 380 Q 340 365 305 385 Q 360 382 400 385" fill="url(#palmGrad)" />
            <path d="M 400 380 Q 460 365 495 385 Q 440 382 400 385" fill="url(#palmGrad)" />
          </g>
        </defs>

        <g transform="rotate(-38 400 440)">
          <use href="#single-palm-frond" />
        </g>
        <g transform="rotate(0 400 440)">
          <use href="#single-palm-frond" />
        </g>
        <g transform="rotate(38 400 440)">
          <use href="#single-palm-frond" />
        </g>
        <g transform="rotate(-68 400 440) scale(0.82)" opacity="0.6">
          <use href="#single-palm-frond" />
        </g>
        <g transform="rotate(68 400 440) scale(0.82)" opacity="0.6">
          <use href="#single-palm-frond" />
        </g>
      </motion.svg>
    </div>
  )
}

// ─── Composant principal WelcomeScreen ─────────────────────────────────────────
export default function WelcomeScreen({ onStart }) {
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [exitTriggered, setExitTriggered] = useState(false)
  const [touchRipple, setTouchRipple] = useState(false)

  // Gestion du tap tactile / clic avec transition cinématique
  const handleTap = useCallback(() => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setTouchRipple(true)
    setExitTriggered(true)

    setTimeout(() => {
      onStart?.()
    }, 700)
  }, [isTransitioning, onStart])

  return (
    <AnimatePresence mode="wait">
      {!exitTriggered ? (
        <motion.div
          key="welcome"
          className="relative w-full h-full min-h-screen flex flex-col items-center justify-center overflow-hidden cursor-pointer select-none"
          style={{ touchAction: 'manipulation' }}
          onClick={handleTap}
          onTouchEnd={handleTap}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 0.94,
            filter: 'blur(8px)',
            transition: { duration: 0.70, ease: [0.4, 0, 0.2, 1] },
          }}
          transition={{ duration: 0.65, ease: 'easeOut' }}
          role="button"
          tabIndex={0}
          aria-label="Touchez l'écran pour commencer"
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleTap()}
        >
          {/* ── 1. Arrière-plan avec palmes en mouvement ──────────────── */}
          <AnimatedPalmBackground />

          {/* ── 2. Contenu centré (Bulle de parole + Robot côte-à-côte) ── */}
          <div className="relative z-10 w-full max-w-4xl px-6 flex flex-col items-center justify-center text-center">

            {/* ── Bloc combiné : Bulle de parole à gauche + Robot à droite ─ */}
            <div className="relative flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6 my-2">

              {/* 💬 Bulle de parole agrandie (remplace la lampe selon votre flèche rouge) */}
              <motion.div
                className="relative z-20 bg-white/92 backdrop-blur-xl px-6 py-4 sm:px-8 sm:py-5 rounded-3xl shadow-[0_16px_36px_rgba(160,80,30,0.15)] border-2 border-[#EAD0BA] max-w-sm sm:max-w-md text-left"
                initial={{ opacity: 0, scale: 0.85, x: -20 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  x: 0,
                  y: [0, -5, 0],
                }}
                transition={{
                  opacity: { delay: 0.25, duration: 0.75, ease: [0.34, 1.3, 0.64, 1] },
                  scale: { delay: 0.25, duration: 0.75, ease: [0.34, 1.3, 0.64, 1] },
                  x: { delay: 0.25, duration: 0.75, ease: [0.34, 1.3, 0.64, 1] },
                  y: { duration: 4.0, repeat: Infinity, ease: 'easeInOut' },
                }}
                whileHover={{ scale: 1.02 }}
              >
                {/* En-tête : Badge NORA */}
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xl inline-block animate-bounce">👋</span>
                  <span className="text-[11px] sm:text-xs font-sans uppercase tracking-widest font-bold text-[#85181A]">
                    NORA vous accueille
                  </span>
                  <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" title="En ligne" />
                </div>

                {/* Grand titre sérif */}
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#85181A] leading-snug">
                  Bienvenue à l'ENCG Marrakech !
                </h1>

                {/* Sous-titre accueillant */}
                <p className="font-sans text-xs sm:text-sm text-[#505050] mt-1.5 font-normal opacity-85">
                  Votre assistante virtuelle interactive est à votre écoute.
                </p>

                {/* Flèche de la bulle pointant vers le robot (à droite sur desktop, en bas sur mobile) */}
                <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white/95 border-t-2 border-r-2 border-[#EAD0BA] rotate-45" />
                <div className="md:hidden absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white/95 border-b-2 border-r-2 border-[#EAD0BA] rotate-45" />
              </motion.div>

              {/* 🤖 Robot 3D d'assistance (Fond 100% transparent, corps plein sans trou) */}
              <motion.div
                className="relative flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.85, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ delay: 0.15, duration: 0.85, ease: [0.34, 1.3, 0.64, 1] }}
              >
                <Avatar3D
                  interactive={true}
                  className="w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96"
                />
              </motion.div>
            </div>

            {/* ── 3. Logo officiel ENCG Marrakech (logo1.png transparent) ─ */}
            <motion.div
              className="flex items-center justify-center mt-2 mb-6"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.50, duration: 0.7, ease: 'easeOut' }}
            >
              <img
                src="/Logo ENCG couleur.png"
                alt="École Nationale de Commerce et de Gestion Marrakech - Université Cadi Ayyad"
                className="h-12 sm:h-14 md:h-16 w-auto object-contain drop-shadow-sm select-none pointer-events-none"
                loading="eager"
              />
            </motion.div>

            {/* ── 4. Invitation tactile interactive "Touchez l'écran" ──── */}
            <motion.div
              className="flex flex-col items-center gap-2.5"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, duration: 0.7, ease: 'easeOut' }}
            >
              <motion.div
                className="flex items-center gap-2.5 text-[#85181A]"
                animate={{
                  opacity: [0.80, 1, 0.80],
                  y: [0, -2, 0],
                }}
                transition={{
                  duration: 3.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                {/* Anneau pulsant tactile */}
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#85181A] opacity-60" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#85181A]" />
                </span>

                <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-normal tracking-normal text-[#85181A]">
                  Touchez l'écran pour commencer
                </h2>
              </motion.div>

              {/* Sous-titre académique */}
              <p className="font-sans text-xs sm:text-sm tracking-widest text-[#505050] opacity-75 font-normal">
                École Nationale de Commerce et de Gestion · Marrakech
              </p>
            </motion.div>
          </div>

          {/* ── 5. Ondulation tactile au tap ─────────────────────────── */}
          {touchRipple && (
            <motion.div
              className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="rounded-full border-2 border-[#85181A]"
                initial={{ width: 40, height: 40, opacity: 0.8 }}
                animate={{ width: 600, height: 600, opacity: 0 }}
                transition={{ duration: 0.65, ease: 'easeOut' }}
              />
            </motion.div>
          )}

          {/* ── 6. Overlay de transition douce (Voile crème doré) ─────── */}
          {isTransitioning && (
            <motion.div
              className="absolute inset-0 z-30 bg-[#F5EEE2]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.98 }}
              transition={{ duration: 0.65, ease: [0.4, 0, 0.2, 1] }}
            />
          )}
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
