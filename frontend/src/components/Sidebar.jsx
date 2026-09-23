import React from 'react'
import { motion } from 'framer-motion'
import Avatar3D from './Avatar3D'
import { ArrowLeft, Sparkles } from 'lucide-react'

export default function Sidebar({ category, isOnline, onBack }) {
  return (
    <motion.aside
      id="chat-sidebar"
      className="hidden sm:flex flex-col justify-between p-6
                 bg-white/85 backdrop-blur-md border-r border-[#E8DDD0]
                 w-64 md:w-72 lg:w-80 flex-shrink-0 z-10 select-none overflow-y-auto"
      initial={{ x: -60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* ── Haut : Bouton retour vers les catégories ── */}
      <div className="w-full">
        <button
          id="sidebar-back-btn"
          onClick={onBack}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl
                     bg-[#FAF7F2] hover:bg-[#85181A]/10 border border-[#E8DDD0]
                     text-[#85181A] font-sans text-xs sm:text-sm font-semibold transition-all duration-200
                     shadow-xs hover:shadow-sm group"
          aria-label="Retour aux catégories"
          title="Retour aux catégories"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Changer de catégorie</span>
        </button>
      </div>

      {/* ── Milieu : Robot NORA centré parfaitement ── */}
      <div className="flex-1 flex flex-col items-center justify-center my-6 w-full text-center">
        {/* Avatar NORA 3D centré et agrandi */}
        <div className="w-40 h-40 md:w-48 md:h-48 lg:w-52 lg:h-52 flex items-center justify-center">
          <Avatar3D interactive={true} className="w-full h-full" />
        </div>

        {/* Nom & Titre NORA */}
        <div className="flex flex-col items-center mt-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#85181A]/10 border border-[#85181A]/20">
            <span className="w-3 h-3 rounded-full bg-[#10B981] animate-pulse" />
            <span className="font-sans text-xl font-bold text-[#85181A] uppercase tracking-wider">
              NORA · ENCG
            </span>
          </div>
          <h3 className="font-serif font-bold text-lg text-[#1A1A1A] mt-2">
            Votre Assistante
          </h3>
          <p className="font-sans text-xs text-[#505050] opacity-80 max-w-[200px] mt-0.5">
            Posez vos questions librement à Nora
          </p>
        </div>

        {/* ── Carte de la catégorie active ── */}
        {category && (
          <div className="w-full rounded-2xl bg-[#FAF7F2] border border-[#E8DDD0] p-3.5 text-left shadow-xs mt-4">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={14} className="text-[#85181A]" />
              <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-[#85181A]/80">
                Sujet sélectionné
              </span>
            </div>
            <p className="font-sans text-xs sm:text-sm text-[#1A1A1A] font-bold leading-snug">
              {category.name}
            </p>
          </div>
        )}
      </div>

      {/* ── Bas : Statut et informations ENCG ── */}
      <div className="flex flex-col items-center gap-2 pt-4 border-t border-[#E8DDD0]/80 w-full text-center">
        <div className="flex items-center gap-2 text-xs font-sans font-medium text-[#505050]">
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`} />
          <span>{isOnline ? 'Serveur connecté' : 'Mode hors ligne'}</span>
        </div>
        <p className="font-sans text-[10px] text-[#505050] opacity-70">
          ENCG Marrakech · Université Cadi Ayyad
        </p>
      </div>
    </motion.aside>
  )
}

