/**
 * DashboardLayout.jsx — Sidebar + Header premium NORA Admin
 * Logo ENCG Marrakech officiel, design raffiné
 */
import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  FolderOpen, MessageSquare, Cpu, LogOut, Menu,
  ChevronRight, AlertTriangle
} from 'lucide-react'
import { logout } from '../api/adminApi'

const NAV = [
  {
    to: '/categories',
    icon: FolderOpen,
    label: 'Catégories',
    desc: 'Gérer les thèmes',
  },
  {
    to: '/qas',
    icon: MessageSquare,
    label: 'Questions & Réponses',
    desc: 'Base de connaissances',
  },
]

export default function DashboardLayout({ children, user, pendingEmbeddings, onRegenerate, regenLoading }) {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Échap ferme la sidebar mobile
  useEffect(() => {
    if (!sidebarOpen) return
    const onKey = e => { if (e.key === 'Escape') setSidebarOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sidebarOpen])

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const Sidebar = () => (
    <aside className="flex flex-col h-full select-none"
      style={{ background: 'linear-gradient(180deg, var(--bordeaux-dark) 0%, var(--bordeaux) 60%, #6B1D1F 100%)' }}>

      {/* ── Logo ENCG ── */}
      <div className="px-5 pt-6 pb-5" style={{ borderBottom: '1px solid rgba(255,255,255,.1)' }}>
        <img
          src="/Logo ENCG couleur.png"
          alt="ENCG Marrakech"
          className="h-10 object-contain w-full"
          style={{ filter: 'brightness(0) invert(1)', objectPosition: 'left' }}
        />
        <div className="mt-3 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-white/50 text-xs font-medium">Administration NORA</span>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <p className="px-3 mb-3 text-white/35 text-[10px] font-bold uppercase tracking-[0.12em]">Navigation</p>
        {NAV.map(({ to, icon: Icon, label, desc }) => (
          <NavLink key={to} to={to} end onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-all duration-150 ${
                isActive
                  ? 'text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/8'
              }`
            }
            style={({ isActive }) => isActive ? { background: 'rgba(255,255,255,.16)', boxShadow: '0 1px 8px rgba(0,0,0,.15)' } : {}}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all"
              style={{ background: 'rgba(255,255,255,.1)' }}>
              <Icon size={15} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight">{label}</p>
              <p className="text-[11px] opacity-50 leading-tight truncate">{desc}</p>
            </div>
            <ChevronRight size={13} className="opacity-30 group-hover:opacity-60 transition-opacity" />
          </NavLink>
        ))}

        {/* Séparateur */}
        <div className="mx-3 my-4" style={{ height: '1px', background: 'rgba(255,255,255,.08)' }} />

        {/* Régénérer IA */}
        <p className="px-3 mb-3 text-white/35 text-[10px] font-bold uppercase tracking-[0.12em]">Actions</p>
        <button
          onClick={() => { setSidebarOpen(false); onRegenerate() }}
          disabled={regenLoading}
          className="w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-all duration-150 text-white/60 hover:text-white hover:bg-white/8 disabled:opacity-50"
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'rgba(255,255,255,.1)' }}>
            <Cpu size={15} className={regenLoading ? 'animate-spin' : ''} />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold leading-tight">
              {regenLoading ? 'Régénération…' : 'Régénérer l\'IA'}
            </p>
            <p className="text-[11px] opacity-50">Index sémantique</p>
          </div>
          {pendingEmbeddings && !regenLoading && (
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
          )}
        </button>
      </nav>

      {/* ── Profil & Déconnexion ── */}
      <div className="px-3 pb-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,.08)' }}>
        {user && (
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl mb-2"
            style={{ background: 'rgba(255,255,255,.08)' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
              style={{ background: 'var(--terracotta)' }}>
              {(user.full_name || user.email || '?')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user.full_name || 'Admin'}</p>
              <p className="text-white/45 text-[11px] truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/55 hover:text-red-300 hover:bg-red-900/20 transition-all text-sm font-medium">
          <LogOut size={15} />
          Déconnexion
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--cream)' }}>

      {/* Sidebar desktop */}
      <div className="hidden lg:flex flex-col w-64 shrink-0 shadow-lg" style={{ zIndex: 20 }}>
        <Sidebar />
      </div>

      {/* Sidebar mobile overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex animate-fade-in"
          role="dialog" aria-modal="true" aria-label="Menu de navigation">
          <div className="w-72 flex flex-col shadow-2xl animate-slide-left"><Sidebar /></div>
          <button className="flex-1 cursor-default" style={{ background: 'rgba(61,39,29,.55)' }}
            aria-label="Fermer le menu"
            onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── Header ── */}
        <header className="shrink-0 flex items-center gap-3 px-4 sm:px-6 py-3.5 bg-white"
          style={{ borderBottom: '1px solid var(--border)', boxShadow: '0 1px 4px rgba(61,39,29,.06)' }}>
          <button onClick={() => setSidebarOpen(true)} aria-label="Ouvrir le menu de navigation"
            className="lg:hidden w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors">
            <Menu size={18} style={{ color: 'var(--brown)' }} />
          </button>

          {/* Logo header mobile */}
          <img src="/Logo ENCG couleur.png" alt="ENCG" className="lg:hidden h-7 object-contain" />

          <div className="flex-1" />

          {/* Actions header */}
          <div className="flex items-center gap-2">
            {user && (
              <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl"
                style={{ background: 'var(--cream)', border: '1px solid var(--border)' }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: 'var(--bordeaux)' }}>
                  {(user.full_name || user.email || '?')[0].toUpperCase()}
                </div>
                <span className="text-xs font-semibold" style={{ color: 'var(--brown)' }}>
                  {user.full_name || user.email}
                </span>
              </div>
            )}
          </div>
        </header>

        {/* ── Bannière embeddings ── */}
        {pendingEmbeddings && (
          <div className="shrink-0 flex items-center gap-3 px-5 py-3"
            style={{ background: '#FFFBEB', borderBottom: '1px solid #FDE68A' }}>
            <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <AlertTriangle size={14} className="text-amber-600" />
            </div>
            <p className="text-sm font-medium text-amber-800 flex-1">
              Des modifications QA ne sont pas encore visibles dans les réponses IA.{' '}
              <button onClick={onRegenerate} disabled={regenLoading}
                className="underline underline-offset-2 font-semibold hover:text-amber-900 disabled:opacity-50 transition-colors">
                Régénérer l'index maintenant
              </button>
            </p>
            <span className="text-amber-500 text-xs shrink-0">⚡ Action requise</span>
          </div>
        )}

        {/* ── Contenu ── */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  )
}
