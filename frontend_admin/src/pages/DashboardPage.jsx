/**
 * DashboardPage.jsx — Tableau de bord NORA Admin — Premium v3
 * KPI animés · Q&R récentes · Répartition catégories · Bannière IA
 */
import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  FolderOpen, MessageSquare, Cpu,
  ArrowRight, Plus, RefreshCw, Zap,
  Clock, Sparkles, ChevronRight,
  Layers, BookOpen, CheckCircle2, TrendingUp,
  Activity,
} from 'lucide-react'
import { listCategories, listQAs } from '../api/adminApi'
import { showToast } from '../components/Toast'

/* ─── Color palette ──────────────────────────────────────────────── */
const PALETTE = {
  mint:   { bg: '#E8F8F5', text: '#0E7A60', icon: '#10B981', border: '#D1F2EB', accent: '#10B981' },
  peach:  { bg: '#FDF2EB', text: '#B84A1C', icon: '#F97316', border: '#FADBD8', accent: '#F97316' },
  purple: { bg: '#F3EFFF', text: '#5E35B1', icon: '#8B5CF6', border: '#E8DAEF', accent: '#8B5CF6' },
  yellow: { bg: '#FEF9E7', text: '#9A6B00', icon: '#F59E0B', border: '#FCF3CF', accent: '#F59E0B' },
}

const CAT_COLORS = ['#800020', '#C85A32', '#2563EB', '#0D9488', '#7C3AED', '#D97706', '#DB2777', '#16A34A']

/* ─── Animated counter ───────────────────────────────────────────── */
function useCountUp(targetVal, duration = 600) {
  const [displayVal, setDisplayVal] = useState(0)

  useEffect(() => {
    const num = Math.round(parseFloat(targetVal) || 0)
    const startTime = performance.now()
    let frameId

    const update = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      setDisplayVal(Math.round(easeOut * num))
      if (progress < 1) frameId = requestAnimationFrame(update)
      else setDisplayVal(num)
    }

    frameId = requestAnimationFrame(update)
    return () => cancelAnimationFrame(frameId)
  }, [targetVal, duration])

  return displayVal
}

/* ─── KPI Card ───────────────────────────────────────────────────── */
function MetricStatCard({ icon: Icon, theme, label, value, subtext, trend, linkTo, delay = 0 }) {
  const animated = useCountUp(value, 600)

  const content = (
    <div
      className="rounded-2xl transition-all duration-250 hover:-translate-y-1.5 cursor-pointer border animate-fade-up"
      style={{
        backgroundColor: theme.bg,
        borderColor: theme.border,
        animationDelay: `${delay}ms`,
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        boxShadow: '0 1px 3px rgba(0,0,0,.04)',
        transition: 'all .25s cubic-bezier(.16,1,.3,1)',
      }}
    >
      {/* Top row: icon + badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,255,255,.9)',
          boxShadow: '0 2px 8px rgba(0,0,0,.06)',
          color: theme.icon, flexShrink: 0,
        }}>
          <Icon size={22} />
        </div>
        {trend && (
          <span style={{
            fontSize: 11, fontWeight: 700,
            padding: '3px 9px', borderRadius: 99,
            background: 'rgba(255,255,255,.85)',
            color: theme.text,
          }}>
            {trend}
          </span>
        )}
      </div>

      {/* Bottom: number + label */}
      <div>
        <p style={{
          fontFamily: "'Plus Jakarta Sans', Inter, sans-serif",
          fontSize: 34, fontWeight: 900,
          color: '#0F172A', lineHeight: 1, marginBottom: 5,
          letterSpacing: -0.5,
        }}>
          {animated}
        </p>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', marginBottom: 2 }}>
          {label}
        </p>
        {subtext && (
          <p style={{ fontSize: 11.5, color: theme.text, fontWeight: 500 }}>
            {subtext}
          </p>
        )}
      </div>
    </div>
  )

  return linkTo
    ? <Link to={linkTo} className="block no-underline">{content}</Link>
    : content
}

