/**
 * CategoriesTable.jsx — Table view for categories
 */
import { useState } from 'react'
import { Loader2, Pencil, Trash2, Check, X, FolderOpen } from 'lucide-react'

export default function CategoriesTable({ categories, onSave, onDelete, loading }) {
  const [editId, setEditId]     = useState(null)
  const [editName, setEditName] = useState('')
  const [editErr, setEditErr]   = useState('')

  const startEdit = cat => {
    setEditId(cat.id)
    setEditName(cat.name)
    setEditErr('')
  }

  const cancelEdit = () => { setEditId(null); setEditName(''); setEditErr('') }

  const handleSave = async () => {
    if (!editName.trim()) { setEditErr('Nom requis'); return }
    if (editName.trim() === categories.find(c => c.id === editId)?.name) { cancelEdit(); return }
    await onSave(editId, editName.trim())
    cancelEdit()
  }

  return (
    <div className="overflow-x-auto">
      <table className="data-table" role="table" aria-label="Liste des catégories">
        <thead>
          <tr>
            <th style={{ width: 60 }}>#</th>
            <th>Nom de la catégorie</th>
            <th style={{ width: 120 }}>Questions</th>
            <th style={{ width: 120 }}>État</th>
            <th style={{ width: 100 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((cat, i) => (
            <tr key={cat.id}>
              {/* Index */}
              <td className="font-mono text-xs text-gray-400">{i + 1}</td>

              {/* Name / Edit */}
              <td>
                {editId === cat.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') cancelEdit() }}
                      className={`input-base text-sm w-48 ${editErr ? 'error' : ''}`}
                    />
                    <button onClick={handleSave} disabled={loading}
                      className="btn btn-primary btn-icon w-7 h-7 rounded-md" title="Enregistrer">
                      {loading ? <Loader2 size={12} className="animate-spin-slow" /> : <Check size={13} />}
                    </button>
                    <button onClick={cancelEdit}
                      className="btn btn-secondary btn-icon w-7 h-7 rounded-md" title="Annuler">
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ background: 'var(--brand)', opacity: .9 }}>
                      {(cat.name || '?')[0].toUpperCase()}
                    </div>
                    <span className="font-semibold text-gray-800">{cat.name}</span>
                  </div>
                )}
              </td>

              {/* QA Count */}
              <td>
                <span className="badge badge-info">{cat.qa_count ?? 0} QA</span>
              </td>

              {/* Status */}
              <td>
                <span className={`badge ${(cat.qa_count ?? 0) > 0 ? 'badge-success' : 'badge-cream'}`}>
                  {(cat.qa_count ?? 0) > 0 ? 'Actif' : 'Vide'}
                </span>
              </td>

              {/* Actions */}
              <td>
                {editId !== cat.id && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => startEdit(cat)}
                      className="btn btn-ghost btn-icon w-7 h-7 rounded-md"
                      title="Modifier"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => (cat.qa_count ?? 0) === 0 && onDelete(cat)}
                      disabled={(cat.qa_count ?? 0) > 0}
                      className="btn btn-ghost btn-icon w-7 h-7 rounded-md hover:!bg-red-50 hover:!text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      title={(cat.qa_count ?? 0) > 0 ? 'Impossible: des QAs sont associés' : 'Supprimer'}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
