/**
 * CategoriesPage.jsx — Gestion des Catégories NORA Admin
 * KPI header · Grid de cards + Vue table · Inline edit
 */
import { useState, useEffect, useCallback } from 'react'
import CategoriesTable from '../components/CategoriesTable'
import ConfirmDeleteModal from '../components/ConfirmDeleteModal'
import { listCategories, createCategory, updateCategory, deleteCategory } from '../api/adminApi'
import { showToast } from '../components/Toast'
import {
  Loader2, RefreshCw, FolderOpen, Hash, Plus,
  LayoutGrid, Table2, TrendingUp
} from 'lucide-react'

/* ─── Category Card (grid view) ─────────────────────────────────── */
const CAT_ACCENTS = [
  '#800020', '#C85A32', '#2563EB', '#0D9488', '#7C3AED',
  '#DB2777', '#D97706', '#16A34A', '#0891B2', '#EA580C',
]
const CAT_BG = [
  '#FEF0F3', '#FFF7ED', '#EFF6FF', '#F0FDFA', '#F5F3FF',
  '#FDF2F8', '#FFFBEB', '#F0FDF4', '#ECFEFF', '#FFF7ED',
]

function CategoryCard({ cat, idx, onEdit, onDelete }) {
  const accent = CAT_ACCENTS[idx % CAT_ACCENTS.length]
  const bg     = CAT_BG[idx % CAT_BG.length]
  const initial = (cat.name || '?')[0].toUpperCase()
  const canDelete = (cat.qa_count ?? 0) === 0

  return (
    <div className="cat-card" style={{ '--cat-accent': accent }}>
      {/* Icon + name */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0"
          style={{ background: accent }}>
          {initial}
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <h3 className="text-sm font-bold text-gray-900 leading-tight truncate" title={cat.name}>
            {cat.name}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">Catégorie NORA</p>
        </div>
        {/* Actions appear on hover */}
        <div className="cat-actions flex-shrink-0">
          <button
            onClick={() => onEdit(cat)}
            className="btn btn-ghost btn-icon w-7 h-7 rounded-lg"
            title="Modifier"
            aria-label={`Modifier ${cat.name}`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button
            onClick={() => canDelete && onDelete(cat)}
            disabled={!canDelete}
            className="btn btn-ghost btn-icon w-7 h-7 rounded-lg hover:!bg-red-50 hover:!text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
            title={canDelete ? 'Supprimer' : `${cat.qa_count} QA(s) associés — suppression impossible`}
            aria-label={`Supprimer ${cat.name}`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6m4-6v6"/><path d="M9 6V4h6v2"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3">
        <div className="flex-1 px-3 py-2 rounded-xl text-center" style={{ background: bg }}>
          <p className="text-lg font-extrabold" style={{ color: accent }}>{cat.qa_count ?? 0}</p>
          <p className="text-[10px] text-gray-500 font-medium leading-tight">Question{(cat.qa_count ?? 0) !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex-1 px-3 py-2 rounded-xl text-center bg-gray-50">
          <p className="text-lg font-extrabold text-gray-700">#{cat.id}</p>
          <p className="text-[10px] text-gray-400 font-medium leading-tight">ID</p>
        </div>
      </div>

      {/* Bottom tag */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <span className="text-[10px] text-gray-400 font-medium">
          {(cat.qa_count ?? 0) > 0 ? `${cat.qa_count} QAs indexés` : 'Aucun QA associé'}
        </span>
        <span className="badge" style={{ background: bg, color: accent }}>
          {(cat.qa_count ?? 0) > 0 ? 'Actif' : 'Vide'}
        </span>
      </div>
    </div>
  )
}

/* ─── Main Component ─────────────────────────────────────────────── */
export default function CategoriesPage() {
  const [categories, setCategories]   = useState([])
  const [loading, setLoading]         = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [deleteTarget, setDeleteTarget]   = useState(null)
  const [viewMode, setViewMode]       = useState('grid') // 'grid' | 'table'

  /* Inline new category form state */
  const [showNewForm, setShowNewForm] = useState(false)
  const [newName, setNewName]         = useState('')
  const [newErr, setNewErr]           = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listCategories()
      setCategories(res.data ?? [])
    } catch (e) { showToast(e.message, 'error') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  /* CRUD handlers */
  const handleSave = async (id, name) => {
    setActionLoading(true)
    try {
      if (id) { await updateCategory(id, name); showToast('✓ Catégorie mise à jour.') }
      else     { await createCategory(name);     showToast('✓ Catégorie créée.') }
      await load()
    } finally { setActionLoading(false) }
  }

  const handleNewSubmit = async () => {
    if (!newName.trim()) { setNewErr('Le nom est requis.'); return }
    setActionLoading(true)
    try {
      await createCategory(newName.trim())
      showToast('✓ Catégorie créée.')
      setNewName(''); setNewErr(''); setShowNewForm(false)
      await load()
    } catch (e) { setNewErr(e.message) }
    finally { setActionLoading(false) }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setActionLoading(true)
    try {
      await deleteCategory(deleteTarget.id)
      showToast('✓ Catégorie supprimée.')
      setDeleteTarget(null)
      await load()
    } catch (e) { showToast(e.message, 'error') }
    finally { setActionLoading(false) }
  }

  const totalQAs = categories.reduce((s, c) => s + (c.qa_count ?? 0), 0)

  return (
    <div className="space-y-8 md:space-y-10 pb-16 animate-fade-up max-w-[1440px] mx-auto">

      {/* ── Page Header ── */}
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 font-display tracking-tight">
            Gestion des Catégories
          </h1>
          <p className="text-xs md:text-sm text-gray-400 mt-1">
            Organisez la base de connaissances de l'IA NORA par thèmes académiques
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={load}
            disabled={loading}
            className="btn btn-secondary btn-icon rounded-xl"
            title="Actualiser"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin-slow' : ''} />
          </button>
          <button
            onClick={() => { setShowNewForm(true); setNewName(''); setNewErr('') }}
            disabled={showNewForm}
            className="btn btn-primary rounded-xl px-4 py-2.5 text-xs font-bold"
          >
            <Plus size={15} />
            Nouvelle catégorie
          </button>
        </div>
      </div>

      {/* ── KPI Row ── */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--kpi-blue-bg)' }}>
              <FolderOpen size={22} style={{ color: 'var(--kpi-blue-icon)' }} />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900 font-display">{categories.length}</p>
              <p className="text-xs font-bold text-gray-700">Catégories Actives</p>
              <p className="text-[11px] text-gray-400">thèmes configurés</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--kpi-green-bg)' }}>
              <Hash size={22} style={{ color: 'var(--kpi-green-icon)' }} />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900 font-display">{totalQAs}</p>
              <p className="text-xs font-bold text-gray-700">Questions (QAs)</p>
              <p className="text-[11px] text-gray-400">au total dans la BDD</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--kpi-purple-bg)' }}>
              <TrendingUp size={22} style={{ color: 'var(--kpi-purple-icon)' }} />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900 font-display">
                {categories.length > 0 ? (totalQAs / categories.length).toFixed(1) : '—'}
              </p>
              <p className="text-xs font-bold text-gray-700">Moyenne QAs / Thème</p>
              <p className="text-[11px] text-gray-400">densité de connaissances</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Content Card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--brand-soft)' }}>
              <FolderOpen size={16} style={{ color: 'var(--brand)' }} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">Liste des catégories</p>
              <p className="text-xs text-gray-400">
                {loading ? 'Chargement…' : `${categories.length} catégorie${categories.length !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <LayoutGrid size={13} /> Grille
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Table2 size={13} /> Tableau
            </button>
          </div>
        </div>

        {/* Inline new-category form */}
        {showNewForm && (
          <div className="px-5 py-3 border-b border-amber-100 bg-amber-50/50 animate-slide-down">
            <div className="flex items-center gap-3 max-w-lg">
              <input
                autoFocus
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleNewSubmit()
                  if (e.key === 'Escape') { setShowNewForm(false); setNewErr('') }
                }}
                placeholder="Nom de la nouvelle catégorie…"
                className={`input-base flex-1 ${newErr ? 'error' : ''}`}
              />
              <button
                onClick={handleNewSubmit}
                disabled={actionLoading}
                className="btn btn-primary text-xs px-4"
              >
                {actionLoading ? <Loader2 size={14} className="animate-spin-slow" /> : 'Créer'}
              </button>
              <button
                onClick={() => { setShowNewForm(false); setNewErr('') }}
                className="btn btn-secondary btn-icon"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            {newErr && <p className="text-xs text-red-600 font-medium mt-2">⚠ {newErr}</p>}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="p-8 flex items-center justify-center gap-3 text-gray-400">
            <Loader2 size={22} className="animate-spin-slow" style={{ color: 'var(--brand)' }} />
            <span className="text-sm font-medium">Chargement des catégories…</span>
          </div>
        ) : categories.length === 0 && !showNewForm ? (
          <div className="p-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <FolderOpen size={24} className="text-gray-400" />
            </div>
            <p className="text-base font-bold text-gray-700">Aucune catégorie</p>
            <p className="text-sm text-gray-400 mt-1">Créez votre première catégorie pour organiser les QAs.</p>
            <button
              onClick={() => { setShowNewForm(true); setNewName('') }}
              className="btn btn-primary mt-5"
            >
              <Plus size={14} /> Nouvelle catégorie
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="p-5 cat-grid">
            {categories.map((cat, i) => (
              <CategoryCard
                key={cat.id}
                cat={cat}
                idx={i}
                onEdit={cat => {
                  const name = window.prompt(`Renommer « ${cat.name} » :`, cat.name)
                  if (name && name.trim() && name.trim() !== cat.name) {
                    handleSave(cat.id, name.trim())
                  }
                }}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        ) : (
          <CategoriesTable
            categories={categories}
            onSave={handleSave}
            onDelete={setDeleteTarget}
            loading={actionLoading}
          />
        )}
      </div>

      {/* Delete Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={actionLoading}
        title="Supprimer la catégorie"
        description={deleteTarget ? `Supprimer définitivement la catégorie « ${deleteTarget.name} » ?` : ''}
      />
    </div>
  )
}
