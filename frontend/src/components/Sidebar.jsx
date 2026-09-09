/**
 * Sidebar.jsx — Sidebar latérale du ChatInterface
 * Auteur : Youssef (Frontend)
 *
 * Affiche :
 *   - Avatar3D mini de NORA
 *   - Nom de la catégorie active
 *   - Bouton retour vers CategoryGrid
 *   - Badges de statut (V1/V2, connexion)
 *
 * Props :
 *   category    {Object}   — { id, name } catégorie active
 *   version     {'v1'|'v2'} — mode actif
 *   isOnline    {boolean}  — état de connexion au backend
 *   onBack      {Function} — retour vers la grille des catégories
 */

import React from 'react'
import { motion } from 'framer-motion'
import Avatar3D from './Avatar3D'
import { ArrowLeft, Wifi, WifiOff } from 'lucide-react'

export default function Sidebar({ category, version, isOnline, onBack }) {
  return (
    <motion.aside
      id="chat-sidebar"
      className="flex flex-col items-center gap-6 py-8 px-4
                 bg-encg-white/80 backdrop-blur-sm border-r border-encg-border
                 w-24 md:w-32 flex-shrink-0"
      initial={{ x: -60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* ── Bouton retour ─────────────────────────────────────────── */}
      <button
        id="sidebar-back-btn"
        onClick={onBack}
        className="w-10 h-10 rounded-full flex items-center justify-center
                   bg-encg-cream-bg hover:bg-encg-terracotta/10 border border-encg-border
                   text-encg-text-brown transition-colors duration-150"
        aria-label="Retour aux catégories"
        title="Retour"
      >
        <ArrowLeft size={18} />
      </button>

      {/* ── Avatar NORA mini ─────────────────────────────────────── */}
      <div className="w-16 h-16 md:w-20 md:h-20">
        <Avatar3D scale={0.9} cameraZ={3.2} className="w-full h-full" />
      </div>

      {/* ── Nom NORA ─────────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-1 text-center">
        <span className="font-display text-sm font-semibold text-encg-text-brown">NORA</span>
        <span className="font-sans text-[10px] text-encg-text-brown-light opacity-60 uppercase tracking-wider">
          IA ENCG
        </span>
      </div>

      {/* ── Catégorie active ─────────────────────────────────────── */}
      {category && (
        <div className="w-full rounded-xl bg-encg-terracotta/10 border border-encg-terracotta/20 p-2 text-center">
          <p className="font-sans text-[10px] text-encg-terracotta font-semibold leading-tight">
            {category.name}
          </p>
        </div>
      )}

      {/* ── Espaceur ─────────────────────────────────────────────── */}
      <div className="flex-1" />

      {/* ── Badge version ────────────────────────────────────────── */}
      <div className={`px-2 py-1 rounded-full text-[10px] font-sans font-semibold
        ${version === 'v2'
          ? 'bg-encg-glow/20 text-encg-text-brown border border-encg-glow/40'
          : 'bg-encg-terracotta/15 text-encg-terracotta border border-encg-terracotta/30'
        }`}
      >
        {version === 'v2' ? '✨ IA' : '⚡ SQL'}
      </div>

      {/* ── Indicateur connexion ─────────────────────────────────── */}
      <div
        className={`flex flex-col items-center gap-1 text-[10px] font-sans
          ${isOnline ? 'text-green-600' : 'text-encg-terracotta'}`}
        title={isOnline ? 'Connecté' : 'Hors ligne'}
      >
        {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
        <span className="opacity-70">{isOnline ? 'En ligne' : 'Hors ligne'}</span>
      </div>
    </motion.aside>
  )
}
