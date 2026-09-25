/**
 * LoginPage.jsx — Connexion NORA Admin
 * Design : panneau gauche dégradé ENCG (desktop) + formulaire centré,
 * responsive mobile-first, erreurs accessibles avec animation shake.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Eye, EyeOff, LogIn, Loader2, ShieldCheck,
  Mail, Lock, AlertCircle, Database, Sparkles,
} from 'lucide-react'
import { login, getMe, setStoredToken, getStoredToken } from '../api/adminApi'

const FEATURES = [
  { icon: ShieldCheck, title: 'Accès sécurisé', desc: 'Sessions révocables avec expiration automatique' },
  { icon: Database,    title: 'Base de connaissances', desc: 'Gérez catégories et QAs en temps réel' },
  { icon: Sparkles,    title: 'IA synchronisée', desc: 'Régénération de l\'index sémantique en un clic' },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm]         = useState({ email: '', password: '' })
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [checking, setChecking] = useState(true)
  const [showPwd, setShowPwd]   = useState(false)

  useEffect(() => {
    if (!getStoredToken()) { setChecking(false); return }
    getMe().then(() => navigate('/', { replace: true })).catch(() => setChecking(false))
  }, [navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading) return
    setError('')
    if (!form.email.trim() || !form.password) { setError('Veuillez remplir tous les champs.'); return }
    setLoading(true)
    try {
      const data = await login(form.email.trim(), form.password)
      setStoredToken(data.token)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Identifiants incorrects.')
    } finally {
      setLoading(false)
    }
  }

  if (checking) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cream)' }}>
      <Loader2 size={28} style={{ color: 'var(--bordeaux)', animation: 'spin 1s linear infinite' }} />
    </div>
  )

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--cream)' }}>

      {/* ══ Panneau gauche — branding (desktop uniquement) ══════════════ */}
      <div className="hidden lg:flex flex-col w-[44%] relative overflow-hidden"
        style={{ background: 'linear-gradient(150deg, var(--bordeaux-dark) 0%, var(--bordeaux) 50%, var(--terracotta) 115%)' }}>

        {/* Motif arabesque */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.05]" viewBox="0 0 400 400" fill="none" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <pattern id="arabesqueLogin" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M40 0 L80 40 L40 80 L0 40 Z" stroke="white" strokeWidth="0.8" fill="none"/>
              <circle cx="40" cy="40" r="20" stroke="white" strokeWidth="0.6" fill="none"/>
              <path d="M20 20 L40 0 L60 20 L40 40 Z" stroke="white" strokeWidth="0.5" fill="none"/>
              <path d="M20 60 L40 40 L60 60 L40 80 Z" stroke="white" strokeWidth="0.5" fill="none"/>
            </pattern>
          </defs>
          <rect width="400" height="400" fill="url(#arabesqueLogin)"/>
        </svg>

        {/* Halo décoratif */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-15" aria-hidden="true"
          style={{ background: 'radial-gradient(circle, var(--cream) 0%, transparent 70%)' }} />

        <div className="relative flex flex-col h-full px-12 py-10">
          {/* Logo */}
          <img src="/Logo ENCG couleur.png" alt="ENCG Marrakech"
            className="h-14 object-contain self-start"
            style={{ filter: 'brightness(0) invert(1)' }} />

          {/* Titre */}
          <div className="my-auto max-w-md">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-white/80 text-xs font-semibold tracking-wide uppercase"
              style={{ background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.15)' }}>
              <ShieldCheck size={13} /> Back-office
            </span>
            <h1 className="font-display text-5xl xl:text-6xl font-bold text-white leading-[1.05] mt-6 mb-4">
              NORA<br />Admin
            </h1>
            <p className="text-white/65 text-base leading-relaxed mb-10">
              Pilotez la base de connaissances de l'assistant NORA : questions, réponses et catégories.
            </p>

            {/* Points forts */}
            <ul className="flex flex-col gap-4">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <li key={title} className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(255,255,255,.13)' }}>
                    <Icon size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold leading-tight">{title}</p>
                    <p className="text-white/50 text-xs leading-snug mt-0.5">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer */}
          <div>
            <div className="h-px mb-5" style={{ background: 'rgba(255,255,255,.12)' }} />
            <p className="text-white/40 text-xs leading-relaxed">
              © 2025 ENCG Marrakech — Université Cadi Ayyad<br />
              Accès réservé aux administrateurs autorisés.
            </p>
          </div>
        </div>
      </div>

      {/* ══ Panneau droit — formulaire ══════════════════════════════════ */}
      <div className="flex-1 flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[420px] animate-slide-up">

          {/* En-tête mobile : logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <img src="/Logo ENCG couleur.png" alt="ENCG Marrakech" className="h-12 object-contain" />
          </div>

          {/* Carte formulaire */}
          <div className="card px-7 py-8 sm:px-9 sm:py-10" style={{ boxShadow: 'var(--shadow-md)' }}>

            <div className="mb-7">
              <h2 className="font-display text-2xl sm:text-3xl font-bold mb-1.5" style={{ color: 'var(--brown)' }}>
                Connexion
              </h2>
              <p className="text-sm" style={{ color: 'var(--brown-muted)' }}>
                Accédez au tableau de bord d'administration
              </p>
            </div>

            {/* Erreur */}
            {error && (
              <div key={error} role="alert"
                className="flex items-start gap-2.5 px-4 py-3 rounded-xl mb-6 animate-shake"
                style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                <AlertCircle size={16} className="shrink-0 mt-0.5" style={{ color: 'var(--danger)' }} />
                <p className="text-sm font-medium" style={{ color: '#B91C1C' }}>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>

              {/* Email */}
              <div>
                <label htmlFor="admin-email"
                  className="block text-xs font-semibold uppercase tracking-wider mb-2"
                  style={{ color: 'var(--brown-muted)' }}>
                  Adresse e-mail
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: 'var(--brown-muted)' }} />
                  <input
                    id="admin-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoFocus
                    required
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="admin@encg.ma"
                    className="input-base"
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div>
                <label htmlFor="admin-password"
                  className="block text-xs font-semibold uppercase tracking-wider mb-2"
                  style={{ color: 'var(--brown-muted)' }}>
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: 'var(--brown-muted)' }} />
                  <input
                    id="admin-password"
                    type={showPwd ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="••••••••••"
                    className="input-base"
                    style={{ paddingLeft: '2.5rem', paddingRight: '2.75rem' }}
                  />
                  <button type="button"
                    onClick={() => setShowPwd(p => !p)}
                    aria-label={showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors hover:bg-black/5"
                    style={{ color: 'var(--brown-muted)' }}>
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button id="admin-login-btn" type="submit" disabled={loading}
                className="btn-primary w-full py-3 mt-1">
                {loading
                  ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Connexion en cours…</>
                  : <><LogIn size={16} /> Se connecter</>
                }
              </button>
            </form>
          </div>

          {/* Mention sécurité */}
          <p className="flex items-center justify-center gap-1.5 mt-6 text-xs" style={{ color: 'var(--brown-muted)' }}>
            <ShieldCheck size={13} style={{ color: 'var(--bordeaux)' }} />
            Connexion sécurisée — session valide 12 h
          </p>
        </div>
      </div>
    </div>
  )
}
