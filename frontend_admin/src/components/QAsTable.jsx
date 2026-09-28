/**
 * QAsTable.jsx — Table des Q&R — Premium v3
 * Lignes expandables · Badges catégorie · Actions élégantes
 */
import { useState } from 'react'
import { Pencil, Trash2, ChevronDown, ChevronUp, Edit3 } from 'lucide-react'

const CAT_COLORS = [
  { bg: '#EFF6FF', text: '#1D4ED8' },
  { bg: '#F0FDF4', text: '#15803D' },
  { bg: '#FFF7ED', text: '#C2410C' },
  { bg: '#F5F3FF', text: '#6D28D9' },
  { bg: '#FFF1F2', text: '#BE123C' },
  { bg: '#ECFEFF', text: '#0E7490' },
  { bg: '#FFFBEB', text: '#B45309' },
  { bg: '#F0FDF4', text: '#166534' },
]

function CatBadge({ name }) {
  const hash = [...(name || '')].reduce((a, c) => a + c.charCodeAt(0), 0)
  const { bg, text } = CAT_COLORS[hash % CAT_COLORS.length]
  return (
    <span
      className="badge text-[11px] font-semibold"
      style={{ background: bg, color: text }}
    >
      {name}
    </span>
  )
}

function Row({ qa, catMap, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const catName = catMap[qa.category_id] || `Catégorie #${qa.category_id}`
  const responsePreview = (qa.response || '').slice(0, 110)
  const isLong = (qa.response || '').length > 110

  return (
    <>
      <tr className={`group transition-colors ${expanded ? 'bg-slate-50/80' : 'hover:bg-gray-50/60'}`}>

        {/* ID */}
        <td>
          <span className="font-mono text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
            #{qa.id}
          </span>
        </td>

        {/* Question */}
        <td className="max-w-xs">
          <p className="font-semibold text-gray-800 line-clamp-2 text-sm leading-snug">
            {qa.question}
          </p>
        </td>

        {/* Response preview */}
        <td className="max-w-sm hidden md:table-cell">
          <p className="text-gray-400 text-sm line-clamp-2 leading-snug">
            {responsePreview}{isLong && !expanded ? '…' : ''}
          </p>
        </td>

        {/* Category */}
        <td className="hidden sm:table-cell">
          <CatBadge name={catName} />
        </td>

        {/* Actions */}
        <td>
          <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 hover:!opacity-100 transition-opacity">
            <button
              onClick={() => setExpanded(v => !v)}
              className="btn btn-ghost btn-icon w-7 h-7 rounded-lg"
              title={expanded ? 'Réduire' : 'Voir la réponse complète'}
              aria-label="Développer"
            >
              {expanded
                ? <ChevronUp size={13} style={{ color: 'var(--brand)' }} />
                : <ChevronDown size={13} />
              }
            </button>
            <button
              onClick={() => onEdit(qa)}
              className="btn btn-ghost btn-icon w-7 h-7 rounded-lg hover:!bg-blue-50 hover:!text-blue-600"
              title="Modifier"
              aria-label="Modifier"
            >
              <Edit3 size={13} />
            </button>
            <button
              onClick={() => onDelete(qa)}
              className="btn btn-ghost btn-icon w-7 h-7 rounded-lg hover:!bg-red-50 hover:!text-red-600"
              title="Supprimer"
              aria-label="Supprimer"
            >
              <Trash2 size={13} />
            </button>
          </div>
          {/* Always visible on mobile */}
          <div className="flex items-center gap-1 md:hidden">
            <button
              onClick={() => setExpanded(v => !v)}
              className="btn btn-ghost btn-icon w-7 h-7 rounded-lg"
            >
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
            <button
              onClick={() => onEdit(qa)}
              className="btn btn-ghost btn-icon w-7 h-7 rounded-lg"
            >
              <Edit3 size={13} />
            </button>
            <button
              onClick={() => onDelete(qa)}
              className="btn btn-ghost btn-icon w-7 h-7 rounded-lg hover:!text-red-600"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </td>
      </tr>

      {/* Expanded Detail Row */}
      {expanded && (
        <tr className="bg-slate-50/80">
          <td />
          <td colSpan={4} className="pb-4 pt-1 pr-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 animate-fade-up shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Question */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                    Question complète
                  </p>
                  <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                    <p className="text-sm text-gray-800 font-medium leading-relaxed">
                      {qa.question}
                    </p>
                  </div>
                </div>

                {/* Response */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                    Réponse formulée par NORA
                  </p>
                  <div
                    className="bg-gray-50 rounded-xl p-3.5 border border-gray-100"
                    style={{ borderLeft: '3px solid var(--brand)' }}
                  >
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                      {qa.response}
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer actions */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2.5">
                  <CatBadge name={catName} />
                  {qa.updated_at && (
                    <span className="text-[11px] text-gray-400 font-medium">
                      Mis à jour le {new Date(qa.updated_at).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEdit(qa)}
                    className="btn btn-secondary text-xs px-3 py-1.5 rounded-lg"
                  >
                    <Edit3 size={12} /> Modifier
                  </button>
                  <button
                    onClick={() => onDelete(qa)}
                    className="btn btn-danger text-xs px-3 py-1.5 rounded-lg"
                  >
                    <Trash2 size={12} /> Supprimer
                  </button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default function QAsTable({ qas, catMap, onEdit, onDelete, loading }) {
  return (
    <div className="overflow-x-auto">
      <table className="data-table" role="table" aria-label="Liste des questions et réponses">
        <thead>
          <tr>
            <th style={{ width: 62 }}>ID</th>
            <th>Question</th>
            <th className="hidden md:table-cell">Aperçu de la réponse</th>
            <th className="hidden sm:table-cell" style={{ width: 170 }}>Catégorie</th>
            <th style={{ width: 110 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {qas.map(qa => (
            <Row
              key={qa.id}
              qa={qa}
              catMap={catMap}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
