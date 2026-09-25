/**
 * CategoriesTable.jsx — Table CRUD des catégories — Design premium
 */
import { useState } from 'react'
import { Pencil, Trash2, Check, X, FolderOpen, AlertCircle, Plus, Tag } from 'lucide-react'

export default function CategoriesTable({ categories, onSave, onDelete, loading }) {
  const [editId, setEditId]     = useState(null)
  const [editName, setEditName] = useState('')
  const [nameErr, setNameErr]   = useState('')
  const [newName, setNewName]   = useState('')
  const [newErr, setNewErr]     = useState('')
  const [showNew, setShowNew]   = useState(false)

  const startEdit = (cat) => { setEditId(cat.id); setEditName(cat.name); setNameErr('') }
  const cancelEdit = () => { setEditId(null); setEditName(''); setNameErr('') }

  const confirmEdit = async () => {
    if (!editName.trim()) { setNameErr('Le nom est requis.'); return }
    const original = categories.find(c => c.id === editId)?.name
    if (editName.trim() === original) { cancelEdit(); return } // aucun changement → pas d'appel API
    try { await onSave(editId, editName.trim()); cancelEdit() }
    catch (e) { setNameErr(e.message) }
  }

  const confirmNew = async () => {
    if (!newName.trim()) { setNewErr('Le nom est requis.'); return }
    try { await onSave(null, newName.trim()); setNewName(''); setShowNew(false); setNewErr('') }
    catch (e) { setNewErr(e.message) }
  }

  return (
    <div className="card overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(133,24,26,.08)' }}>
            <FolderOpen size={17} style={{ color: 'var(--bordeaux)' }} />
          </div>
          <div>
            <h3 className="font-semibold text-sm" style={{ color: 'var(--brown)' }}>Catégories</h3>
            <p className="text-xs" style={{ color: 'var(--brown-muted)' }}>{categories.length} catégorie{categories.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button
          onClick={() => { setShowNew(true); setNewName(''); setNewErr('') }}
          disabled={loading || showNew}
          className="btn-primary text-xs px-3 py-2"
        >
          <Plus size={13} />
          Nouvelle catégorie
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ background: 'var(--cream)', borderBottom: '1px solid var(--border)' }}>
              <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-widest"
                style={{ color: 'var(--brown-muted)' }}>Nom de la catégorie</th>
              <th className="px-6 py-3 text-center text-[11px] font-bold uppercase tracking-widest w-28"
                style={{ color: 'var(--brown-muted)' }}>QAs</th>
              <th className="px-6 py-3 text-right text-[11px] font-bold uppercase tracking-widest w-32"
                style={{ color: 'var(--brown-muted)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* Ligne nouvelle catégorie */}
            {showNew && (
              <tr style={{ background: '#FFF9F5', borderBottom: '1px solid var(--border)' }}>
                <td className="px-6 py-3" colSpan={2}>
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(200,90,50,.12)' }}>
                      <Tag size={13} style={{ color: 'var(--terracotta)' }} />
                    </div>
                    <input
                      autoFocus
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') confirmNew(); if (e.key === 'Escape') setShowNew(false) }}
                      placeholder="Nom de la nouvelle catégorie…"
                      className="input-base flex-1"
                      style={newErr ? { borderColor: 'var(--danger)' } : {}}
                    />
                    {newErr && <p className="text-xs shrink-0" style={{ color: 'var(--danger)' }}>{newErr}</p>}
                  </div>
                </td>
                <td className="px-6 py-3">
                  <div className="flex justify-end gap-1.5">
                    <button onClick={confirmNew}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors"
                      style={{ background: 'var(--success)' }}>
                      <Check size={12} /> Créer
                    </button>
                    <button onClick={() => setShowNew(false)}
                      className="btn-secondary px-2.5 py-1.5 text-xs">
                      <X size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {/* Empty state */}
            {categories.length === 0 && !showNew && (
              <tr>
                <td colSpan={3} className="px-6 py-16 text-center">
                  <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                    style={{ background: 'var(--cream-dark)' }}>
                    <FolderOpen size={24} style={{ color: 'var(--brown-muted)' }} />
                  </div>
                  <p className="text-sm font-medium" style={{ color: 'var(--brown)' }}>Aucune catégorie</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--brown-muted)' }}>Créez votre première catégorie pour organiser les QAs.</p>
                </td>
              </tr>
            )}

            {/* Lignes */}
            {categories.map((cat, i) => (
              <tr key={cat.id}
                className="group transition-colors hover:bg-amber-50/30"
                style={{
                  borderBottom: i < categories.length - 1 ? '1px solid var(--border-light)' : 'none',
                }}>
                <td className="px-6 py-3.5">
                  {editId === cat.id ? (
                    <div className="flex items-center gap-3">
                      <input
                        autoFocus
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') confirmEdit(); if (e.key === 'Escape') cancelEdit() }}
                        className="input-base flex-1"
                        style={nameErr ? { borderColor: 'var(--danger)' } : {}}
                      />
                      {nameErr && <p className="text-xs shrink-0" style={{ color: 'var(--danger)' }}>{nameErr}</p>}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(133,24,26,.07)' }}>
                        <Tag size={13} style={{ color: 'var(--bordeaux)' }} />
                      </div>
                      <span className="font-medium text-sm" style={{ color: 'var(--brown)' }}>{cat.name}</span>
                    </div>
                  )}
                </td>

                <td className="px-6 py-3.5 text-center">
                  <span className="badge badge-cream">{cat.qa_count ?? 0} QA{(cat.qa_count ?? 0) !== 1 ? 's' : ''}</span>
                </td>

                <td className="px-6 py-3.5">
                  <div className="flex justify-end items-center gap-1">
                    {editId === cat.id ? (
                      <>
                        <button onClick={confirmEdit}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors"
                          style={{ background: 'var(--success)' }}>
                          <Check size={12} /> OK
                        </button>
                        <button onClick={cancelEdit} className="btn-secondary px-2.5 py-1.5 text-xs">
                          <X size={12} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(cat)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 focus-visible:opacity-100 max-lg:opacity-100"
                          style={{ background: 'rgba(200,90,50,.1)', color: 'var(--terracotta)' }}
                          title="Modifier" aria-label={`Modifier la catégorie ${cat.name}`}>
                          <Pencil size={13} />
                        </button>
                        <div className="relative group/del">
                          <button
                            onClick={() => onDelete(cat)}
                            disabled={(cat.qa_count ?? 0) > 0 || loading}
                            aria-label={`Supprimer la catégorie ${cat.name}`}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 focus-visible:opacity-100 max-lg:opacity-100 disabled:cursor-not-allowed lg:disabled:opacity-30"
                            style={{ background: 'rgba(220,38,38,.08)', color: 'var(--danger)' }}
                            title={(cat.qa_count ?? 0) > 0 ? `${cat.qa_count} QA(s) associés` : 'Supprimer'}
                          >
                            <Trash2 size={13} />
                          </button>
                          {(cat.qa_count ?? 0) > 0 && (
                            <div className="absolute bottom-full right-0 mb-1.5 px-2.5 py-1.5 text-white text-[11px] rounded-lg whitespace-nowrap opacity-0 group-hover/del:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg"
                              style={{ background: 'var(--brown)' }}>
                              <AlertCircle size={10} className="inline mr-1" />
                              {cat.qa_count} QA(s) — suppression interdite
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
