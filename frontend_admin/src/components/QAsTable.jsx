/**
 * QAsTable.jsx — Table CRUD des QAs — Design premium
 */
import { useState, useEffect } from 'react'
import { Pencil, Trash2, Search, ChevronLeft, ChevronRight, MessageSquare, X, FilterX } from 'lucide-react'

const PAGE_SIZE = 50

export default function QAsTable({ qas, categories, onEdit, onDelete, filterState, loading }) {
  const [page, setPage] = useState(1)
  const { search, categoryId, setSearch, setCategoryId } = filterState

  // État local de l'input — la recherche serveur est debouncée (350 ms)
  // pour éviter un appel API à chaque frappe.
  const [text, setText] = useState(search)
  useEffect(() => { setText(search) }, [search])
  useEffect(() => {
    if (text === search) return
    const t = setTimeout(() => { setSearch(text); setPage(1) }, 350)
    return () => clearTimeout(t)
  }, [text, search, setSearch])

  const total = qas.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = qas.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const catMap = Object.fromEntries(categories.map(c => [c.id, c]))
  const truncate = (s, n = 80) => s?.length > n ? s.slice(0, n) + '…' : (s ?? '')

  const handleSearch = v => setText(v)
  const clearSearch  = () => { setText(''); if (search) { setSearch(''); setPage(1) } }
  const handleCat    = v => { setCategoryId(v); setPage(1) }
  const clearFilters = () => { clearSearch(); if (categoryId) { setCategoryId(''); setPage(1) } }

  // Couleurs de badge par catégorie (cycle)
  const catColors = [
    { bg: 'rgba(133,24,26,.08)', color: 'var(--bordeaux)' },
    { bg: 'rgba(200,90,50,.1)',  color: 'var(--terracotta)' },
    { bg: 'rgba(61,39,29,.07)', color: 'var(--brown)' },
    { bg: 'rgba(5,150,105,.1)',  color: '#065F46' },
    { bg: 'rgba(37,99,235,.08)', color: '#1D4ED8' },
  ]
  const catColorMap = Object.fromEntries(
    categories.map((c, i) => [c.id, catColors[i % catColors.length]])
  )

  return (
    <div className="card overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(133,24,26,.08)' }}>
            <MessageSquare size={17} style={{ color: 'var(--bordeaux)' }} />
          </div>
          <div>
            <h3 className="font-semibold text-sm" style={{ color: 'var(--brown)' }}>Questions & Réponses</h3>
            <p className="text-xs" style={{ color: 'var(--brown-muted)' }}>{total} résultat{total !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Filtre catégorie */}
          {/* Bouton "réinitialiser" visible quand des filtres sont actifs */}
          {(search || categoryId || text) && (
            <button onClick={clearFilters} type="button"
              className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-2 rounded-lg transition-colors hover:bg-white"
              style={{ color: 'var(--bordeaux)', border: '1px dashed var(--border)' }}>
              <FilterX size={12} />
              Réinitialiser
            </button>
          )}

          {/* Filtre catégorie */}
          <div className="relative">
            <select
              aria-label="Filtrer par catégorie"
              value={categoryId}
              onChange={e => handleCat(e.target.value)}
              className="appearance-none text-xs pl-3 pr-7 py-2 rounded-lg border font-medium outline-none transition-colors cursor-pointer"
              style={{
                borderColor: 'var(--border)',
                background: 'var(--cream-light)',
                color: 'var(--brown)',
              }}
            >
              <option value="">Toutes les catégories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ChevronRight size={12} className="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none"
              style={{ color: 'var(--brown-muted)' }} />
          </div>

          {/* Recherche */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--brown-muted)' }} />
            <input
              type="text"
              value={text}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Rechercher…"
              aria-label="Rechercher un QA"
              className="text-xs pl-8 pr-8 py-2 rounded-lg border outline-none transition-colors w-44"
              style={{ borderColor: 'var(--border)', background: 'var(--cream-light)', color: 'var(--brown)' }}
            />
            {text && (
              <button onClick={clearSearch} aria-label="Effacer la recherche"
                className="absolute right-2 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: 'var(--brown-muted)' }}>
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ background: 'var(--cream)', borderBottom: '1px solid var(--border)' }}>
              <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-widest"
                style={{ color: 'var(--brown-muted)' }}>Question</th>
              <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-widest hidden md:table-cell"
                style={{ color: 'var(--brown-muted)' }}>Aperçu réponse</th>
              <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-widest w-36 hidden sm:table-cell"
                style={{ color: 'var(--brown-muted)' }}>Catégorie</th>
              <th className="px-6 py-3 text-right text-[11px] font-bold uppercase tracking-widest w-24"
                style={{ color: 'var(--brown-muted)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-16 text-center">
                  <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                    style={{ background: 'var(--cream-dark)' }}>
                    <MessageSquare size={24} style={{ color: 'var(--brown-muted)' }} />
                  </div>
                  <p className="text-sm font-medium" style={{ color: 'var(--brown)' }}>Aucun résultat</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--brown-muted)' }}>
                    {search || categoryId ? 'Aucun QA ne correspond à vos filtres.' : 'Créez votre premier QA.'}
                  </p>
                  {(search || categoryId) && (
                    <button onClick={clearFilters} type="button"
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all hover:-translate-y-px"
                      style={{ background: 'rgba(133,24,26,.08)', color: 'var(--bordeaux)' }}>
                      <FilterX size={12} />
                      Réinitialiser les filtres
                    </button>
                  )}
                </td>
              </tr>
            )}

            {paginated.map((qa, i) => {
              const cc = catColorMap[qa.category_id] || catColors[0]
              const cat = catMap[qa.category_id]
              return (
                <tr key={qa.id}
                  className="group transition-colors hover:bg-amber-50/30"
                  style={{ borderBottom: i < paginated.length - 1 ? '1px solid var(--border-light)' : 'none' }}
                >
                  <td className="px-6 py-3.5 max-w-xs">
                    <p className="font-medium text-sm leading-snug" title={qa.question}
                      style={{ color: 'var(--brown)' }}>
                      {truncate(qa.question, 85)}
                    </p>
                  </td>
                  <td className="px-6 py-3.5 max-w-sm hidden md:table-cell">
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--brown-muted)' }}>
                      {truncate(qa.response, 110)}
                    </p>
                  </td>
                  <td className="px-6 py-3.5 hidden sm:table-cell">
                    {cat ? (
                      <span className="badge text-[11px]" style={{ background: cc.bg, color: cc.color }}>
                        {cat.name}
                      </span>
                    ) : <span style={{ color: 'var(--border)' }}>—</span>}
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex justify-end items-center gap-1">
                      {/* Visibles sur tactile et au clavier ; masqués jusqu'au survol sur desktop (lg) */}
                      <button onClick={() => onEdit(qa)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100"
                        style={{ background: 'rgba(200,90,50,.1)', color: 'var(--terracotta)' }}
                        title="Modifier" aria-label={`Modifier le QA : ${truncate(qa.question, 40)}`}>
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => onDelete(qa)} disabled={loading}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100 disabled:opacity-30"
                        style={{ background: 'rgba(220,38,38,.08)', color: 'var(--danger)' }}
                        title="Supprimer" aria-label={`Supprimer le QA : ${truncate(qa.question, 40)}`}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-3"
          style={{ borderTop: '1px solid var(--border)', background: 'var(--cream)' }}>
          <span className="text-xs" style={{ color: 'var(--brown-muted)' }}>
            Page <strong>{safePage}</strong> / {totalPages} — <strong>{total}</strong> QA{total !== 1 ? 's' : ''}
          </span>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
              aria-label="Page précédente"
              className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-white disabled:opacity-40 transition-colors"
              style={{ borderColor: 'var(--border)' }}>
              <ChevronLeft size={13} style={{ color: 'var(--brown)' }} />
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
              aria-label="Page suivante"
              className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-white disabled:opacity-40 transition-colors"
              style={{ borderColor: 'var(--border)' }}>
              <ChevronRight size={13} style={{ color: 'var(--brown)' }} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
