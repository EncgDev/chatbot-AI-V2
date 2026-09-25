/**
 * QAFormModal.jsx — Création / Édition QA — Design premium
 */
import { useState, useEffect } from 'react'
import { X, Save, Plus, FileText, MessageSquare, Tag } from 'lucide-react'

const EMPTY = { question: '', response: '', category_id: '' }

export default function QAFormModal({ isOpen, onClose, onSubmit, initialData, categories, loading }) {
  const [form, setForm]   = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const isEdit = !!initialData

  // Fermeture avec la touche Échap (sauf pendant un envoi)
  useEffect(() => {
    if (!isOpen) return
    const onKey = e => { if (e.key === 'Escape' && !loading) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, loading, onClose])

  useEffect(() => {
    if (isOpen) {
      setForm(initialData ? {
        question: initialData.question ?? '',
        response: initialData.response ?? '',
        category_id: initialData.category_id ?? '',
      } : EMPTY)
      setErrors({})
    }
  }, [isOpen, initialData])

  const validate = () => {
    const e = {}
    if (!form.question.trim()) e.question = 'La question est requise.'
    if (!form.response.trim()) e.response = 'La réponse est requise.'
    if (!form.category_id) e.category_id = 'Sélectionnez une catégorie.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = e => {
    e.preventDefault()
    if (!validate()) return
    onSubmit({ ...form, category_id: Number(form.category_id) })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      role="dialog" aria-modal="true"
      style={{ background: 'rgba(61,39,29,.5)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget && !loading) onClose() }}>

      <div className="bg-white rounded-2xl w-full max-w-2xl flex flex-col animate-scale-in"
        style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)', maxHeight: '92vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: isEdit ? 'rgba(200,90,50,.1)' : 'rgba(133,24,26,.08)' }}>
              {isEdit
                ? <Save size={16} style={{ color: 'var(--terracotta)' }} />
                : <Plus size={16} style={{ color: 'var(--bordeaux)' }} />
              }
            </div>
            <div>
              <h2 className="font-semibold text-sm" style={{ color: 'var(--brown)' }}>
                {isEdit ? 'Modifier le QA' : 'Nouveau QA'}
              </h2>
              <p className="text-xs" style={{ color: 'var(--brown-muted)' }}>
                {isEdit ? 'Modifiez les champs puis enregistrez' : 'Remplissez les champs ci-dessous'}
              </p>
            </div>
          </div>
          <button onClick={onClose} disabled={loading}
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50"
            style={{ color: 'var(--brown-muted)' }}>
            <X size={15} />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="px-6 py-5 flex flex-col gap-5 overflow-y-auto flex-1">

            {/* Question */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest mb-2"
                style={{ color: 'var(--brown-muted)' }}>
                <MessageSquare size={11} />
                Question <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <textarea rows={3}
                placeholder="Saisissez la question de l'utilisateur…"
                className={`input-base resize-none ${errors.question ? 'error' : ''}`}
                value={form.question}
                onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
              />
              {errors.question && (
                <p className="mt-1.5 text-xs font-medium" style={{ color: 'var(--danger)' }}>
                  ⚠ {errors.question}
                </p>
              )}
            </div>

            {/* Réponse */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest mb-2"
                style={{ color: 'var(--brown-muted)' }}>
                <FileText size={11} />
                Réponse <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <textarea rows={6}
                placeholder="Saisissez la réponse complète de NORA…"
                className={`input-base resize-none ${errors.response ? 'error' : ''}`}
                value={form.response}
                onChange={e => setForm(f => ({ ...f, response: e.target.value }))}
              />
              {errors.response && (
                <p className="mt-1.5 text-xs font-medium" style={{ color: 'var(--danger)' }}>
                  ⚠ {errors.response}
                </p>
              )}
            </div>

            {/* Catégorie */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest mb-2"
                style={{ color: 'var(--brown-muted)' }}>
                <Tag size={11} />
                Catégorie <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <select
                className={`input-base ${errors.category_id ? 'error' : ''}`}
                value={form.category_id}
                onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
              >
                <option value="">— Sélectionner une catégorie —</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.category_id && (
                <p className="mt-1.5 text-xs font-medium" style={{ color: 'var(--danger)' }}>
                  ⚠ {errors.category_id}
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 shrink-0"
            style={{ borderTop: '1px solid var(--border)', background: 'var(--cream)' }}>
            <button type="button" onClick={onClose} disabled={loading} className="btn-secondary">
              Annuler
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {isEdit
                ? loading ? 'Enregistrement…' : <><Save size={14} /> Enregistrer</>
                : loading ? 'Création…'         : <><Plus size={14} /> Créer le QA</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
