/**
 * Toast.jsx — Notifications flottantes premium avec barre de progression
 */
import { useState, useEffect, useCallback } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'

let _addToast = null
let _toastId = 0
export function showToast(message, type = 'success') {
  if (_addToast) _addToast({ message, type, id: ++_toastId })
}

const CONFIGS = {
  success: {
    icon: CheckCircle2,
    bg: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)',
    progress: '#4ADE80',
    label: 'Succès',
  },
  error: {
    icon: XCircle,
    bg: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
    progress: '#FCA5A5',
    label: 'Erreur',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
    progress: '#FDE68A',
    label: 'Attention',
  },
  info: {
    icon: Info,
    bg: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
    progress: '#BAE6FD',
    label: 'Info',
  },
}

function ToastItem({ toast, onRemove }) {
  const [visible, setVisible] = useState(true)
  const cfg = CONFIGS[toast.type] ?? CONFIGS.success
  const Icon = cfg.icon

  const dismiss = useCallback(() => {
    setVisible(false)
    setTimeout(() => onRemove(toast.id), 280)
  }, [toast.id, onRemove])

  useEffect(() => {
    const t = setTimeout(dismiss, 4000)
    return () => clearTimeout(t)
  }, [dismiss])

  return (
    <div
      className={`toast-item ${visible ? 'animate-toast-in' : 'animate-toast-out'}`}
      role="alert"
      aria-live="polite"
      style={{ background: cfg.bg }}
    >
      <div className="toast-content">
        {/* Icon wrap */}
        <div className="toast-icon-wrap">
          <Icon size={18} className="text-white" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold text-white/70 uppercase tracking-wider leading-none mb-0.5">
            {cfg.label}
          </p>
          <p className="text-sm font-semibold text-white leading-snug">
            {toast.message}
          </p>
        </div>

        {/* Close */}
        <button
          onClick={dismiss}
          aria-label="Fermer la notification"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/15 transition-colors flex-shrink-0"
        >
          <X size={14} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="toast-progress" style={{ background: cfg.progress }} />
    </div>
  )
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((toast) => {
    setToasts((prev) => [...prev, toast])
  }, [])

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  useEffect(() => { _addToast = addToast }, [addToast])

  return (
    <div
      className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none"
      aria-label="Notifications"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={remove} />
      ))}
    </div>
  )
}
