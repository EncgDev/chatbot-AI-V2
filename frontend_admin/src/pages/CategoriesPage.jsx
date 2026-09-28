/**
 * CategoriesPage.jsx — Gestion des Catégories NORA Admin — Premium v3
 * KPI header · Grid de cards + Vue table · Modal inline pour édition
 * Note: remplace window.prompt() par un vrai modal d'édition
 */
import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import CategoriesTable from '../components/CategoriesTable'
import ConfirmDeleteModal from '../components/ConfirmDeleteModal'
import { listCategories, createCategory, updateCategory, deleteCategory } from '../api/adminApi'
import { showToast } from '../components/Toast'
import {
  Loader2, RefreshCw, FolderOpen, Hash, Plus,
  LayoutGrid, Table2, TrendingUp, X, Check, Edit3,
  Sparkles, Tag, AlertCircle, Trash2, MessageSquare, BookOpen,
} from 'lucide-react'

/* ─── Color palettes ─────────────────────────────────────────────── */
const CAT_ACCENTS = [
  '#800020', '#C85A32', '#2563EB', '#0D9488', '#7C3AED',
  '#DB2777', '#D97706', '#16A34A', '#0891B2', '#EA580C',
]
const CAT_BG = [
  '#FEF0F3', '#FFF7ED', '#EFF6FF', '#F0FDFA', '#F5F3FF',
  '#FDF2F8', '#FFFBEB', '#F0FDF4', '#ECFEFF', '#FFF7ED',
]

/* ─── Edit/Create Category Modal ─────────────────────────────────── */
function CategoryFormModal({ isOpen, onClose, onSubmit, editData, loading }) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setName(editData?.name ?? '')
      setError('')
    }
  }, [isOpen, editData])

  useEffect(() => {
    if (!isOpen) return
    const fn = e => { if (e.key === 'Escape' && !loading) onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [isOpen, loading, onClose])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) { setError('Le nom de la catégorie est requis.'); return }
    setError('')
    await onSubmit(editData?.id ?? null, name.trim())
  }

  if (!isOpen) return null

  return createPortal(
    <div
      className="cat-edit-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cat-modal-title"
      onClick={e => { if (e.target === e.currentTarget && !loading) onClose() }}
    >
      <div className="cat-edit-box animate-scale-in">

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-gray-100" style={{ padding: '18px 22px' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--brand-soft)' }}>
            <Tag size={16} style={{ color: 'var(--brand)' }} />
          </div>
          <div className="flex-1">
            <h2 id="cat-modal-title" className="text-[15px] font-bold text-gray-900 font-display">
              {editData ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {editData
                ? `Renommer « ${editData.name} »`
                : 'Créer un nouveau thème dans la base NORA'}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="btn btn-ghost btn-icon w-8 h-8 rounded-lg"
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 22px 18px' }}>
          <div className="mb-4">
            <label htmlFor="cat-name" className="form-label form-label-required">
              Nom de la catégorie
            </label>
            <input
              id="cat-name"
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); if (error) setError('') }}
              placeholder="Ex: Admission & Inscriptions"
              className={`input-base ${error ? 'error' : ''}`}
              disabled={loading}
              autoFocus
            />
            {error && (
              <p className="form-error mt-1.5">
                <AlertCircle size={12} /> {error}
              </p>
            )}
            <p className="form-hint mt-1.5">
              Le nom identifie le thème dans la base de connaissances de NORA.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn btn-secondary px-3.5 py-2 text-xs"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary px-4 py-2 text-xs"
            >
              {loading
                ? <><Loader2 size={13} className="animate-spin-slow" /> Enregistrement…</>
                : <><Check size={13} /> {editData ? 'Mettre à jour' : 'Créer la catégorie'}</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

/* ─── Category Card ─────────────────────────────────────────────── */
function CategoryCard({ cat, idx, totalQAs = 0, onEdit, onDelete }) {
  const accent  = CAT_ACCENTS[idx % CAT_ACCENTS.length]
  const bg      = CAT_BG[idx % CAT_BG.length]
  const initial = (cat.name || '?')[0].toUpperCase()
  const canDelete = (cat.qa_count ?? 0) === 0
  const count   = cat.qa_count ?? 0
  const pct     = totalQAs > 0 ? Math.round((count / totalQAs) * 100) : 0

  return (
    <div
      className="cat-card group animate-fade-up flex flex-col justify-between"
      style={{ '--cat-accent': accent, animationDelay: `${idx * 30}ms` }}
    >
      {/* Action buttons (floating top-right on hover) */}
      <div className="cat-actions">
        <button
          onClick={() => onEdit(cat)}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          title="Modifier la catégorie"
          aria-label="Modifier"
        >
          <Edit3 size={13} />
        </button>
        <button
          onClick={() => canDelete && onDelete(cat)}
          disabled={!canDelete}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title={canDelete ? 'Supprimer' : `${count} QA(s) associé(s)`}
          aria-label="Supprimer"
        >
          <Trash2 size={13} />
        </button>
      </div>

      <div>
        {/* Top section: Avatar + Title & Status */}
        <div className="flex items-start gap-3.5 mb-4">
          {/* Avatar */}
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-black text-base flex-shrink-0 shadow-xs"
            style={{ background: `linear-gradient(135deg, ${accent} 0%, ${accent}dd 100%)` }}
          >
            {initial}
          </div>

          {/* Name & status */}
          <div className="flex-1 min-w-0 pr-6">
            <h3
              className="text-[14.5px] font-bold text-gray-900 leading-snug line-clamp-2 min-h-[38px] group-hover:text-brand transition-colors"
              title={cat.name}
            >
              {cat.name}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: count > 0 ? '#10B981' : '#94A3B8' }}
              />
              <span className="text-[11px] font-semibold text-gray-500">
                {count > 0 ? 'Thème actif' : 'En attente de Q&R'}
              </span>
            </div>
          </div>
        </div>

        {/* Professional Knowledge Metric Banner */}
        <div
          className="p-4 rounded-xl border flex items-center justify-between mb-4 transition-all group-hover:border-gray-300"
          style={{
            backgroundColor: count > 0 ? bg : '#F8FAFC',
            borderColor: count > 0 ? `${accent}25` : '#E2E8F0',
          }}
        >
          <div className="flex items-center gap-3.5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-2xs flex-shrink-0"
              style={{ color: accent }}
            >
              <MessageSquare size={17} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Base de données
              </p>
              <p className="text-base font-black text-gray-900 leading-tight mt-0.5">
                {count} <span className="text-xs font-semibold text-gray-500">QA{count !== 1 ? 's' : ''}</span>
              </p>
            </div>
          </div>

          {/* Knowledge Share Percentage */}
          <div className="text-right">
            <span
              className="text-xs font-black px-2.5 py-1 rounded-lg bg-white shadow-2xs border border-gray-100/80 inline-block"
              style={{ color: accent }}
            >
              {pct}%
            </span>
            <p className="text-[10px] text-gray-400 font-medium mt-0.5">du savoir</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3.5 border-t border-gray-100 text-xs">
        <span className="text-gray-500 font-medium flex items-center gap-1.5 text-[11.5px]">
          <BookOpen size={12} className="text-gray-400" />
          {count > 0 ? `${count} question${count > 1 ? 's' : ''} indexée${count > 1 ? 's' : ''}` : 'Aucune entrée'}
        </span>
        {!canDelete ? (
          <span className="text-[10.5px] text-amber-700 font-semibold flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
            <AlertCircle size={10} /> Protégée
          </span>
        ) : (
          <span className="text-[10.5px] text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
            ✓ Supprimable
          </span>
        )}
      </div>
    </div>
  )
}

