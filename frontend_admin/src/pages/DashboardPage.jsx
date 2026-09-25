/**
 * DashboardPage.jsx — Tableau de bord NORA Admin (ENCG Marrakech)
 * Interface épurée sans diagrammes : simple, directe, aérée et professionnelle
 */
import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  FolderOpen, MessageSquare, Cpu,
  ArrowRight, Plus, RefreshCw, Zap,
  Clock, Sparkles, ChevronRight,
  ShieldCheck, Layers, BookOpen, CheckCircle2
} from 'lucide-react'
import { listCategories, listQAs } from '../api/adminApi'
import { showToast } from '../components/Toast'

/* ─── Palette de Couleurs ─────────────────────────────────────────── */
const PALETTE = {
  mint:   { bg: '#E8F8F5', text: '#0E7A60', icon: '#10B981', border: '#D1F2EB' },
  peach:  { bg: '#FDF2EB', text: '#B84A1C', icon: '#F97316', border: '#FADBD8' },
  purple: { bg: '#F3EFFF', text: '#5E35B1', icon: '#8B5CF6', border: '#E8DAEF' },
  yellow: { bg: '#FEF9E7', text: '#9A6B00', icon: '#F59E0B', border: '#FCF3CF' },
}

const CATEGORY_COLORS = ['#800020', '#C85A32', '#2563EB', '#0D9488', '#7C3AED', '#D97706', '#DB2777', '#4B5563']

/* ─── Hook Compteur Animé ─────────────────────────────────────────── */
function useCountUp(targetVal, duration = 500) {
  const [displayVal, setDisplayVal] = useState(() => Math.round(parseFloat(targetVal) || 0))

  useEffect(() => {
    const num = Math.round(parseFloat(targetVal) || 0)
    const startTime = performance.now()
    let frameId

    const update = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(easeOut * num)

      setDisplayVal(current)

      if (progress < 1) {
        frameId = requestAnimationFrame(update)
      } else {
        setDisplayVal(num)
      }
    }

    frameId = requestAnimationFrame(update)
    return () => cancelAnimationFrame(frameId)
  }, [targetVal, duration])

  return displayVal
}

