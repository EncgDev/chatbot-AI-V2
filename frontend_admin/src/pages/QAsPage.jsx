/**
 * QAsPage.jsx — Gestion Q&R NORA Admin — Premium v3
 * KPI · Filtres avancés · Table paginée avec expanded rows · Modal
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import QAsTable from '../components/QAsTable'
import QAFormModal from '../components/QAFormModal'
import ConfirmDeleteModal from '../components/ConfirmDeleteModal'
import { listQAs, listCategories, createQA, updateQA, deleteQA } from '../api/adminApi'
import { showToast } from '../components/Toast'
import {
  Loader2, Plus, RefreshCw, Search, MessageSquare,
  FolderOpen, ChevronLeft, ChevronRight, X, Filter,
  Sparkles, FileText, SlidersHorizontal,
} from 'lucide-react'

const PAGE_SIZE = 10

/* ─── Pagination ─────────────────────────────────────────────────── */
function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null

  const pages = []
  const delta = 1
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…')
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="btn btn-secondary btn-icon w-8 h-8 rounded-lg disabled:opacity-40"
      >
        <ChevronLeft size={14} />
      </button>
      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`e${i}`} className="text-xs text-gray-400 px-1">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
              p === page
                ? 'text-white shadow-sm'
                : 'btn btn-ghost text-gray-600 hover:bg-gray-100'
            }`}
            style={p === page ? { background: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-mid) 100%)' } : {}}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="btn btn-secondary btn-icon w-8 h-8 rounded-lg disabled:opacity-40"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  )
}

/* ─── KPI Card ───────────────────────────────────────────────────── */
function KpiCard({ icon: Icon, iconBg, iconColor, value, label, sub, accent }) {
  return (
    <div
      className="bg-white rounded-2xl p-4 sm:p-4.5 border border-gray-100 shadow-sm flex items-center gap-3.5 hover:shadow-md transition-all hover:-translate-y-0.5 cursor-default"
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: iconBg }}
      >
        <Icon size={20} style={{ color: iconColor }} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-extrabold text-gray-900 font-display leading-none">{value}</p>
        <p className="text-xs font-bold text-gray-700 mt-1 truncate">{label}</p>
        <p className="text-[11px] text-gray-400">{sub}</p>
      </div>
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────────────────── */
export default function QAsPage({ onQAChange }) {
  const [qas, setQas]                   = useState([])
  const [categories, setCategories]     = useState([])
  const [loading, setLoading]           = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const [search, setSearch]             = useState('')
  const [filterCat, setFilterCat]       = useState('')
  const [page, setPage]                 = useState(1)

  const [modalOpen, setModalOpen]       = useState(false)
  const [editQA, setEditQA]             = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const searchRef = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [qRes, cRes] = await Promise.all([listQAs(), listCategories()])
      setQas(qRes.data ?? [])
      setCategories(cRes.data ?? [])
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  /* Filter */
  const filtered = qas.filter(q => {
    const s = search.toLowerCase()
    const matchText = !s || q.question?.toLowerCase().includes(s) || q.response?.toLowerCase().includes(s)
    const matchCat  = !filterCat || String(q.category_id) === filterCat
    return matchText && matchCat
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages)
  const pageItems  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  useEffect(() => setPage(1), [search, filterCat])

  /* CRUD */
  const handleSave = async data => {
    setActionLoading(true)
    try {
      if (editQA) {
        await updateQA(editQA.id, data)
        showToast('✓ QA mis à jour avec succès.', 'success')
      } else {
        await createQA(data)
        showToast('✓ QA créé avec succès.', 'success')
      }
      setModalOpen(false)
      setEditQA(null)
      onQAChange?.()
      await load()
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
      await deleteQA(deleteTarget.id)
      showToast('✓ QA supprimé.', 'success')
      setDeleteTarget(null)
      onQAChange?.()
      await load()
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const openEdit   = qa  => { setEditQA(qa); setModalOpen(true) }
  const openNew    = ()  => { setEditQA(null); setModalOpen(true) }
  const clearFilters = () => { setSearch(''); setFilterCat('') }
  const hasFilters = !!(search || filterCat)

  const catMap = Object.fromEntries(categories.map(c => [c.id, c.name]))

  return (
    <div className="flex flex-col gap-6 sm:gap-7 lg:gap-8 animate-fade-up max-w-[1440px] mx-auto">

      {/* ── Page Header ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm" style={{ padding: '22px 26px' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10.5px] font-bold mb-2.5"
              style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}>
              <Sparkles size={10} />
              Intelligence NORA
            </div>
            <h1 className="page-title">Questions & Réponses</h1>
            <p className="page-subtitle">
              Gérez la base de connaissances conversationnelle de l'IA NORA
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
              onClick={openNew}
              className="btn btn-primary rounded-xl px-4 py-2 text-xs font-bold"
            >
              <Plus size={14} />
              Nouveau QA
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Row ── */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 animate-fade-up delay-75">
          <KpiCard
            icon={MessageSquare}
            iconBg="var(--kpi-blue-bg)"
            iconColor="var(--kpi-blue-icon)"
            value={qas.length}
            label="Total Questions & Réponses"
            sub="dans la base de données"
          />
          <KpiCard
            icon={FolderOpen}
            iconBg="var(--kpi-green-bg)"
            iconColor="var(--kpi-green-icon)"
            value={categories.length}
            label="Catégories Distinctes"
            sub="thèmes disponibles"
          />
          <KpiCard
            icon={Filter}
            iconBg={hasFilters ? 'var(--kpi-rose-bg)' : 'var(--kpi-amber-bg)'}
            iconColor={hasFilters ? 'var(--kpi-rose-icon)' : 'var(--kpi-amber-icon)'}
            value={filtered.length}
            label="Résultats Filtrés"
            sub={hasFilters ? `${qas.length - filtered.length} masqué(s)` : 'aucun filtre actif'}
          />
        </div>
      )}

      {/* ── Search & Filters ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm animate-fade-up delay-100" style={{ padding: '14px 18px' }}>
        <div className="flex items-center gap-3 flex-wrap">

          {/* Search */}
          <div
            className="flex items-center gap-2 flex-1 min-w-[200px] max-w-md bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 transition-all"
            style={{ '--tw-ring-color': 'var(--brand-ring)' }}
            onFocusCapture={e => e.currentTarget.style.borderColor = 'var(--brand)'}
            onBlurCapture={e => e.currentTarget.style.borderColor = ''}
          >
            <Search size={15} className="text-gray-400 flex-shrink-0" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher une question ou une réponse…"
              className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Category filter */}
          <div className="relative">
            <SlidersHorizontal
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <select
              value={filterCat}
              onChange={e => setFilterCat(e.target.value)}
              className="input-base text-sm pl-9 h-[42px] min-w-[200px] bg-gray-50"
            >
              <option value="">Toutes les catégories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Clear filters */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="btn btn-ghost text-xs font-semibold text-gray-500 gap-1.5 hover:text-gray-700"
            >
              <X size={13} /> Effacer les filtres
            </button>
          )}

          <div className="flex-1" />

          {/* Results count */}
          <div className="flex items-center gap-2">
            {hasFilters && (
              <span className="badge badge-brand text-[10.5px] gap-1">
                <Filter size={9} /> Filtre actif
              </span>
            )}
            <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
              {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className="card overflow-hidden animate-fade-up delay-150">

        {/* Card header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--brand-soft)' }}>
              <FileText size={16} style={{ color: 'var(--brand)' }} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">
                {hasFilters ? 'Résultats filtrés' : 'Toutes les questions & réponses'}
              </p>
              <p className="text-xs text-gray-400">
                Page {safePage} / {totalPages} · {filtered.length} QA{filtered.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <button
            onClick={openNew}
            className="btn btn-primary text-xs rounded-xl px-3 py-2 hidden sm:flex"
          >
            <Plus size={13} /> Ajouter un QA
          </button>
        </div>

        {/* Table content */}
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-4 text-gray-400">
            <Loader2 size={28} className="animate-spin-slow" style={{ color: 'var(--brand)' }} />
            <span className="text-sm font-medium">Chargement des questions & réponses…</span>
          </div>
        ) : pageItems.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <MessageSquare size={28} />
            </div>
            <p className="empty-state-title">
              {hasFilters ? 'Aucun résultat' : 'Aucun QA enregistré'}
            </p>
            <p className="empty-state-desc">
              {hasFilters
                ? 'Aucune question ne correspond à vos critères. Essayez de modifier ou supprimer vos filtres.'
                : 'Créez votre premier QA pour alimenter la base de connaissances de NORA.'}
            </p>
            {hasFilters
              ? <button onClick={clearFilters} className="btn btn-secondary mt-5">
                  <X size={13} /> Effacer les filtres
                </button>
              : <button onClick={openNew} className="btn btn-primary mt-5">
                  <Plus size={14} /> Créer le premier QA
                </button>
            }
          </div>
        ) : (
          <QAsTable
            qas={pageItems}
            catMap={catMap}
            onEdit={openEdit}
            onDelete={setDeleteTarget}
            loading={actionLoading}
          />
        )}

        {/* Footer pagination */}
        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4.5 border-t border-gray-100 flex-wrap gap-3 bg-gray-50/50">
            <p className="text-xs text-gray-400 font-medium">
              Affichage{' '}
              <span className="font-bold text-gray-600">
                {((safePage - 1) * PAGE_SIZE) + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)}
              </span>{' '}
              sur <span className="font-bold text-gray-600">{filtered.length}</span> résultat{filtered.length !== 1 ? 's' : ''}
            </p>
            <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <QAFormModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditQA(null) }}
        onSubmit={handleSave}
        editData={editQA}
        categories={categories}
        loading={actionLoading}
      />
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={actionLoading}
        title="Supprimer ce QA"
        description={
          deleteTarget
            ? `Supprimer définitivement la question « ${deleteTarget.question?.slice(0, 80)}${deleteTarget.question?.length > 80 ? '…' : ''} » ?`
            : ''
        }
      />
    </div>
  )
}
