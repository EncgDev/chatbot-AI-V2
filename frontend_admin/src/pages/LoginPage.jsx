/**
 * LoginPage.jsx — Connexion NORA Admin
 * Split-screen avec vague : panneau bordeaux à gauche (NORA Admin + robot),
 * formulaire sur fond blanc à droite. Palette ENCG, typo Poppins/Playfair.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Eye, EyeOff, Loader2, ShieldCheck,
  Mail, Lock, AlertCircle, ArrowRight, CheckCircle2,
} from 'lucide-react'
import { login, getMe, setStoredToken, getStoredToken } from '../api/adminApi'

/* Fonctionnalités mises en avant dans le panneau (liées au back-office) */
const PANEL_FEATURES = [
  'Gestion des catégories & QAs',
  'Base de connaissances temps réel',
  'Régénération de l\'index IA',
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
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#FFFFFF' }}>
      <Loader2 size={28} style={{ color: 'var(--bordeaux)', animation: 'spin 1s linear infinite' }} />
    </div>
  )

  return (
    <div className="min-h-screen flex relative" style={{ background: '#FFFFFF' }}>

      {/* ══ Panneau gauche — bordeaux profond ═══════════════════════════ */}
      <div className="hidden lg:flex flex-col w-[42%] shrink-0 relative overflow-hidden"
        style={{ background: 'linear-gradient(170deg, #8A1215 0%, #7A0F12 55%, #6B1113 100%)' }}>

        {/* Motif cercles embossé (subtil) */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.05]" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <pattern id="panelCircles" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
              <circle cx="40" cy="40" r="24" stroke="white" strokeWidth="0.8" fill="none"/>
              <circle cx="40" cy="40" r="12" stroke="white" strokeWidth="0.5" fill="none"/>
              <circle cx="0" cy="0" r="14" stroke="white" strokeWidth="0.5" fill="none"/>
              <circle cx="80" cy="0" r="14" stroke="white" strokeWidth="0.5" fill="none"/>
              <circle cx="0" cy="80" r="14" stroke="white" strokeWidth="0.5" fill="none"/>
              <circle cx="80" cy="80" r="14" stroke="white" strokeWidth="0.5" fill="none"/>
            </pattern>
          </defs>
          <rect width="400" height="400" fill="url(#panelCircles)"/>
        </svg>

        {/* Halo lumineux derrière le robot */}
        <div className="absolute top-[38%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[26rem] h-[26rem] rounded-full opacity-25" aria-hidden="true"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,.30) 0%, transparent 65%)' }} />

        <div className="relative z-10 flex flex-col h-full px-10 pt-10 pb-9 text-center">

          {/* Haut : badge + titre + sous-titre */}
          <div>
            <span className="font-modern inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-white/90 text-[10px] font-semibold tracking-[0.22em] uppercase"
              style={{ background: 'rgba(255,255,255,.13)', border: '1px solid rgba(255,255,255,.20)' }}>
              <ShieldCheck size={11} /> Back-office sécurisé
            </span>
            <h1 className="font-display text-[2.6rem] xl:text-5xl font-bold text-white leading-[1.08] mt-5">
              NORA Admin
            </h1>
            <p className="font-modern text-white/65 text-[13px] leading-relaxed max-w-[250px] mx-auto mt-3">
              Console d'administration de l'assistant intelligent de l'ENCG Marrakech
            </p>
          </div>

          {/* Centre : robot NORA */}
          <div className="flex-1 flex items-center justify-center">
            <img src="/nora_robot.png" alt="Mascotte NORA"
              className="animate-float-slow w-64 xl:w-80 object-contain drop-shadow-2xl" />
          </div>

          {/* Bas : fonctionnalités (bloc centré, textes alignés à gauche) */}
          <div className="flex justify-center mb-3">
            <ul className="font-modern flex flex-col items-start gap-3">
              {PANEL_FEATURES.map((text) => (
                <li key={text} className="flex items-center gap-2.5 text-white/75 text-xs font-medium">
                  <CheckCircle2 size={13} className="text-white/50 shrink-0" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ══ Vague blanche de séparation (desktop) ═══════════════════════ */}
      <svg className="hidden lg:block absolute inset-y-0 z-10 pointer-events-none h-full"
        style={{ left: '42%', width: '150px', transform: 'translateX(-50%)', filter: 'drop-shadow(-10px 0 18px rgba(60,10,12,.18))' }}
        viewBox="0 0 150 100" preserveAspectRatio="none" aria-hidden="true">
        <path d="M150 0 C 25 18, 115 52, 40 100 L150 100 Z" fill="#FFFFFF" />
      </svg>

      {/* Lignes décoratives fines (bordeaux) traversant le côté blanc */}
      <svg className="hidden lg:block absolute inset-y-0 z-0 pointer-events-none h-full"
        style={{ left: '34%', width: '56%' }}
        viewBox="0 0 560 100" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 42 C 60 30, 20 8, 110 20 S 240 55, 200 72 S 380 90, 540 92" stroke="var(--bordeaux)" strokeWidth="0.45" fill="none" opacity="0.16"/>
        <path d="M0 96 C 90 80, 150 62, 250 70 S 430 88, 560 84" stroke="var(--terracotta)" strokeWidth="0.35" fill="none" opacity="0.12"/>
        <path d="M120 100 C 150 80, 90 60, 160 45 S 300 18, 430 12" stroke="var(--bordeaux)" strokeWidth="0.3" fill="none" opacity="0.09"/>
      </svg>

      {/* ══ Panneau droit — blanc, formulaire ═══════════════════════════ */}
      <div className="flex-1 flex flex-col relative min-w-0 z-20">

        {/* Logos institutionnels — haut à droite */}
        <header className="px-6 sm:px-10 pt-5 flex items-center justify-end gap-4">
          <img src="/Logo ENCG couleur.png" alt="ENCG Marrakech — Université Cadi Ayyad" className="h-11 sm:h-12 object-contain" />
        </header>

        {/* Formulaire centré */}
        <div className="flex-1 flex items-center justify-center px-6 py-6">
          <div className="w-full max-w-sm animate-slide-up">

            {/* Robot mobile */}
            <div className="lg:hidden flex justify-center mb-4">
              <img src="/nora_robot.png" alt="" aria-hidden="true" className="w-36 object-contain drop-shadow-xl" />
            </div>

            {/* Grand titre */}
            <h2 className="font-modern font-extrabold text-[1.85rem] sm:text-4xl leading-[1.15] tracking-tight"
              style={{ color: '#26221F' }}>
              Gérez la<br />connaissance.<br />Propulsez NORA !
            </h2>

            {/* Erreur */}
            {error && (
              <div key={error} role="alert"
                className="flex items-start gap-2.5 px-4 py-3 rounded-xl mt-6 animate-shake"
                style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                <AlertCircle size={16} className="shrink-0 mt-0.5" style={{ color: 'var(--danger)' }} />
                <p className="text-sm font-medium" style={{ color: '#B91C1C' }}>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-8" noValidate>

              {/* Email */}
              <div>
                <label htmlFor="admin-email"
                  className="font-modern block text-[13px] font-semibold mb-2"
                  style={{ color: '#57504A' }}>
                  Adresse e-mail
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
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
                    placeholder="Adresse e-mail"
                    className="input-box"
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div>
                <label htmlFor="admin-password"
                  className="font-modern block text-[13px] font-semibold mb-2"
                  style={{ color: '#57504A' }}>
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: 'var(--brown-muted)' }} />
                  <input
                    id="admin-password"
                    type={showPwd ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Entrez votre mot de passe"
                    className="input-box"
                    style={{ paddingRight: '2.75rem' }}
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

              {/* Submit + lien oublié */}
              <div className="flex flex-col items-center mt-1">
                <button id="admin-login-btn" type="submit" disabled={loading}
                  className="font-modern w-[65%] py-3 inline-flex items-center justify-center gap-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0"
                  style={{
                    background: 'var(--bordeaux)',
                    boxShadow: '0 6px 16px rgba(133,24,26,.30)',
                  }}>
                  {loading
                    ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Connexion…</>
                    : <span className="flex items-center gap-2">Se connecter <ArrowRight size={16} /></span>
                  }
                </button>
                <span className="font-modern mt-3 text-xs font-medium cursor-pointer transition-colors hover:opacity-80"
                  style={{ color: 'var(--brown-muted)' }}
                  title="Contactez l'administrateur système pour réinitialiser votre mot de passe.">
                  Mot de passe oublié ?
                </span>
              </div>
            </form>
          </div>
        </div>

      </div>

      {/* Footer centré sur toute la largeur (à cheval sur les deux panneaux) */}
      <footer className="absolute bottom-3.5 left-0 right-0 z-30 text-center pointer-events-none">
        <p className="font-modern inline-flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--brown-muted)' }}>
          <Lock size={11} style={{ color: 'var(--bordeaux)' }} />
          © 2025 ENCG Marrakech | Connexion sécurisée — session valide 12 h
        </p>
      </footer>
    </div>
  )
}
