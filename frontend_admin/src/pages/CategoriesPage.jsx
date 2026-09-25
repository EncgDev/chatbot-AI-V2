/**
 * CategoriesPage.jsx — Design premium avec stats
 */
import { useState, useEffect, useCallback } from 'react'
import CategoriesTable from '../components/CategoriesTable'
import ConfirmDeleteModal from '../components/ConfirmDeleteModal'
import { listCategories, createCategory, updateCategory, deleteCategory } from '../api/adminApi'
import { showToast } from '../components/Toast'
import { Loader2, RefreshCw, FolderOpen, Hash } from 'lucide-react'

export default function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [deleteTarget, setDeleteTarget]   = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listCategories()
      setCategories(res.data ?? [])
    } catch (e) { showToast(e.message, 'error') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async (id, name) => {
    setActionLoading(true)
    try {
      if (id) { await updateCategory(id, name); showToast('✓ Catégorie mise à jour.') }
      else     { await createCategory(name);     showToast('✓ Catégorie créée.') }
      await load()
    } finally { setActionLoading(false) }
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
    <div className="max-w-3xl mx-auto animate-slide-up">

      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold mb-1" style={{ color: 'var(--brown)' }}>
            Catégories
          </h2>
          <p className="text-sm" style={{ color: 'var(--brown-muted)' }}>
            Organisez la base de connaissances de NORA par thèmes
          </p>
        </div>
        <button onClick={load} disabled={loading}
          className="w-9 h-9 rounded-xl border flex items-center justify-center hover:bg-white transition-colors disabled:opacity-40"
          style={{ borderColor: 'var(--border)' }}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} style={{ color: 'var(--bordeaux)' }} />
        </button>
      </div>

      {/* Stats cards */}
      {!loading && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="card px-5 py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(133,24,26,.08)' }}>
              <FolderOpen size={18} style={{ color: 'var(--bordeaux)' }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--brown)' }}>{categories.length}</p>
              <p className="text-xs" style={{ color: 'var(--brown-muted)' }}>Catégorie{categories.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="card px-5 py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(200,90,50,.1)' }}>
              <Hash size={18} style={{ color: 'var(--terracotta)' }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--brown)' }}>{totalQAs}</p>
              <p className="text-xs" style={{ color: 'var(--brown-muted)' }}>QAs au total</p>
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
        <CategoriesTable
          categories={categories}
          onSave={handleSave}
          onDelete={setDeleteTarget}
          loading={actionLoading}
        />
      )}

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={actionLoading}
        title="Supprimer la catégorie"
        description={deleteTarget ? `Voulez-vous supprimer la catégorie « ${deleteTarget.name} » ?` : ''}
      />
    </div>
  )
}
