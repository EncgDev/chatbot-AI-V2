/**
 * App.jsx — Route guard + Layout principal
 * - Sans token valide → redirect /login
 * - Gestion état global : user, pendingEmbeddings, regenLoading
 */
import { useState, useEffect } from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from 'react-router-dom'

import DashboardLayout from './components/DashboardLayout'
import LoginPage       from './pages/LoginPage'
import CategoriesPage  from './pages/CategoriesPage'
import QAsPage         from './pages/QAsPage'
import ToastContainer, { showToast } from './components/Toast'

import { getMe, getStoredToken, clearStoredToken, regenerateEmbeddings } from './api/adminApi'
import { Loader2 } from 'lucide-react'

// ─── Composant protégé ────────────────────────────────────────────────────────
function ProtectedApp() {
  const navigate  = useNavigate()
  const [user, setUser]                       = useState(null)
  const [checking, setChecking]               = useState(true)
  const [pendingEmbeddings, setPendingEmbeddings] = useState(false)
  const [regenLoading, setRegenLoading]       = useState(false)

  // Vérifie le token au mount
  useEffect(() => {
    if (!getStoredToken()) { navigate('/login', { replace: true }); return }
    getMe()
      .then((res) => { setUser(res.user); setChecking(false) })
      .catch(() => {
        clearStoredToken()
        navigate('/login', { replace: true })
      })
  }, [navigate])

  // Quand un QA change → lève la bannière
  const handleQAChange = () => setPendingEmbeddings(true)

  // Régénération embeddings
  const handleRegenerate = async () => {
    setRegenLoading(true)
    try {
      const res = await regenerateEmbeddings()
      setPendingEmbeddings(false)
      showToast(`✓ ${res.count ?? '?'} QAs vectorisés avec succès.`, 'success')
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setRegenLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cream)' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--bordeaux)' }} />
      </div>
    )
  }

  return (
    <DashboardLayout
      user={user}
      pendingEmbeddings={pendingEmbeddings}
      onRegenerate={handleRegenerate}
      regenLoading={regenLoading}
    >
      <Routes>
        <Route path="/"            element={<Navigate to="/categories" replace />} />
        <Route path="/categories"  element={<CategoriesPage onQAChange={handleQAChange} />} />
        <Route path="/qas"         element={<QAsPage onQAChange={handleQAChange} />} />
        <Route path="*"            element={<Navigate to="/categories" replace />} />
      </Routes>
    </DashboardLayout>
  )
}

// ─── Racine ───────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*"     element={<ProtectedApp />} />
      </Routes>
    </BrowserRouter>
  )
}
