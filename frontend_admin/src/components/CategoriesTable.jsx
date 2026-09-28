/**
 * CategoriesTable.jsx — Table view premium pour les catégories v3
 */
import { useState } from 'react'
import { Loader2, Pencil, Trash2, Check, X, Edit3 } from 'lucide-react'

export default function CategoriesTable({ categories, onSave, onDelete, loading, onEdit }) {
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
            <th style={{ width: 56 }}>#</th>
            <th>Nom de la catégorie</th>
            <th style={{ width: 130 }}>Questions</th>
            <th style={{ width: 110 }}>État</th>
            <th style={{ width: 110 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((cat, i) => (
            <tr key={cat.id} className={editId === cat.id ? 'bg-amber-50/40' : ''}>

              {/* Index */}
              <td>
                <span className="font-mono text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
                  {i + 1}
                </span>
              </td>

              {/* Name / Inline Edit */}
              <td>
                {editId === cat.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      type="text"
                      value={editName}
                      onChange={e => { setEditName(e.target.value); setEditErr('') }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleSave()
                        if (e.key === 'Escape') cancelEdit()
                      }}
                      className={`input-base text-sm w-48 ${editErr ? 'error' : ''}`}
                      style={{ height: 36 }}
                    />
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="btn btn-primary btn-icon w-8 h-8 rounded-lg"
                      title="Enregistrer"
                    >
                      {loading
                        ? <Loader2 size={13} className="animate-spin-slow" />
                        : <Check size={14} />
                      }
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="btn btn-secondary btn-icon w-8 h-8 rounded-lg"
                      title="Annuler"
                    >
                      <X size={14} />
                    </button>
                    {editErr && (
                      <span className="text-xs text-red-600 font-medium">{editErr}</span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-mid) 100%)',
                      }}
                    >
                      {(cat.name || '?')[0].toUpperCase()}
                    </div>
                    <span className="font-semibold text-gray-800 text-sm">{cat.name}</span>
                  </div>
                )}
              </td>

              {/* QA Count */}
              <td>
                <span className="badge badge-info font-bold">
                  {cat.qa_count ?? 0} QA{(cat.qa_count ?? 0) !== 1 ? 's' : ''}
                </span>
              </td>

              {/* Status */}
              <td>
                <span
                  className={`badge ${
                    (cat.qa_count ?? 0) > 0 ? 'badge-success' : 'badge-cream'
                  }`}
                >
                  {(cat.qa_count ?? 0) > 0 ? '● Actif' : '○ Vide'}
                </span>
              </td>

              {/* Actions */}
              <td>
                {editId !== cat.id && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onEdit ? onEdit(cat) : startEdit(cat)}
                      className="btn btn-ghost btn-icon w-8 h-8 rounded-lg"
                      title="Modifier"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      onClick={() => (cat.qa_count ?? 0) === 0 && onDelete(cat)}
                      disabled={(cat.qa_count ?? 0) > 0}
                      className="btn btn-ghost btn-icon w-8 h-8 rounded-lg hover:!bg-red-50 hover:!text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      title={
                        (cat.qa_count ?? 0) > 0
                          ? 'Impossible : des QAs sont associés'
                          : 'Supprimer'
                      }
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
