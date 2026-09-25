/**
 * Toast.jsx — Notifications flottantes succès / erreur / warning
 */
import { useState, useEffect, useCallback } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

// ─── Gestionnaire global de toasts ───────────────────────────────────────────
let _addToast = null
let _toastId = 0
export function showToast(message, type = 'success') {
  if (_addToast) _addToast({ message, type, id: ++_toastId })
}

// ─── Conteneur des toasts ─────────────────────────────────────────────────────
export default function ToastContainer() {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((toast) => {
    setToasts((prev) => [...prev, toast])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toast.id))
    }, 4000)
  }, [])

  useEffect(() => { _addToast = addToast }, [addToast])

  const remove = (id) => setToasts((prev) => prev.filter((t) => t.id !== id))

  const icons = {
    success: <CheckCircle size={18} className="text-white flex-shrink-0" />,
    error:   <XCircle    size={18} className="text-white flex-shrink-0" />,
    warning: <AlertTriangle size={18} className="text-white flex-shrink-0" />,
    info:    <Info size={18} className="text-white flex-shrink-0" />,
  }
  const bg = {
    success: 'bg-emerald-600',
    error:   'bg-red-600',
    warning: 'bg-amber-500',
    info:    'bg-blue-600',
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="alert"
          className={`${bg[t.type] ?? bg.success} pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-white text-sm font-medium min-w-[280px] max-w-sm animate-slide-right`}
        >
          {icons[t.type]}
          <span className="flex-1">{t.message}</span>
          <button
            onClick={() => remove(t.id)}
            aria-label="Fermer la notification"
            className="opacity-75 hover:opacity-100 transition-opacity"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
