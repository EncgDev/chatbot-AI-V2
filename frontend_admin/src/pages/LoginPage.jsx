/**
 * LoginPage.jsx — Connexion NORA Admin — Premium v4
 * Form parfaitement centré, panneau gauche plus immersif
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Eye, EyeOff, Loader2, ShieldCheck,
  Mail, Lock, AlertCircle, ArrowRight, CheckCircle2,
} from 'lucide-react'
import { login, getMe, setStoredToken, getStoredToken } from '../api/adminApi'

const PANEL_FEATURES = [
  'Gestion des catégories & QAs',
  'Synchronisation IA temps réel',
  'Interface sécurisée · JWT',
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
    if (!form.email.trim() || !form.password) {
      setError('Veuillez remplir tous les champs.')
      return
    }
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F4F6F9' }}>
      <Loader2 size={28} style={{ color: 'var(--brand)', animation: 'spin 1s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', overflow: 'hidden' }}>

      {/* ══ Panneau gauche ══════════════════════════════════ */}
      <div style={{
        display: 'none',
        width: '42%',
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(155deg, #6B0018 0%, #800020 45%, #9A0B2E 100%)',
        flexDirection: 'column',
      }} className="lg:!flex">

        {/* Pattern */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.06 }}
          viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <pattern id="hexPat" x="0" y="0" width="56" height="56" patternUnits="userSpaceOnUse">
              <polygon points="28,4 52,18 52,46 28,52 4,46 4,18"
                stroke="white" strokeWidth="0.7" fill="none" />
            </pattern>
          </defs>
          <rect width="400" height="400" fill="url(#hexPat)" />
        </svg>

        {/* Glow */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,.08) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} aria-hidden="true" />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%', padding: '40px 44px' }}>

          {/* Badge */}
          <div>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '7px 14px', borderRadius: 99,
              background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.20)',
              color: 'rgba(255,255,255,.85)', fontSize: 10.5, fontWeight: 700,
              letterSpacing: '0.18em', textTransform: 'uppercase',
            }}>
              <ShieldCheck size={11} /> Back-office sécurisé
            </span>

            <h1 style={{
              fontFamily: "'Plus Jakarta Sans', Inter, sans-serif",
              fontSize: 52, fontWeight: 900, color: 'white',
              lineHeight: 1.05, marginTop: 22, letterSpacing: -1,
            }}>
              NORA
            </h1>
            <p style={{
              fontSize: 18, fontWeight: 400, color: 'rgba(255,255,255,.55)',
              marginTop: 2, marginBottom: 12,
            }}>
              Admin Console
            </p>
            <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,.45)', lineHeight: 1.7, maxWidth: 240 }}>
              Console d'administration de l'assistant intelligent de l'ENCG Marrakech
            </p>
          </div>

          {/* Robot */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src="/nora_robot.png"
              alt="NORA"
              className="animate-float-slow"
              style={{ width: 220, objectFit: 'contain', filter: 'drop-shadow(0 20px 40px rgba(0,0,0,.3))' }}
            />
          </div>

          {/* Features */}
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {PANEL_FEATURES.map((f, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(255,255,255,.13)', border: '1px solid rgba(255,255,255,.18)',
                }}>
                  <CheckCircle2 size={13} style={{ color: 'rgba(255,255,255,.75)' }} />
                </div>
                <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,.7)', fontWeight: 500 }}>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ══ Séparateur ══════════════════════════════════════ */}
      <svg className="hidden lg:block"
        style={{
          position: 'absolute', top: 0, bottom: 0, zIndex: 10,
          left: '42%', width: 100, transform: 'translateX(-50%)',
          filter: 'drop-shadow(-10px 0 16px rgba(40,0,8,.18))',
          pointerEvents: 'none', height: '100%',
        }}
        viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path d="M100 0 C 15 18, 85 50, 20 100 L100 100 Z" fill="#F4F6F9" />
      </svg>

      {/* ══ Panneau droit — Formulaire ══════════════════════ */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        background: '#F4F6F9', position: 'relative', zIndex: 20,
      }}>

        {/* ENCG Logo top right */}
        <header style={{ padding: '20px 40px', display: 'flex', justifyContent: 'flex-end' }}>
          <img src="/Logo ENCG couleur.png" alt="ENCG Marrakech"
            style={{ height: 48, objectFit: 'contain' }} />
        </header>

        {/* Form — parfaitement centré */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px 40px' }}>
          <div style={{ width: '100%', maxWidth: 400 }} className="animate-fade-up">

            {/* Mobile robot */}
            <div className="lg:hidden" style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
              <img src="/nora_robot.png" alt="" aria-hidden="true"
                style={{ width: 96, objectFit: 'contain', filter: 'drop-shadow(0 8px 20px rgba(128,0,32,.2))' }} />
            </div>

            {/* Heading */}
            <div style={{ marginBottom: 32 }}>
              <h2 style={{
                fontFamily: "'Plus Jakarta Sans', Inter, sans-serif",
                fontSize: 34, fontWeight: 900,
                color: '#0F172A', lineHeight: 1.15, letterSpacing: -0.5,
              }}>
                Bienvenue<br />
                <span style={{ color: 'var(--brand)' }}>sur NORA</span>
              </h2>
              <p style={{ fontSize: 13.5, color: '#64748B', marginTop: 10, lineHeight: 1.6 }}>
                Connectez-vous pour accéder au tableau de bord.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div role="alert" className="animate-shake"
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '12px 14px', borderRadius: 12, marginBottom: 20,
                  background: '#FEF2F2', border: '1px solid #FECACA',
                }}>
                <AlertCircle size={15} style={{ color: '#EF4444', flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 13, fontWeight: 600, color: '#B91C1C' }}>{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }} noValidate>

              {/* Email */}
              <div>
                <label htmlFor="admin-email" style={{
                  display: 'block', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.07em', color: '#475569', marginBottom: 7,
                }}>
                  Adresse e-mail <span style={{ color: 'var(--brand)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{
                    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                    pointerEvents: 'none', color: '#94A3B8',
                  }} />
                  <input
                    id="admin-email" type="email" inputMode="email"
                    autoComplete="email" autoFocus required
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="admin@encg-marrakech.ma"
                    className="input-box"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="admin-password" style={{
                  display: 'block', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.07em', color: '#475569', marginBottom: 7,
                }}>
                  Mot de passe <span style={{ color: 'var(--brand)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{
                    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                    pointerEvents: 'none', color: '#94A3B8',
                  }} />
                  <input
                    id="admin-password"
                    type={showPwd ? 'text' : 'password'}
                    autoComplete="current-password" required
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="••••••••••"
                    className="input-box"
                    style={{ paddingRight: 44 }}
                  />
                  <button type="button"
                    onClick={() => setShowPwd(p => !p)}
                    aria-label={showPwd ? 'Masquer' : 'Afficher'}
                    style={{
                      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: 'none', background: 'transparent', cursor: 'pointer',
                      color: '#94A3B8', borderRadius: 8, transition: 'background .15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F1F5F9'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                <button id="admin-login-btn" type="submit" disabled={loading}
                  className="btn btn-primary"
                  style={{
                    width: '100%', height: 50, fontSize: 14, fontWeight: 700,
                    borderRadius: 14,
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      Connexion en cours…
                    </>
                  ) : (
                    <>Se connecter <ArrowRight size={16} /></>
                  )}
                </button>
                <button type="button"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 12.5, color: '#94A3B8', fontWeight: 500,
                    padding: '4px 0', textAlign: 'center',
                    transition: 'color .15s',
                  }}
                  title="Contactez l'administrateur système."
                  onMouseEnter={e => e.currentTarget.style.color = '#64748B'}
                  onMouseLeave={e => e.currentTarget.style.color = '#94A3B8'}
                >
                  Mot de passe oublié ?
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <footer style={{ padding: '0 40px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: '#CBD5E1', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Lock size={9} style={{ color: 'var(--brand)' }} />
            © {new Date().getFullYear()} ENCG Marrakech · Session sécurisée 12h
          </p>
        </footer>
      </div>
    </div>
  )
}