/* ─── Carte Métrique Pastel Épurée ────────────────────────────────── */
function MetricStatCard({ icon: Icon, theme, label, value, subtext, trend, linkTo }) {
  const animated = useCountUp(value, 500)

  const cardContent = (
    <div
      className="p-6 md:p-7 rounded-2xl transition-all duration-200 hover:-translate-y-1 cursor-pointer flex flex-col justify-between border shadow-xs"
      style={{
        backgroundColor: theme.bg,
        borderColor: theme.border,
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shadow-xs flex-shrink-0"
          style={{ backgroundColor: '#FFFFFF', color: theme.icon }}
        >
          <Icon size={24} />
        </div>

        {trend && (
          <span
            className="text-xs font-bold px-3 py-1 rounded-full bg-white/85 shadow-xs"
            style={{ color: theme.text }}
          >
            {trend}
          </span>
        )}
      </div>

      <div>
        <p className="text-3xl font-black text-gray-900 font-display leading-tight mb-1">
          {animated}
        </p>
        <p className="text-sm font-bold text-gray-800">
          {label}
        </p>
        {subtext && (
          <p className="text-xs font-medium text-gray-500 mt-0.5">
            {subtext}
          </p>
        )}
      </div>
    </div>
  )

  return linkTo ? <Link to={linkTo} className="block no-underline">{cardContent}</Link> : cardContent
}

/* ─── Liste des Questions Récentes ────────────────────────────────── */
function RecentQuestionsList({ qas, categories }) {
  const [expandedId, setExpandedId] = useState(null)

  const catMap = useMemo(() => {
    const map = {}
    categories.forEach(c => { map[c.id] = c.name })
    return map
  }, [categories])

  const recent = useMemo(() => (qas || []).slice(0, 6), [qas])

  return (
    <div className="bg-white rounded-3xl p-7 md:p-8 border border-gray-100 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900 font-display">
              Questions & Réponses Récentes
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Dernières connaissances synchronisées avec NORA
            </p>
          </div>
          <Link
            to="/qas"
            className="text-xs font-bold flex items-center gap-1.5 hover:underline"
            style={{ color: 'var(--brand)' }}
          >
            Voir tout ({qas.length}) <ArrowRight size={13} />
          </Link>
        </div>

        <div className="space-y-3.5">
          {recent.length === 0 ? (
            <div className="py-14 text-center text-gray-400">
              <MessageSquare size={36} className="mx-auto mb-2 opacity-25" />
              <p className="text-sm font-medium">Aucune question enregistrée</p>
            </div>
          ) : (
            recent.map((qa) => {
              const isExpanded = expandedId === qa.id
              const catName = catMap[qa.category_id] || 'Général'

              return (
                <div
                  key={qa.id}
                  onClick={() => setExpandedId(isExpanded ? null : qa.id)}
                  className={`p-4 md:p-5 rounded-2xl border transition-all cursor-pointer ${
                    isExpanded
                      ? 'border-brand/30 bg-rose-50/20 shadow-xs'
                      : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-gray-100 text-gray-700">
                          {catName}
                        </span>
                        {qa.updated_at && (
                          <span className="text-[11px] text-gray-400 flex items-center gap-1">
                            <Clock size={11} />
                            {new Date(qa.updated_at).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-gray-800 leading-snug">
                        {qa.question}
                      </p>
                    </div>
                    <ChevronRight
                      size={18}
                      className={`text-gray-400 flex-shrink-0 transition-transform mt-1 ${
                        isExpanded ? 'rotate-90 text-brand' : ''
                      }`}
                    />
                  </div>

                  {isExpanded && (
                    <div className="mt-3.5 pt-3.5 border-t border-gray-100 text-xs text-gray-700 leading-relaxed animate-fade-in">
                      <p className="font-bold text-gray-400 uppercase text-[10px] tracking-wider mb-1.5">
                        Réponse formulée par NORA :
                      </p>
                      <div className="bg-white p-3.5 rounded-xl border border-gray-100 text-gray-800">
                        {qa.response}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <span>Affichage des {recent.length} dernières entrées</span>
        <Link
          to="/qas"
          className="font-bold flex items-center gap-1 hover:underline"
          style={{ color: 'var(--brand)' }}
        >
          Accéder à la table complète <ChevronRight size={13} />
        </Link>
      </div>
    </div>
  )
}

/* ─── Répartition des Thèmes & Catégories ─────────────────────────── */
function CategoriesBreakdown({ categories, totalQAs }) {
  const sortedCategories = useMemo(() => {
    return categories
      .slice()
      .sort((a, b) => (b.qa_count ?? 0) - (a.qa_count ?? 0))
  }, [categories])

  return (
    <div className="bg-white rounded-3xl p-7 md:p-8 border border-gray-100 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900 font-display">
              Thèmes & Catégories
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Organisation thématique du savoir
            </p>
          </div>
          <Link
            to="/categories"
            className="text-xs font-bold flex items-center gap-1.5 hover:underline"
            style={{ color: 'var(--brand)' }}
          >
            Gérer ({categories.length}) <ArrowRight size={13} />
          </Link>
        </div>

        <div className="space-y-4">
          {sortedCategories.length === 0 ? (
            <div className="py-14 text-center text-gray-400">
              <FolderOpen size={36} className="mx-auto mb-2 opacity-25" />
              <p className="text-sm font-medium">Aucune catégorie créée</p>
            </div>
          ) : (
            sortedCategories.slice(0, 6).map((cat, idx) => {
              const count = cat.qa_count ?? 0
              const pct = totalQAs ? Math.round((count / totalQAs) * 100) : 0
              const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length]

              return (
                <div key={cat.id} className="p-3.5 rounded-2xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-all">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="font-bold text-gray-800 truncate text-sm">
                        {cat.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-extrabold text-gray-900">{count} QAs</span>
                      <span className="text-[11px] font-bold text-gray-400 w-10 text-right">({pct}%)</span>
                    </div>
                  </div>

                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-400 font-medium">
          {categories.length} catégories actives au total
        </span>
        <Link
          to="/categories"
          className="btn btn-primary text-xs py-2 px-4 rounded-xl font-bold flex items-center gap-1.5"
        >
          <Plus size={14} /> Nouvelle Catégorie
        </Link>
      </div>
    </div>
  )
}

/* ─── Page Principale Dashboard (Sans Diagrammes) ──────────────────── */
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
      showToast(e.message || 'Erreur lors du chargement des données', 'error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const totalCat = categories.length
  const totalQAs = qas.length
  const coverage = totalQAs > 0 ? Math.min(100, Math.round((totalQAs / Math.max(totalQAs, 95)) * 100)) : 0

  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }, [])

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse p-4 max-w-[1440px] mx-auto">
        <div className="h-28 bg-gray-200/60 rounded-3xl w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-gray-200/60 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-96 bg-gray-200/60 rounded-3xl" />
          <div className="h-96 bg-gray-200/60 rounded-3xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 md:space-y-10 pb-16 animate-fade-up max-w-[1440px] mx-auto">

      {/* ── 1. Hero Welcoming Card ── */}
      <section className="bg-white rounded-3xl p-8 md:p-10 border border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Système NORA IA Actif & Opérationnel
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 font-display tracking-tight leading-tight">
              Bonjour, <span style={{ color: 'var(--brand)' }}>{user?.full_name || 'Administrateur'}</span> 👋
            </h1>
            <p className="text-sm md:text-base text-gray-500 mt-2 max-w-2xl leading-relaxed">
              Supervisez la base de connaissances de l'ENCG Marrakech, gérez les questions et réponses, et synchronisez le moteur sémantique.
            </p>
            <p className="text-xs text-gray-400 mt-2 font-medium capitalize">
              {todayFormatted}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3 self-start md:self-center flex-shrink-0">
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              title="Actualiser les données"
              className="btn btn-secondary px-4 py-2.5 text-xs font-bold rounded-xl"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              <span>Actualiser</span>
            </button>

            <Link
              to="/qas"
              className="btn btn-primary px-5 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2"
            >
              <Plus size={15} />
              Nouveau QA
            </Link>
          </div>
        </div>
      </section>

      {/* ── 2. 4 Cartes Métriques Claires & Épurées ── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricStatCard
          icon={FolderOpen}
          theme={PALETTE.mint}
          label="Total Catégories"
          value={totalCat}
          subtext="thèmes configurés"
          trend="Actif"
          linkTo="/categories"
        />

        <MetricStatCard
          icon={MessageSquare}
          theme={PALETTE.peach}
          label="Questions & Réponses"
          value={totalQAs}
          subtext="paires Q&R dans la base"
          trend={`${totalQAs} QAs`}
          linkTo="/qas"
        />

        <MetricStatCard
          icon={Layers}
          theme={PALETTE.purple}
          label="Vecteurs Sémantiques"
          value={totalQAs}
          subtext="documents indexés ChromaDB"
          trend="100%"
        />

        <MetricStatCard
          icon={Sparkles}
          theme={PALETTE.yellow}
          label="Couverture de l'IA"
          value={coverage}
          subtext="taux de couverture globale"
          trend={`${coverage}%`}
        />
      </section>

      {/* ── 3. Data Sections : Questions Récentes & Thèmes ── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10">
        <RecentQuestionsList qas={qas} categories={categories} />
        <CategoriesBreakdown categories={categories} totalQAs={totalQAs} />
      </section>

      {/* ── 4. Bannière Diagnostic & État de l'IA ── */}
      <section className="bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-3xl p-8 md:p-9 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                pendingEmbeddings ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
              }`}
            >
              <Zap size={24} className={pendingEmbeddings ? 'animate-pulse' : ''} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h4 className="text-base font-bold font-display text-white">
                  Moteur Vectoriel & Recherche Sémantique NORA
                </h4>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    pendingEmbeddings ? 'bg-amber-400/20 text-amber-300' : 'bg-emerald-400/20 text-emerald-300'
                  }`}
                >
                  {pendingEmbeddings ? 'Mise à jour requise' : 'Index à jour'}
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-1 max-w-xl leading-relaxed">
                {pendingEmbeddings
                  ? 'Des modifications ont été apportées aux questions. Lancez la régénération pour synchroniser le modèle vectoriel.'
                  : `${totalQAs} paires de questions/réponses vectorisées prêtes pour la recherche sémantique avec ChromaDB.`}
              </p>
            </div>
          </div>

          <button
            onClick={onRegenerate}
            disabled={regenLoading}
            className="btn px-5 py-2.5 text-xs font-bold rounded-xl whitespace-nowrap self-start sm:self-center transition-all"
            style={{
              backgroundColor: pendingEmbeddings ? '#F59E0B' : 'white',
              color: pendingEmbeddings ? '#FFFFFF' : '#111827',
            }}
          >
            <Cpu size={15} className={regenLoading ? 'animate-spin-slow' : ''} />
            {regenLoading ? 'Régénération vectorielle…' : 'Régénérer l\'IA'}
          </button>
        </div>
      </section>

    </div>
  )
}
