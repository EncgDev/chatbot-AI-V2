/**
 * DashboardLayout.jsx — Shell principal NORA Admin — UI/UX Premium v3
 * Sidebar avec gradient brand · Topbar élevé · Badges notification
 */
import { useState, useCallback, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, FolderOpen, MessageSquare, Cpu, LogOut,
  Menu, X, Search, ChevronRight, AlertTriangle,
  RefreshCw, Shield, Zap, Bell,
} from 'lucide-react'
import { logout } from '../api/adminApi'

/* ─── Navigation items ─────────────────────────────────────────── */
const NAV_ITEMS = [
  { to: '/',           icon: LayoutDashboard, label: 'Dashboard',           end: true },
  { to: '/categories', icon: FolderOpen,      label: 'Catégories',          end: false },
  { to: '/qas',        icon: MessageSquare,   label: 'Questions & Réponses', end: false },
]

const BC_MAP = {
  '/':           ['Dashboard'],
  '/categories': ['Dashboard', 'Catégories'],
  '/qas':        ['Dashboard', 'Questions & Réponses'],
}

/* ─── Sidebar Content ───────────────────────────────────────────── */
function SidebarContent({ user, pendingEmbeddings, regenLoading, onRegenerate, onLogout, onNavClick }) {
  return (
    <div className="flex flex-col h-full">

      {/* ── Brand header ── */}
      <div style={{
        padding: '20px 18px 16px',
        borderBottom: '1px solid #F1F5F9',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 11,
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 11, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg, #800020 0%, #9A0B2E 100%)',
          boxShadow: '0 4px 12px rgba(128,0,32,.30)',
        }}>
          <Shield size={18} style={{ color: 'white' }} />
        </div>
        <div>
          <p style={{
            fontFamily: "'Plus Jakarta Sans', Inter, sans-serif",
            fontSize: 14, fontWeight: 800,
            color: '#0F172A', lineHeight: 1.1, letterSpacing: -0.3,
          }}>
            NORA Admin
          </p>
          <p style={{
            fontSize: 9.5, fontWeight: 600,
            color: '#94A3B8', letterSpacing: '0.12em',
            textTransform: 'uppercase', marginTop: 2,
          }}>
            ENCG Marrakech
          </p>
        </div>
      </div>

      {/* ── Nav items ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 flex flex-col gap-5">
        {/* Main nav */}
        <div>
          <p className="nav-section-label">Navigation</p>
          <div className="space-y-0.5">
            {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
              <NavLink
                key={to} to={to} end={end}
                onClick={onNavClick}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                {({ isActive }) => (
                  <>
                    <span className="nav-icon">
                      <Icon size={15} className={isActive ? 'text-white' : 'text-gray-500'} />
                    </span>
                    <span className="flex-1 text-[13.5px]">{label}</span>
                    {!isActive && (
                      <ChevronRight size={12} className="opacity-30 flex-shrink-0" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>

        {/* IA Actions */}
        <div>
          <p className="nav-section-label">Intelligence Artificielle</p>
          <button
            onClick={() => { onNavClick?.(); onRegenerate() }}
            disabled={regenLoading}
            className={`nav-item w-full text-left transition-all ${
              pendingEmbeddings
                ? 'bg-amber-50 border-amber-200 !text-amber-800 hover:!bg-amber-100'
                : ''
            }`}
          >
            <span className={`nav-icon ${pendingEmbeddings ? '!bg-amber-100' : ''}`}>
              <Cpu
                size={15}
                className={
                  regenLoading
                    ? 'animate-spin-slow text-brand'
                    : pendingEmbeddings
                    ? 'text-amber-600'
                    : 'text-gray-500'
                }
              />
            </span>
            <span className="flex-1 text-[13.5px]">
              {regenLoading ? 'Régénération…' : 'Régénérer l\'index IA'}
            </span>
            {pendingEmbeddings && !regenLoading && (
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Requis
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* ── User Account Widget (Bottom-Left) ── */}
      <div className="p-3.5 pb-4 flex-shrink-0 border-t border-gray-100 bg-gradient-to-b from-transparent to-gray-50/70">
        {user && (
          <div className="p-3 rounded-2xl bg-white border border-gray-200/80 shadow-xs mb-2.5 transition-all hover:border-gray-300">
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-xs"
                  style={{
                    background: 'linear-gradient(135deg, var(--brand) 0%, #A3123B 100%)',
                  }}
                >
                  {(user.full_name || user.email || 'A')[0].toUpperCase()}
                </div>
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white"
                  title="En ligne"
                />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-gray-900 truncate leading-tight">
                  {user.full_name || 'Administrateur'}
                </p>
                <p className="text-[11px] text-gray-400 truncate mt-0.5 font-medium">
                  {user.email}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-gray-100">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand bg-brand/8 px-2 py-0.5 rounded-md">
                Admin ENCG
              </span>
              <span className="text-[10.5px] font-semibold text-emerald-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Connecté
              </span>
            </div>
          </div>
        )}

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:text-red-600 hover:bg-red-50/80 border border-transparent hover:border-red-200/60 transition-all duration-150 group cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <LogOut size={14} className="text-gray-400 group-hover:text-red-500 transition-colors" />
            <span>Déconnexion</span>
          </span>
          <span className="text-[10px] text-gray-400 group-hover:text-red-500 font-semibold uppercase tracking-wider">
            Quitter
          </span>
        </button>
      </div>
    </div>
  )
}

/* ─── Main Layout ───────────────────────────────────────────────── */
export default function DashboardLayout({ children, user, pendingEmbeddings, onRegenerate, regenLoading }) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchVal, setSearchVal]   = useState('')

  useEffect(() => {
    if (!mobileOpen) return
    const fn = e => { if (e.key === 'Escape') setMobileOpen(false) }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [mobileOpen])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  // Close mobile on route change
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  const handleLogout = useCallback(async () => {
    await logout()
    navigate('/login', { replace: true })
  }, [navigate])

  const handleSearch = e => {
    e.preventDefault()
    if (searchVal.trim()) navigate(`/qas?search=${encodeURIComponent(searchVal.trim())}`)
  }

  const crumbs = BC_MAP[location.pathname] ?? ['Dashboard']

  return (
    <div className="admin-shell">

      {/* ── Desktop Sidebar ── */}
      <aside className="admin-sidebar hidden lg:flex flex-col">
        <SidebarContent
          user={user}
          pendingEmbeddings={pendingEmbeddings}
          regenLoading={regenLoading}
          onRegenerate={onRegenerate}
          onLogout={handleLogout}
        />
      </aside>

      {/* ── Mobile Overlay ── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 animate-fade-in"
          role="dialog" aria-modal="true" aria-label="Menu navigation"
        >
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col animate-slide-left">
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="sidebar-brand-icon w-8 h-8 rounded-lg">
                  <Shield size={15} className="text-white" />
                </div>
                <p className="font-display font-bold text-gray-900 text-sm">NORA Admin</p>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="btn btn-ghost btn-icon w-8 h-8"
                aria-label="Fermer le menu"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SidebarContent
                user={user}
                pendingEmbeddings={pendingEmbeddings}
                regenLoading={regenLoading}
                onRegenerate={onRegenerate}
                onLogout={handleLogout}
                onNavClick={() => setMobileOpen(false)}
              />
            </div>
          </aside>
        </div>
      )}

      {/* ── Main Area ── */}
      <div className="admin-main">

        {/* ── Top Bar ── */}
        <header className="admin-topbar">

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden btn btn-ghost btn-icon flex-shrink-0"
            aria-label="Ouvrir la navigation"
          >
            <Menu size={18} />
          </button>

          {/* Breadcrumbs */}
          <nav className="breadcrumb flex-shrink-0 hidden sm:flex">
            {crumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight size={12} className="breadcrumb-sep" />}
                <span className={i === crumbs.length - 1 ? 'breadcrumb-current' : ''}>
                  {c}
                </span>
              </span>
            ))}
          </nav>

          <div className="flex-1" />

          {/* Search */}
          <form onSubmit={handleSearch} className="topbar-search hidden sm:flex">
            <Search size={14} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              placeholder="Rechercher…"
            />
          </form>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">

            {/* Regen shortcut */}
            <button
              onClick={onRegenerate}
              disabled={regenLoading}
              title="Régénérer l'index IA"
              className="btn btn-ghost btn-icon relative"
            >
              <RefreshCw size={15} className={regenLoading ? 'animate-spin-slow text-brand' : 'text-gray-500'} />
              {pendingEmbeddings && !regenLoading && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-white animate-pulse" />
              )}
            </button>

            {/* ENCG Logo */}
            <img
              src="/Logo ENCG couleur.png"
              alt="ENCG Marrakech"
              className="h-8 w-auto object-contain hidden md:block"
            />

            {/* Avatar */}
            {user && (
              <div
                className="user-avatar cursor-default"
                title={user.full_name || user.email}
              >
                {(user.full_name || user.email || 'A')[0].toUpperCase()}
              </div>
            )}
          </div>
        </header>

        {/* ── Pending Embeddings Banner ── */}
        {pendingEmbeddings && (
          <div className="embed-banner">
            <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Zap size={14} className="text-amber-600 animate-pulse" />
            </div>
            <p className="text-xs font-semibold text-amber-900 flex-1">
              Des modifications QA ne sont pas encore synchronisées avec l'IA —{' '}
              <button
                onClick={onRegenerate}
                disabled={regenLoading}
                className="font-bold underline underline-offset-2 hover:text-amber-700 disabled:opacity-50 transition-colors"
              >
                Régénérer l'index maintenant
              </button>
            </p>
            <span className="badge badge-amber text-[10px] flex-shrink-0 gap-1.5">
              <AlertTriangle size={9} />
              Action requise
            </span>
          </div>
        )}

        {/* ── Page Content ── */}
        <main className="admin-content">
          {children}
        </main>
      </div>
    </div>
  )
}
