/**
 * ConfirmDeleteModal.jsx — Modal de confirmation de suppression
 */
import { useEffect } from 'react'
import { Loader2, Trash2, X, AlertTriangle } from 'lucide-react'

export default function ConfirmDeleteModal({
  isOpen, onClose, onConfirm, loading,
  title = 'Confirmer la suppression',
  description = 'Cette action est irréversible. Souhaitez-vous continuer ?'
}) {
  useEffect(() => {
    if (!isOpen) return
    const fn = e => { if (e.key === 'Escape' && !loading) onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [isOpen, loading, onClose])

  if (!isOpen) return null

  return (
    <div className="modal-overlay" role="alertdialog" aria-modal="true"
      aria-labelledby="del-modal-title" aria-describedby="del-modal-desc"
      onClick={e => { if (e.target === e.currentTarget && !loading) onClose() }}>
      <div className="modal-box w-full max-w-sm">

        {/* Header */}
        <div className="flex items-start gap-4 p-6">
          <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={22} className="text-red-500" />
          </div>
          <div className="flex-1">
            <h2 id="del-modal-title" className="text-base font-bold text-gray-900">{title}</h2>
            <p id="del-modal-desc" className="text-sm text-gray-500 mt-1.5 leading-relaxed">{description}</p>
            <p className="text-xs text-red-600 font-semibold mt-3 flex items-center gap-1.5">
              <span>⚠</span> Cette action est permanente et irréversible.
            </p>
          </div>
          <button onClick={onClose} disabled={loading}
            className="btn btn-ghost btn-icon w-7 h-7 rounded-lg flex-shrink-0"
            aria-label="Fermer">
            <X size={14} />
          </button>
        </div>

        {/* Divider */}
        <div className="divider" />

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4">
          <button onClick={onClose} disabled={loading} className="btn btn-secondary">
            Annuler
          </button>
          <button onClick={onConfirm} disabled={loading} className="btn btn-danger">
            {loading
              ? <><Loader2 size={14} className="animate-spin-slow" /> Suppression…</>
              : <><Trash2 size={14} /> Supprimer définitivement</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}
