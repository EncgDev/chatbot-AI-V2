/**
 * DashboardLayout.jsx — Shell principal NORA Admin
 * Sidebar fixe desktop · overlay mobile · topbar avec search et breadcrumb
 */
import { useState, useCallback, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, FolderOpen, MessageSquare, Cpu, LogOut,
  Menu, X, Search, Bell, ChevronRight, AlertTriangle,
  RefreshCw, Settings, Shield
} from 'lucide-react'
import { logout } from '../api/adminApi'

/* ─── Config navigation ──────────────────────────────────────────── */
const NAV_ITEMS = [
  { to: '/',           icon: LayoutDashboard, label: 'Dashboard',               end: true },
  { to: '/categories', icon: FolderOpen,      label: 'Catégories',               end: false },
  { to: '/qas',        icon: MessageSquare,   label: 'Questions & Réponses',     end: false },
]

/* ─── Breadcrumb map ─────────────────────────────────────────────── */
const BC_MAP = {
  '/':           ['Dashboard'],
  '/categories': ['Dashboard', 'Catégories'],
  '/qas':        ['Dashboard', 'Questions & Réponses'],
}

/* ─── Sidebar Content (shared for desktop + mobile) ─────────────── */
function SidebarContent({ user, pendingEmbeddings, regenLoading, onRegenerate, onLogout, onNavClick }) {
  return (
    <div className="flex flex-col h-full">

      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--brand)', boxShadow: 'var(--shadow-pill)' }}>
            <Shield size={18} className="text-white" />
          </div>
          <div>
            <p className="font-display text-sm font-800 text-gray-900 leading-tight tracking-tight" style={{ fontWeight: 800 }}>NORA Admin</p>
            <p className="text-[10px] text-gray-400 font-medium tracking-wide uppercase leading-tight">ENCG Marrakech</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        <p className="px-2 mb-3 text-[10px] font-700 uppercase tracking-widest text-gray-400"
          style={{ fontWeight: 700 }}>Navigation</p>

        {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
          <NavLink key={to} to={to} end={end}
            onClick={onNavClick}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
          >
            {({ isActive }) => (
              <>
                <span className="nav-icon">
                  <Icon size={15} className={isActive ? 'text-white' : 'text-gray-500'} />
                </span>
                <span className="flex-1 text-sm">{label}</span>
                {!isActive && <ChevronRight size={12} className="opacity-40 flex-shrink-0" />}
              </>
            )}
          </NavLink>
        ))}

        {/* Separator */}
        <div className="my-4 mx-2 divider" />

        <p className="px-2 mb-3 text-[10px] font-700 uppercase tracking-widest text-gray-400"
          style={{ fontWeight: 700 }}>Actions IA</p>

        {/* Regen button */}
        <button
          onClick={() => { onNavClick?.(); onRegenerate() }}
          disabled={regenLoading}
          className={`nav-item w-full text-left ${pendingEmbeddings ? 'border-amber-200 bg-amber-50 !text-amber-800' : ''}`}
        >
          <span className={`nav-icon ${pendingEmbeddings ? '!bg-amber-100' : ''}`}>
            <Cpu size={15} className={`${regenLoading ? 'animate-spin-slow text-brand' : pendingEmbeddings ? 'text-amber-600' : 'text-gray-500'}`}
              style={{ color: pendingEmbeddings && !regenLoading ? '' : undefined }} />
          </span>
          <span className="flex-1 text-sm">
            {regenLoading ? 'Régénération…' : 'Régénérer l\'IA'}
          </span>
          {pendingEmbeddings && !regenLoading && (
            <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0 animate-pulse" />
          )}
        </button>
      </nav>

      {/* User card */}
      <div className="px-3 py-4 border-t border-gray-100 flex-shrink-0">
        {user && (
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gray-50 border border-gray-100 mb-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-mid) 100%)' }}>
              {(user.full_name || user.email || 'A')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">{user.full_name || 'Administrateur NORA'}</p>
              <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={onLogout}
          className="nav-item w-full hover:!text-red-600 hover:!bg-red-50"
        >
          <span className="nav-icon">
            <LogOut size={14} className="text-gray-400" />
          </span>
          <span className="text-sm">Déconnexion</span>
        </button>
      </div>
    </div>
  )
}

/* ─── Main Layout ────────────────────────────────────────────────── */
export default function DashboardLayout({ children, user, pendingEmbeddings, onRegenerate, regenLoading }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchVal, setSearchVal] = useState('')

  /* Close mobile on ESC */
  useEffect(() => {
    if (!mobileOpen) return
    const fn = e => { if (e.key === 'Escape') setMobileOpen(false) }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [mobileOpen])

  /* Lock body scroll when sidebar open */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

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

      {/* ── Mobile Sidebar Overlay ── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 animate-fade-in"
          role="dialog" aria-modal="true" aria-label="Menu navigation">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)} />
          {/* Panel */}
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col animate-slide-left">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <p className="font-display font-bold text-gray-900">NORA Admin</p>
              <button onClick={() => setMobileOpen(false)}
                className="btn btn-ghost btn-icon w-8 h-8">
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
          <button onClick={() => setMobileOpen(true)}
            className="lg:hidden btn btn-ghost btn-icon flex-shrink-0"
            aria-label="Ouvrir navigation">
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

          {/* Spacer */}
          <div className="flex-1" />

          {/* Search */}
          <form onSubmit={handleSearch} className="topbar-search hidden sm:flex">
            <Search size={14} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              placeholder="Rechercher une question, catégorie…"
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
              <RefreshCw size={15} className={regenLoading ? 'animate-spin-slow' : ''} />
              {pendingEmbeddings && !regenLoading && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500 border border-white" />
              )}
            </button>

            {/* ENCG Logo */}
            <img src="/Logo ENCG couleur.png" alt="ENCG Marrakech"
              className="h-8 w-auto object-contain hidden md:block" />

            {/* Avatar */}
            {user && (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-default flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-mid) 100%)', boxShadow: '0 2px 8px rgba(128,0,32,.25)' }}
                title={user.full_name || user.email}>
                {(user.full_name || user.email || 'A')[0].toUpperCase()}
              </div>
            )}
          </div>
        </header>

        {/* ── Pending Embeddings Banner ── */}
        {pendingEmbeddings && (
          <div className="flex-shrink-0 flex items-center gap-3 px-6 py-2.5 bg-amber-50 border-b border-amber-200/70 animate-slide-down">
            <AlertTriangle size={14} className="text-amber-600 flex-shrink-0" />
            <p className="text-xs font-medium text-amber-800 flex-1">
              Des modifications QA ne sont pas encore indexées dans l'IA —{' '}
              <button
                onClick={onRegenerate}
                disabled={regenLoading}
                className="font-bold underline underline-offset-2 hover:text-amber-900 disabled:opacity-50 transition-colors"
              >
                Régénérer l'index maintenant
              </button>
            </p>
            <span className="badge badge-warning text-[10px] flex-shrink-0">⚡ Action requise</span>
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
