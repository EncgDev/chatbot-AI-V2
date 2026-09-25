/**
 * QAsPage.jsx — Gestion des Questions & Réponses NORA Admin
 * KPI row · Filtres · Table paginée · Modal création/édition
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import QAsTable from '../components/QAsTable'
import QAFormModal from '../components/QAFormModal'
import ConfirmDeleteModal from '../components/ConfirmDeleteModal'
import { listQAs, listCategories, createQA, updateQA, deleteQA } from '../api/adminApi'
import { showToast } from '../components/Toast'
import {
  Loader2, Plus, RefreshCw, Search, Filter,
  MessageSquare, FolderOpen, ChevronLeft, ChevronRight,
  SlidersHorizontal, X
} from 'lucide-react'

const PAGE_SIZE = 10

/* ─── Pagination component ───────────────────────────────────────── */
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
      <button onClick={() => onChange(page - 1)} disabled={page === 1}
        className="btn btn-secondary btn-icon w-8 h-8 rounded-lg disabled:opacity-40">
        <ChevronLeft size={14} />
      </button>
      {pages.map((p, i) => (
        p === '…' ? (
          <span key={`e${i}`} className="text-xs text-gray-400 px-1">…</span>
        ) : (
          <button key={p} onClick={() => onChange(p)}
            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
              p === page
                ? 'text-white shadow-sm'
                : 'btn btn-ghost text-gray-600 hover:bg-gray-100'
            }`}
            style={p === page ? { background: 'var(--brand)' } : {}}>
            {p}
          </button>
        )
      ))}
      <button onClick={() => onChange(page + 1)} disabled={page === totalPages}
        className="btn btn-secondary btn-icon w-8 h-8 rounded-lg disabled:opacity-40">
        <ChevronRight size={14} />
      </button>
    </div>
  )
}

/* ─── Main Component ─────────────────────────────────────────────── */
export default function QAsPage({ onQAChange }) {
  const [qas, setQas]                 = useState([])
  const [categories, setCategories]   = useState([])
  const [loading, setLoading]         = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const [search, setSearch]           = useState('')
  const [filterCat, setFilterCat]     = useState('')
  const [page, setPage]               = useState(1)

  const [modalOpen, setModalOpen]     = useState(false)
  const [editQA, setEditQA]           = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [showFilters, setShowFilters] = useState(false)

  const searchRef = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [qRes, cRes] = await Promise.all([listQAs(), listCategories()])
      setQas(qRes.data ?? [])
      setCategories(cRes.data ?? [])
    } catch (e) { showToast(e.message, 'error') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  /* Filter & search */
  const filtered = qas.filter(q => {
    const s = search.toLowerCase()
    const matchText = !s || q.question?.toLowerCase().includes(s) || q.response?.toLowerCase().includes(s)
    const matchCat  = !filterCat || String(q.category_id) === filterCat
    return matchText && matchCat
  })
  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage    = Math.min(page, totalPages)
  const pageItems   = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  /* Reset to page 1 on filter change */
  useEffect(() => setPage(1), [search, filterCat])

  /* CRUD */
  const handleSave = async data => {
    setActionLoading(true)
    try {
      if (editQA) { await updateQA(editQA.id, data); showToast('✓ QA mis à jour.') }
      else        { await createQA(data);             showToast('✓ QA créé.') }
      setModalOpen(false)
      setEditQA(null)
      onQAChange?.()
      await load()
    } catch (e) { showToast(e.message, 'error') }
    finally { setActionLoading(false) }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setActionLoading(true)
    try {
      await deleteQA(deleteTarget.id)
      showToast('✓ QA supprimé.')
      setDeleteTarget(null)
      onQAChange?.()
      await load()
    } catch (e) { showToast(e.message, 'error') }
    finally { setActionLoading(false) }
  }

  const openEdit  = qa => { setEditQA(qa);  setModalOpen(true) }
  const openNew   = ()  => { setEditQA(null); setModalOpen(true) }
  const clearFilters = () => { setSearch(''); setFilterCat('') }
  const hasFilters = search || filterCat

  const catMap = Object.fromEntries(categories.map(c => [c.id, c.name]))

  return (
    <div className="space-y-8 md:space-y-10 pb-16 animate-fade-up max-w-[1440px] mx-auto">

      {/* ── Page Header ── */}
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 font-display tracking-tight">
            Questions & Réponses
          </h1>
          <p className="text-xs md:text-sm text-gray-400 mt-1">
            Gérez la base de connaissances et les réponses conversationnelles de l'IA NORA
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
            onClick={openNew}
            className="btn btn-primary rounded-xl px-4 py-2.5 text-xs font-bold"
          >
            <Plus size={15} />
            Nouveau QA
          </button>
        </div>
      </div>

      {/* ── KPI Summary ── */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--kpi-blue-bg)' }}>
              <MessageSquare size={22} style={{ color: 'var(--kpi-blue-icon)' }} />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900 font-display">{qas.length}</p>
              <p className="text-xs font-bold text-gray-700">Total QAs</p>
              <p className="text-[11px] text-gray-400">dans la base</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--kpi-green-bg)' }}>
              <FolderOpen size={22} style={{ color: 'var(--kpi-green-icon)' }} />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900 font-display">{categories.length}</p>
              <p className="text-xs font-bold text-gray-700">Catégories</p>
              <p className="text-[11px] text-gray-400">thèmes distincts</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--kpi-rose-bg)' }}>
              <Filter size={22} style={{ color: 'var(--kpi-rose-icon)' }} />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900 font-display">{filtered.length}</p>
              <p className="text-xs font-bold text-gray-700">Résultats Filtrés</p>
              <p className="text-[11px] text-gray-400">{hasFilters ? 'filtres actifs' : 'aucun filtre actif'}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Filters + Search ── */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="flex items-center gap-2 flex-1 min-w-[180px] max-w-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand-ring transition-all"
            style={{ '--tw-ring-color': 'var(--brand-ring)' }}>
            <Search size={14} className="text-gray-400 flex-shrink-0" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher une question ou réponse…"
              className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600">
                <X size={13} />
              </button>
            )}
          </div>

          {/* Category filter */}
          <select
            value={filterCat}
            onChange={e => setFilterCat(e.target.value)}
            className="input-base text-sm w-auto min-w-[160px]"
            style={{ height: 40 }}
          >
            <option value="">Toutes les catégories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Clear filters */}
          {hasFilters && (
            <button onClick={clearFilters}
              className="btn btn-ghost text-xs font-semibold text-gray-500 gap-1">
              <X size={13} /> Effacer les filtres
            </button>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Results info */}
          <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
            {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className="card overflow-hidden">
        {/* Card header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--brand-soft)' }}>
              <MessageSquare size={16} style={{ color: 'var(--brand)' }} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">
                {hasFilters ? 'Résultats filtrés' : 'Toutes les questions'}
              </p>
              <p className="text-xs text-gray-400">
                Page {safePage} / {totalPages} · {filtered.length} QA{filtered.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          {hasFilters && (
            <span className="badge badge-brand text-[10px]">
              <Filter size={9} /> Filtrés
            </span>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div className="p-10 flex items-center justify-center gap-3 text-gray-400">
            <Loader2 size={22} className="animate-spin-slow" style={{ color: 'var(--brand)' }} />
            <span className="text-sm font-medium">Chargement des QAs…</span>
          </div>
        ) : pageItems.length === 0 ? (
          <div className="p-14 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <MessageSquare size={24} className="text-gray-400" />
            </div>
            <p className="text-base font-bold text-gray-700">
              {hasFilters ? 'Aucun résultat pour ces filtres' : 'Aucun QA enregistré'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {hasFilters ? 'Essayez de modifier vos critères de recherche.' : 'Créez votre premier QA pour alimenter NORA.'}
            </p>
            {hasFilters
              ? <button onClick={clearFilters} className="btn btn-secondary mt-5 text-sm">Effacer les filtres</button>
              : <button onClick={openNew} className="btn btn-primary mt-5"><Plus size={14} /> Créer un QA</button>
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

        {/* Footer / pagination */}
        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 flex-wrap gap-3">
            <p className="text-xs text-gray-400">
              Affichage {((safePage - 1) * PAGE_SIZE) + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} sur {filtered.length}
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
        description={deleteTarget ? `Supprimer définitivement la question « ${deleteTarget.question?.slice(0, 80)}… » ?` : ''}
      />
    </div>
  )
}
