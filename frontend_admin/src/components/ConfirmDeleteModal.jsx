/**
 * ConfirmDeleteModal.jsx — Modal de confirmation de suppression — Premium v3
 */
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
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

  return createPortal(
    <div
      className="modal-overlay"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="del-modal-title"
      aria-describedby="del-modal-desc"
      onClick={e => { if (e.target === e.currentTarget && !loading) onClose() }}
    >
      <div className="modal-box w-full max-w-sm">
        {/* Header */}
        <div className="flex items-start gap-3.5" style={{ padding: '22px 24px 16px' }}>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: '#FEF2F2' }}
          >
            <AlertTriangle size={20} className="text-red-500" />
          </div>
          <div className="flex-1">
            <h2 id="del-modal-title" className="text-[15px] font-bold text-gray-900 leading-tight">
              {title}
            </h2>
            <p id="del-modal-desc" className="text-xs text-gray-500 mt-1.5 leading-relaxed">
              {description}
            </p>
            <div
              className="flex items-center gap-2 mt-2.5 px-2.5 py-2 rounded-lg border"
              style={{ background: '#FEF2F2', borderColor: '#FECACA' }}
            >
              <span className="text-[10.5px] text-red-700 font-semibold leading-snug">
                ⚠ Cette action est permanente et ne peut pas être annulée.
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="btn btn-ghost btn-icon w-8 h-8 rounded-lg flex-shrink-0"
            aria-label="Fermer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Divider */}
        <div className="divider" />

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5" style={{ padding: '14px 24px 18px' }}>
          <button onClick={onClose} disabled={loading} className="btn btn-secondary px-3.5 py-2 text-xs">
            Annuler
          </button>
          <button onClick={onConfirm} disabled={loading} className="btn btn-danger px-4 py-2 text-xs">
            {loading
              ? <><Loader2 size={14} className="animate-spin-slow" /> Suppression…</>
              : <><Trash2 size={14} /> Supprimer définitivement</>
            }
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