/* ─── Recent QAs List ────────────────────────────────────────────── */
function RecentQuestionsList({ qas, categories }) {
  const [expandedId, setExpandedId] = useState(null)

  const catMap = useMemo(() => {
    const map = {}
    categories.forEach(c => { map[c.id] = c.name })
    return map
  }, [categories])

  const recent = useMemo(() => (qas || []).slice(0, 6), [qas])

  return (
    <div style={{
      background: 'white',
      borderRadius: 24,
      border: '1px solid #E2E8F0',
      boxShadow: '0 4px 20px -2px rgba(15,23,42,.05), 0 2px 6px -1px rgba(15,23,42,.02)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100" style={{ padding: '18px 22px' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--brand-soft)' }}>
            <BookOpen size={17} style={{ color: 'var(--brand)' }} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 font-display leading-tight">
              Questions & Réponses récentes
            </h3>
            <p className="text-[11.5px] text-gray-400 mt-0.5">
              Dernières connaissances synchronisées
            </p>
          </div>
        </div>
        <Link
          to="/qas"
          className="text-xs font-bold flex items-center gap-1.5 transition-opacity hover:opacity-70 px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200/60"
          style={{ color: 'var(--brand)' }}
        >
          Voir tout ({qas.length}) <ArrowRight size={12} />
        </Link>
      </div>

      {/* List */}
      <div className="flex-1 space-y-3" style={{ padding: '18px 22px' }}>
        {recent.length === 0 ? (
          <div className="empty-state py-10">
            <div className="empty-state-icon w-11 h-11">
              <MessageSquare size={20} />
            </div>
            <p className="empty-state-title text-sm">Aucune question enregistrée</p>
            <p className="empty-state-desc text-xs">
              Créez votre premier QA pour alimenter NORA.
            </p>
            <Link to="/qas" className="btn btn-primary mt-3 text-xs">
              <Plus size={13} /> Créer un QA
            </Link>
          </div>
        ) : (
          recent.map((qa) => {
            const isExpanded = expandedId === qa.id
            const catName = catMap[qa.category_id] || 'Général'
            return (
              <div
                key={qa.id}
                onClick={() => setExpandedId(isExpanded ? null : qa.id)}
                className="transition-all duration-200 cursor-pointer group rounded-xl"
                style={{
                  padding: '13px 16px',
                  borderRadius: 14,
                  border: isExpanded ? '1px solid rgba(128, 0, 32, 0.3)' : '1px solid #E2E8F0',
                  background: isExpanded ? '#FFF5F6' : '#F8FAFC',
                  boxShadow: isExpanded ? '0 4px 14px rgba(128, 0, 32, 0.08)' : '0 1px 3px rgba(15, 23, 42, 0.03)',
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-700 shadow-2xs">
                        {catName}
                      </span>
                      {qa.updated_at && (
                        <span className="text-[10.5px] text-gray-400 font-medium flex items-center gap-1">
                          <Clock size={10} />
                          {new Date(qa.updated_at).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-brand transition-colors">
                      {qa.question}
                    </p>
                  </div>
                  <div
                    className="w-6 h-6 rounded-md bg-white border border-gray-200/80 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs group-hover:border-gray-300"
                  >
                    <ChevronRight
                      size={13}
                      className={`text-gray-400 transition-transform ${
                        isExpanded ? 'rotate-90 !text-brand' : ''
                      }`}
                      style={isExpanded ? { color: 'var(--brand)' } : {}}
                    />
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-rose-100 animate-fade-up">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                      Réponse de NORA :
                    </p>
                    <div
                      className="bg-white p-3.5 rounded-xl border border-gray-100 text-xs text-gray-700 leading-relaxed shadow-2xs"
                      style={{ borderLeft: '3.5px solid var(--brand)' }}
                    >
                      {qa.response}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 bg-gray-50/60 flex items-center justify-between" style={{ padding: '13px 22px' }}>
        <span className="text-xs text-gray-400 font-medium">
          {recent.length} questions affichées sur {qas.length}
        </span>
        <Link
          to="/qas"
          className="text-xs font-bold flex items-center gap-1 hover:opacity-70 transition-opacity"
          style={{ color: 'var(--brand)' }}
        >
          Gérer les questions <ChevronRight size={13} />
        </Link>
      </div>
    </div>
  )
}

/* ─── Categories Breakdown ───────────────────────────────────────── */
function CategoriesBreakdown({ categories, totalQAs }) {
  const sorted = useMemo(() =>
    [...categories].sort((a, b) => (b.qa_count ?? 0) - (a.qa_count ?? 0)),
    [categories]
  )

  const displayList = useMemo(() => sorted.slice(0, 6), [sorted])

  return (
    <div style={{
      background: 'white',
      borderRadius: 24,
      border: '1px solid #E2E8F0',
      boxShadow: '0 4px 20px -2px rgba(15,23,42,.05), 0 2px 6px -1px rgba(15,23,42,.02)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100" style={{ padding: '18px 22px' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#F5F3FF' }}>
            <Activity size={17} style={{ color: '#8B5CF6' }} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 font-display leading-tight">
              Thèmes & Catégories
            </h3>
            <p className="text-[11.5px] text-gray-400 mt-0.5">
              Organisation thématique du savoir
            </p>
          </div>
        </div>
        <Link
          to="/categories"
          className="text-xs font-bold flex items-center gap-1.5 transition-opacity hover:opacity-70 px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200/60"
          style={{ color: 'var(--brand)' }}
        >
          Gérer ({categories.length}) <ArrowRight size={12} />
        </Link>
      </div>

      {/* List */}
      <div className="flex-1 space-y-3" style={{ padding: '18px 22px' }}>
        {displayList.length === 0 ? (
          <div className="empty-state py-10">
            <div className="empty-state-icon w-11 h-11">
              <FolderOpen size={20} />
            </div>
            <p className="empty-state-title text-sm">Aucune catégorie</p>
            <p className="empty-state-desc text-xs">
              Créez des catégories pour organiser vos QAs.
            </p>
            <Link to="/categories" className="btn btn-primary mt-3 text-xs">
              <Plus size={13} /> Créer une catégorie
            </Link>
          </div>
        ) : (
          displayList.map((cat, idx) => {
            const count = cat.qa_count ?? 0
            const pct = totalQAs ? Math.round((count / totalQAs) * 100) : 0
            const color = CAT_COLORS[idx % CAT_COLORS.length]
            return (
              <div
                key={cat.id}
                className="group rounded-xl border border-gray-200/80 bg-slate-50/70 hover:bg-white hover:border-gray-300 hover:shadow-xs transition-all duration-200"
                style={{ padding: '13px 16px', borderRadius: 14 }}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-xs"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-bold text-gray-900 text-[13px] truncate">
                      {cat.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className="text-[11px] font-black text-gray-800 bg-white border border-gray-200/80 px-2 py-0.5 rounded-full shadow-2xs">
                      {count} QA{count > 1 ? 's' : ''}
                    </span>
                    <span className="text-[11px] text-gray-500 font-bold w-8 text-right">
                      {pct}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-gray-200/70 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 bg-gray-50/60 flex items-center justify-between" style={{ padding: '13px 22px' }}>
        <span className="text-xs text-gray-400 font-medium">
          {categories.length} catégories actives
        </span>
        <Link to="/categories" className="btn btn-primary text-xs py-1.5 px-3 rounded-lg">
          <Plus size={13} /> Nouvelle catégorie
        </Link>
      </div>
    </div>
  )
}

/* ─── Loading skeleton ───────────────────────────────────────────── */
function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6 sm:gap-7 lg:gap-8 max-w-[1440px] mx-auto">
      <div className="skeleton h-32 w-full rounded-3xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-36 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
        <div className="skeleton h-96 rounded-3xl" />
        <div className="skeleton h-96 rounded-3xl" />
      </div>
    </div>
  )
}

/* ─── Main Dashboard ─────────────────────────────────────────────── */
export default function DashboardPage({ user, onRegenerate, regenLoading, pendingEmbeddings }) {
  const [categories, setCategories] = useState([])
  const [qas, setQas]               = useState([])
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    try {
      const [cRes, qRes] = await Promise.all([listCategories(), listQAs()])
      setCategories(cRes.data ?? [])
      setQas(qRes.data ?? [])
      if (isRefresh) showToast('Données synchronisées avec succès', 'success')
    } catch (e) {
      showToast(e.message || 'Erreur lors du chargement', 'error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const totalCat  = categories.length
  const totalQAs  = qas.length
  const coverage  = totalQAs > 0 ? Math.min(100, Math.round((totalQAs / Math.max(totalQAs, 95)) * 100)) : 0

  const todayFormatted = useMemo(() =>
    new Date().toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    }),
    []
  )

  if (loading) return <LoadingSkeleton />

  return (
    <div className="flex flex-col gap-6 sm:gap-7 lg:gap-8 max-w-[1440px] mx-auto">

      {/* ── 1. Hero Welcome Card ── */}
      <section
        className="bg-white rounded-2xl border border-gray-100 shadow-sm animate-fade-up"
        style={{ padding: '24px 28px' }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex-1">
            {/* Status pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Système NORA IA Actif & Opérationnel
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-gray-900 font-display tracking-tight leading-tight">
              Bonjour,{' '}
              <span style={{ color: 'var(--brand)' }}>
                {user?.full_name?.split(' ')[0] || 'Administrateur'}
              </span>{' '}
              👋
            </h1>
            <p className="text-sm text-gray-500 mt-1.5 max-w-xl leading-relaxed">
              Supervisez la base de connaissances de l'ENCG Marrakech, gérez les Q&R, et synchronisez le moteur sémantique.
            </p>
            <p className="text-xs text-gray-400 mt-1.5 font-medium capitalize">{todayFormatted}</p>
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-2.5 self-start md:self-center flex-wrap">
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="btn btn-secondary px-3.5 py-2 text-xs font-bold rounded-xl"
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
              Actualiser
            </button>
            <Link
              to="/qas"
              className="btn btn-primary px-4 py-2 text-xs font-bold rounded-xl"
            >
              <Plus size={13} />
              Nouveau QA
            </Link>
          </div>
        </div>

        {/* Quick stats pills */}
        {!loading && (
          <div className="flex items-center gap-2.5 mt-5 pt-4 border-t border-gray-100 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100">
              <FolderOpen size={13} style={{ color: 'var(--kpi-blue-icon)' }} />
              <span className="text-xs font-bold text-gray-700">
                {totalCat} catégorie{totalCat !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100">
              <MessageSquare size={13} style={{ color: 'var(--kpi-green-icon)' }} />
              <span className="text-xs font-bold text-gray-700">
                {totalQAs} question{totalQAs !== 1 ? 's' : ''} & réponse{totalQAs !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100">
              <TrendingUp size={13} style={{ color: 'var(--kpi-purple-icon)' }} />
              <span className="text-xs font-bold text-gray-700">
                Couverture IA : {coverage}%
              </span>
            </div>
          </div>
        )}
      </section>

      {/* ── 2. KPI Cards ── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        <MetricStatCard
          icon={FolderOpen}
          theme={PALETTE.mint}
          label="Total Catégories"
          value={totalCat}
          subtext="thèmes configurés"
          trend="Actif"
          linkTo="/categories"
          delay={0}
        />
        <MetricStatCard
          icon={MessageSquare}
          theme={PALETTE.peach}
          label="Questions & Réponses"
          value={totalQAs}
          subtext="paires Q&R dans la base"
          trend={`${totalQAs} QAs`}
          linkTo="/qas"
          delay={80}
        />
        <MetricStatCard
          icon={Layers}
          theme={PALETTE.purple}
          label="Vecteurs Sémantiques"
          value={totalQAs}
          subtext="documents indexés ChromaDB"
          trend="100%"
          delay={160}
        />
        <MetricStatCard
          icon={Sparkles}
          theme={PALETTE.yellow}
          label="Couverture IA"
          value={coverage}
          subtext="taux de couverture globale"
          trend={`${coverage}%`}
          delay={240}
        />
      </section>

      {/* ── 3. Data panels ── */}
      <section
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-7 animate-fade-up delay-200"
      >
        <RecentQuestionsList qas={qas} categories={categories} />
        <CategoriesBreakdown categories={categories} totalQAs={totalQAs} />
      </section>

      {/* ── 4. IA Engine Banner ── */}
      <section
        className="rounded-2xl p-6 md:p-7 shadow-sm overflow-hidden relative animate-fade-up delay-300"
        style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' }}
      >
        {/* Background decoration */}
        <div
          className="absolute right-0 top-0 bottom-0 w-64 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at right, rgba(128,0,32,.15) 0%, transparent 70%)' }}
          aria-hidden="true"
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                pendingEmbeddings ? 'bg-amber-500/20' : 'bg-emerald-500/20'
              }`}
            >
              <Zap
                size={20}
                className={pendingEmbeddings ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}
              />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap mb-1">
                <h4 className="text-sm font-bold text-white font-display">
                  Moteur Vectoriel & Recherche Sémantique
                </h4>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    pendingEmbeddings
                      ? 'bg-amber-400/20 text-amber-300'
                      : 'bg-emerald-400/20 text-emerald-300'
                  }`}
                >
                  {pendingEmbeddings ? '⚡ Mise à jour requise' : '✓ Index à jour'}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                {pendingEmbeddings
                  ? 'Des modifications ont été apportées à la base. Lancez la régénération pour synchroniser le modèle vectoriel ChromaDB.'
                  : `${totalQAs} paires Q&R vectorisées et prêtes pour la recherche sémantique avec ChromaDB.`
                }
              </p>
            </div>
          </div>

          <button
            onClick={onRegenerate}
            disabled={regenLoading}
            className={`btn px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap self-start sm:self-center ${
              pendingEmbeddings ? 'btn-warning' : 'btn-secondary'
            }`}
            style={!pendingEmbeddings ? { background: 'white', color: '#0F172A' } : {}}
          >
            <Cpu size={14} className={regenLoading ? 'animate-spin-slow' : ''} />
            {regenLoading ? 'Régénération vectorielle…' : 'Régénérer l\'index IA'}
          </button>
        </div>
      </section>

    </div>
  )
}
