/**
 * QAsPage.jsx — Design premium avec stats
 */
import { useState, useEffect, useCallback } from 'react'
import QAsTable from '../components/QAsTable'
import QAFormModal from '../components/QAFormModal'
import ConfirmDeleteModal from '../components/ConfirmDeleteModal'
import { listQAs, listCategories, createQA, updateQA, deleteQA } from '../api/adminApi'
import { showToast } from '../components/Toast'
import { Loader2, RefreshCw, Plus, MessageSquare, FolderOpen, Hash } from 'lucide-react'

export default function QAsPage({ onQAChange }) {
  const [qas, setQas]               = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [formOpen, setFormOpen]         = useState(false)
  const [editTarget, setEditTarget]     = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [search, setSearch]       = useState('')
  const [categoryId, setCategoryId] = useState('')

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (categoryId) params.category_id = categoryId
      if (search.trim()) params.search = search.trim()
      const [qRes, cRes] = await Promise.all([listQAs(params), listCategories()])
      setQas(qRes.data ?? [])
      setCategories(cRes.data ?? [])
    } catch (e) { showToast(e.message, 'error') }
    finally { setLoading(false) }
  }, [search, categoryId])

  useEffect(() => { loadAll() }, [loadAll])

  const openCreate = () => { setEditTarget(null); setFormOpen(true) }
  const openEdit   = qa => { setEditTarget(qa); setFormOpen(true) }

  const handleFormSubmit = async payload => {
    setActionLoading(true)
    try {
      if (editTarget) { await updateQA(editTarget.id, payload); showToast('✓ QA mis à jour.') }
      else            { await createQA(payload);                  showToast('✓ QA créé.') }
      setFormOpen(false)
      if (onQAChange) onQAChange()
      await loadAll()
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
      if (onQAChange) onQAChange()
      await loadAll()
    } catch (e) { showToast(e.message, 'error') }
    finally { setActionLoading(false) }
  }

  return (
    <div className="max-w-6xl mx-auto animate-slide-up">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold mb-1" style={{ color: 'var(--brown)' }}>
            Questions & Réponses
          </h2>
          <p className="text-sm" style={{ color: 'var(--brown-muted)' }}>
            Gérez la base de connaissances de l'IA NORA
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadAll} disabled={loading}
            className="w-9 h-9 rounded-xl border flex items-center justify-center hover:bg-white transition-colors disabled:opacity-40"
            style={{ borderColor: 'var(--border)' }}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} style={{ color: 'var(--bordeaux)' }} />
          </button>
          <button onClick={openCreate} className="btn-primary">
            <Plus size={15} />
            Nouveau QA
          </button>
        </div>
      </div>

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          <div className="card px-5 py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(133,24,26,.08)' }}>
              <MessageSquare size={18} style={{ color: 'var(--bordeaux)' }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--brown)' }}>{qas.length}</p>
              <p className="text-xs" style={{ color: 'var(--brown-muted)' }}>QAs affichés</p>
            </div>
          </div>
          <div className="card px-5 py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(200,90,50,.1)' }}>
              <FolderOpen size={18} style={{ color: 'var(--terracotta)' }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--brown)' }}>{categories.length}</p>
              <p className="text-xs" style={{ color: 'var(--brown-muted)' }}>Catégories</p>
            </div>
          </div>
          <div className="hidden sm:flex card px-5 py-4 items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(5,150,105,.1)' }}>
              <Hash size={18} style={{ color: 'var(--success)' }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--brown)' }}>
                {categories.reduce((s, c) => s + (c.qa_count ?? 0), 0)}
              </p>
              <p className="text-xs" style={{ color: 'var(--brown-muted)' }}>QAs total BDD</p>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 size={28} style={{ color: 'var(--bordeaux)', animation: 'spin 1s linear infinite' }} />
          <p className="text-sm" style={{ color: 'var(--brown-muted)' }}>Chargement…</p>
        </div>
      ) : (
        <QAsTable
          qas={qas}
          categories={categories}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
          loading={actionLoading}
          filterState={{ search, categoryId, setSearch, setCategoryId }}
        />
      )}

      <QAFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editTarget}
        categories={categories}
        loading={actionLoading}
      />

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={actionLoading}
        title="Supprimer le QA"
        description={deleteTarget ? `Voulez-vous supprimer cette question « ${deleteTarget.question?.slice(0, 55)}… » ?` : ''}
      />
    </div>
  )
}
