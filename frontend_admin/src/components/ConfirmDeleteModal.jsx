/**
 * ConfirmDeleteModal.jsx — Confirmation suppression — Design premium
 */
import { useEffect } from 'react'
import { X, Trash2, AlertTriangle } from 'lucide-react'

export default function ConfirmDeleteModal({ isOpen, onClose, onConfirm, title, description, loading }) {
  // Fermeture avec la touche Échap (sauf pendant une suppression)
  useEffect(() => {
    if (!isOpen) return
    const onKey = e => { if (e.key === 'Escape' && !loading) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, loading, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      role="alertdialog" aria-modal="true" aria-label={title ?? 'Confirmation de suppression'}
      style={{ background: 'rgba(61,39,29,.5)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget && !loading) onClose() }}>

      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden animate-scale-in"
        style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
              <AlertTriangle size={17} className="text-red-500" />
            </div>
            <h2 className="font-semibold text-sm" style={{ color: 'var(--brown)' }}>
              {title ?? 'Confirmer la suppression'}
            </h2>
          </div>
          <button onClick={onClose} disabled={loading}
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50"
            style={{ color: 'var(--brown-muted)' }}>
            <X size={15} />
          </button>
        </div>

        {/* Corps */}
        <div className="px-6 py-5">
          <p className="text-sm leading-relaxed" style={{ color: 'var(--brown-muted)' }}>
            {description ?? 'Cette action est irréversible. Souhaitez-vous vraiment supprimer cet élément ?'}
          </p>
          <div className="mt-4 flex items-center gap-2 px-3 py-2.5 rounded-xl"
            style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
            <AlertTriangle size={13} className="text-red-400 shrink-0" />
            <p className="text-xs text-red-600 font-medium">Cette action est irréversible.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4"
          style={{ borderTop: '1px solid var(--border)', background: 'var(--cream)' }}>
          <button onClick={onClose} disabled={loading} className="btn-secondary">
            Annuler
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition-all disabled:opacity-50"
            style={{ background: 'var(--danger)', boxShadow: '0 2px 8px rgba(220,38,38,.25)' }}>
            <Trash2 size={14} />
            {loading ? 'Suppression…' : 'Supprimer'}
          </button>
        </div>
      </div>
    </div>
  )
}
