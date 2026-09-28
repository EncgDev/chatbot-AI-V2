/**
 * QAFormModal.jsx — Modal création/édition QA — Premium v3
 * Champs : question, réponse (textarea), catégorie — UI premium
 */
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Loader2, X, MessageSquare, Send, AlertCircle, BookOpen } from 'lucide-react'

export default function QAFormModal({ isOpen, onClose, onSubmit, editData, categories, loading }) {
  const [form, setForm]     = useState({ question: '', response: '', category_id: '' })
  const [errors, setErrors] = useState({})
  const [charCount, setCharCount] = useState(0)

  useEffect(() => {
    if (isOpen) {
      const newForm = {
        question:    editData?.question    ?? '',
        response:    editData?.response    ?? '',
        category_id: editData?.category_id != null ? String(editData.category_id) : '',
      }
      setForm(newForm)
      setCharCount(newForm.response.length)
      setErrors({})
    }
  }, [isOpen, editData])

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
    if (k === 'response') setCharCount(v.length)
    if (errors[k]) setErrors(e => ({ ...e, [k]: undefined }))
  }

  if (!isOpen) return null

  const isEdit = !!editData
  const qualityLevel =
    charCount < 50 ? { label: 'Trop court', color: '#DC2626', w: '20%' }
    : charCount < 150 ? { label: 'Correct', color: '#D97706', w: '50%' }
    : charCount < 400 ? { label: 'Bon', color: '#16A34A', w: '80%' }
    : { label: 'Excellent', color: '#0284C7', w: '100%' }

  return createPortal(
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qa-modal-title"
      onClick={e => { if (e.target === e.currentTarget && !loading) onClose() }}
    >
      <div className="modal-box w-full max-w-2xl">

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-gray-100" style={{ padding: '18px 22px' }}>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--brand-soft)' }}
          >
            <MessageSquare size={18} style={{ color: 'var(--brand)' }} />
          </div>
          <div className="flex-1">
            <h2 id="qa-modal-title" className="text-[15px] font-bold text-gray-900 font-display">
              {isEdit ? 'Modifier la question & réponse' : 'Nouveau QA'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isEdit
                ? `Édition du QA #${editData.id} — modifications synchronisées avec NORA`
                : 'Enrichissez la base de connaissances de l\'assistant NORA'}
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
        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-4 overflow-y-auto max-h-[60vh]" style={{ padding: '20px 22px' }}>

            {/* Category */}
            <div>
              <label htmlFor="qa-category" className="form-label form-label-required">
                Catégorie
              </label>
              <select
                id="qa-category"
                value={form.category_id}
                onChange={e => set('category_id', e.target.value)}
                className={`input-base ${errors.category_id ? 'error' : ''}`}
                style={{ height: 44 }}
                disabled={loading}
              >
                <option value="">— Sélectionner une catégorie —</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.category_id && (
                <p className="form-error">
                  <AlertCircle size={12} /> {errors.category_id}
                </p>
              )}
            </div>

            {/* Question */}
            <div>
              <label htmlFor="qa-question" className="form-label form-label-required">
                Question
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
                <p className="form-error">
                  <AlertCircle size={12} /> {errors.question}
                </p>
              )}
              <p className="form-hint">
                Formulez la question telle qu'un étudiant la poserait à NORA.
              </p>
            </div>

            {/* Response */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="qa-response" className="form-label form-label-required mb-0">
                  Réponse
                </label>
                {charCount > 0 && (
                  <span
                    className="text-[10.5px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: qualityLevel.color + '18', color: qualityLevel.color }}
                  >
                    {qualityLevel.label}
                  </span>
                )}
              </div>
              <textarea
                id="qa-response"
                value={form.response}
                onChange={e => set('response', e.target.value)}
                placeholder="Rédigez une réponse claire, complète et précise…"
                rows={6}
                className={`input-base resize-y ${errors.response ? 'error' : ''}`}
                style={{ minHeight: 130 }}
                disabled={loading}
              />

              {/* Quality bar */}
              {charCount > 0 && (
                <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: qualityLevel.w, background: qualityLevel.color }}
                  />
                </div>
              )}

              {errors.response && (
                <p className="form-error">
                  <AlertCircle size={12} /> {errors.response}
                </p>
              )}
              <div className="flex items-center justify-between mt-1.5">
                <p className="form-hint">
                  <BookOpen size={11} className="inline mr-1" />
                  Plus la réponse est détaillée, meilleure sera la précision sémantique de NORA.
                </p>
                <span className="text-[11px] text-gray-400 font-medium">
                  {charCount} car.
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/60" style={{ padding: '14px 22px' }}>
            <p className="text-xs text-gray-400 hidden sm:block">
              {isEdit ? '⟳ Les modifications seront appliquées immédiatement.' : '+ Le QA sera indexé lors de la prochaine régénération IA.'}
            </p>
            <div className="flex items-center gap-2.5 ml-auto">
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
                  : <><Send size={13} /> {isEdit ? 'Mettre à jour' : 'Créer le QA'}</>
                }
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