/* ─── KPI Mini Card ─────────────────────────────────────────────── */
function KpiCard({ icon: Icon, iconBg, iconColor, value, label, sub }) {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-4.5 border border-gray-100 shadow-sm flex items-center gap-3.5 hover:shadow-md transition-shadow">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: iconBg }}
      >
        <Icon size={20} style={{ color: iconColor }} />
      </div>
      <div>
        <p className="text-2xl font-extrabold text-gray-900 font-display leading-none">{value}</p>
        <p className="text-xs font-bold text-gray-700 mt-1">{label}</p>
        <p className="text-[11px] text-gray-400">{sub}</p>
      </div>
    </div>
  )
}

/* ─── Main Page Component ────────────────────────────────────────── */
export default function CategoriesPage({ onQAChange }) {
  const [categories, setCategories]     = useState([])
  const [loading, setLoading]           = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [viewMode, setViewMode]         = useState('grid')

  /* Category form modal state */
  const [formOpen, setFormOpen]         = useState(false)
  const [formEdit, setFormEdit]         = useState(null) // null = create, obj = edit

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listCategories()
      setCategories(res.data ?? [])
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  /* Open modal */
  const openCreate = () => { setFormEdit(null); setFormOpen(true) }
  const openEdit   = cat => { setFormEdit(cat); setFormOpen(true) }
  const closeForm  = () => { setFormOpen(false); setFormEdit(null) }

  /* CRUD */
  const handleFormSubmit = async (id, name) => {
    setActionLoading(true)
    try {
      if (id) {
        await updateCategory(id, name)
        showToast('✓ Catégorie mise à jour avec succès.', 'success')
      } else {
        await createCategory(name)
        showToast('✓ Catégorie créée avec succès.', 'success')
      }
      closeForm()
      await load()
      onQAChange?.()
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setActionLoading(true)
    try {
      await deleteCategory(deleteTarget.id)
      showToast('✓ Catégorie supprimée.', 'success')
      setDeleteTarget(null)
      await load()
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const totalQAs = categories.reduce((s, c) => s + (c.qa_count ?? 0), 0)
  const avgQAs   = categories.length > 0 ? (totalQAs / categories.length).toFixed(1) : '—'

  return (
    <div className="flex flex-col gap-6 sm:gap-7 lg:gap-8 animate-fade-up max-w-[1440px] mx-auto">

      {/* ── Page Header ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm" style={{ padding: '26px 32px' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10.5px] font-bold mb-2.5"
              style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}>
              <Sparkles size={10} />
              Base de connaissances NORA
            </div>
            <h1 className="page-title">Gestion des Catégories</h1>
            <p className="page-subtitle">
              Organisez les thèmes académiques de l'assistant intelligent NORA
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={load}
              disabled={loading}
              className="btn btn-secondary btn-icon rounded-xl"
              title="Actualiser"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin-slow' : ''} />
            </button>
            <button
              onClick={openCreate}
              className="btn btn-primary rounded-xl px-4 py-2 text-xs font-bold"
            >
              <Plus size={14} />
              Nouvelle catégorie
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Row ── */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 animate-fade-up delay-75">
          <KpiCard
            icon={FolderOpen}
            iconBg="var(--kpi-blue-bg)"
            iconColor="var(--kpi-blue-icon)"
            value={categories.length}
            label="Catégories Actives"
            sub="thèmes configurés"
          />
          <KpiCard
            icon={Hash}
            iconBg="var(--kpi-green-bg)"
            iconColor="var(--kpi-green-icon)"
            value={totalQAs}
            label="Questions (QAs)"
            sub="total dans la base"
          />
          <KpiCard
            icon={TrendingUp}
            iconBg="var(--kpi-purple-bg)"
            iconColor="var(--kpi-purple-icon)"
            value={avgQAs}
            label="Moyenne QAs / Thème"
            sub="densité de connaissances"
          />
        </div>
      )}

      {/* ── Content Card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-up delay-100">

        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-gray-100 flex-wrap gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--brand-soft)' }}>
              <FolderOpen size={19} style={{ color: 'var(--brand)' }} />
            </div>
            <div>
              <h2 className="text-base sm:text-[17px] font-extrabold text-gray-900 font-display leading-tight">
                Liste des catégories
              </h2>
              <p className="text-xs sm:text-[13px] text-gray-400 font-medium mt-0.5">
                {loading ? 'Chargement…' : `${categories.length} catégorie${categories.length !== 1 ? 's' : ''} active${categories.length !== 1 ? 's' : ''} dans NORA`}
              </p>
            </div>
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <LayoutGrid size={13} /> Grille
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Table2 size={13} /> Tableau
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-10 flex items-center justify-center gap-3 text-gray-400">
            <Loader2 size={22} className="animate-spin-slow" style={{ color: 'var(--brand)' }} />
            <span className="text-sm font-medium">Chargement des catégories…</span>
          </div>
        ) : categories.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <FolderOpen size={28} />
            </div>
            <p className="empty-state-title">Aucune catégorie</p>
            <p className="empty-state-desc">
              Créez votre première catégorie pour organiser la base de connaissances de NORA.
            </p>
            <button onClick={openCreate} className="btn btn-primary mt-6">
              <Plus size={14} /> Créer la première catégorie
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="p-6 sm:p-8 cat-grid">
            {categories.map((cat, i) => (
              <CategoryCard
                key={cat.id}
                cat={cat}
                idx={i}
                totalQAs={totalQAs}
                onEdit={openEdit}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        ) : (
          <CategoriesTable
            categories={categories}
            onSave={(id, name) => handleFormSubmit(id, name)}
            onDelete={setDeleteTarget}
            loading={actionLoading}
            onEdit={openEdit}
          />
        )}
      </div>

      {/* ── Modals ── */}
      <CategoryFormModal
        isOpen={formOpen}
        onClose={closeForm}
        onSubmit={handleFormSubmit}
        editData={formEdit}
        loading={actionLoading}
      />

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={actionLoading}
        title="Supprimer la catégorie"
        description={
          deleteTarget
            ? `Supprimer définitivement la catégorie « ${deleteTarget.name} » ? Cette action supprimera également tous ses QAs associés.`
            : ''
        }
      />
    </div>
  )
}
