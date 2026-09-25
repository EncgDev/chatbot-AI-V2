/**
 * QAFormModal.jsx — Modal création/édition QA
 * Champs : question, réponse (textarea), catégorie
 */
import { useState, useEffect } from 'react'
import { Loader2, X, MessageSquare, Send } from 'lucide-react'

export default function QAFormModal({ isOpen, onClose, onSubmit, editData, categories, loading }) {
  const [form, setForm]   = useState({ question: '', response: '', category_id: '' })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isOpen) {
      setForm({
        question:    editData?.question    ?? '',
        response:    editData?.response    ?? '',
        category_id: editData?.category_id != null ? String(editData.category_id) : '',
      })
      setErrors({})
    }
  }, [isOpen, editData])

  /* ESC to close */
  useEffect(() => {
    if (!isOpen) return
    const fn = e => { if (e.key === 'Escape' && !loading) onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [isOpen, loading, onClose])

  const validate = () => {
    const errs = {}
    if (!form.question.trim()) errs.question = 'La question est requise.'
    if (!form.response.trim()) errs.response = 'La réponse est requise.'
    if (!form.category_id)     errs.category_id = 'Sélectionnez une catégorie.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!validate()) return
    await onSubmit({
      question:    form.question.trim(),
      response:    form.response.trim(),
      category_id: Number(form.category_id),
    })
  }

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    if (errors[k]) setErrors(e => ({ ...e, [k]: undefined }))
  }

  if (!isOpen) return null

  const isEdit = !!editData

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true"
      aria-labelledby="qa-modal-title"
      onClick={e => { if (e.target === e.currentTarget && !loading) onClose() }}>
      <div className="modal-box w-full max-w-xl">

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--brand-soft)' }}>
            <MessageSquare size={18} style={{ color: 'var(--brand)' }} />
          </div>
          <div className="flex-1">
            <h2 id="qa-modal-title" className="text-base font-bold text-gray-900">
              {isEdit ? 'Modifier le QA' : 'Nouveau QA'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isEdit ? `Édition du QA #${editData.id}` : 'Créer une nouvelle entrée dans la base NORA'}
            </p>
          </div>
          <button onClick={onClose} disabled={loading}
            className="btn btn-ghost btn-icon w-8 h-8 rounded-lg"
            aria-label="Fermer">
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-5 space-y-5 overflow-y-auto max-h-[60vh]">

            {/* Question */}
            <div>
              <label htmlFor="qa-question"
                className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                Question <span style={{ color: 'var(--brand)' }}>*</span>
              </label>
              <input
                id="qa-question"
                type="text"
                value={form.question}
                onChange={e => set('question', e.target.value)}
                placeholder="Ex: Quel est le processus d'admission à l'ENCG ?"
                className={`input-base ${errors.question ? 'error' : ''}`}
                disabled={loading}
                autoFocus
              />
              {errors.question && (
                <p className="text-xs text-red-600 font-medium mt-1.5">⚠ {errors.question}</p>
              )}
            </div>

            {/* Response */}
            <div>
              <label htmlFor="qa-response"
                className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                Réponse <span style={{ color: 'var(--brand)' }}>*</span>
              </label>
              <textarea
                id="qa-response"
                value={form.response}
                onChange={e => set('response', e.target.value)}
                placeholder="Rédigez une réponse claire et complète…"
                rows={5}
                className={`input-base resize-y ${errors.response ? 'error' : ''}`}
                style={{ minHeight: 110 }}
                disabled={loading}
              />
              {errors.response && (
                <p className="text-xs text-red-600 font-medium mt-1.5">⚠ {errors.response}</p>
              )}
              <p className="text-[11px] text-gray-400 mt-1.5">
                {form.response.length} caractère{form.response.length !== 1 ? 's' : ''} · Plus la réponse est détaillée, meilleure sera la précision de l'IA.
              </p>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="qa-category"
                className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                Catégorie <span style={{ color: 'var(--brand)' }}>*</span>
              </label>
              <select
                id="qa-category"
                value={form.category_id}
                onChange={e => set('category_id', e.target.value)}
                className={`input-base ${errors.category_id ? 'error' : ''}`}
                style={{ height: 42 }}
                disabled={loading}
              >
                <option value="">— Sélectionner une catégorie —</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.category_id && (
                <p className="text-xs text-red-600 font-medium mt-1.5">⚠ {errors.category_id}</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-gray-100 bg-gray-50/60">
            <button type="button" onClick={onClose} disabled={loading}
              className="btn btn-secondary">
              Annuler
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading
                ? <><Loader2 size={14} className="animate-spin-slow" /> Enregistrement…</>
                : <><Send size={14} /> {isEdit ? 'Mettre à jour' : 'Créer le QA'}</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
