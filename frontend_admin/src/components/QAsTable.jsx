/**
 * QAsTable.jsx — Table des questions/réponses
 * Lignes expandables · Badges catégorie · Tronquage élégant
 */
import { useState } from 'react'
import { Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

const CAT_COLORS = [
  { bg: '#EFF6FF', text: '#1D4ED8' },
  { bg: '#F0FDF4', text: '#15803D' },
  { bg: '#FFF7ED', text: '#C2410C' },
  { bg: '#F5F3FF', text: '#6D28D9' },
  { bg: '#FFF1F2', text: '#BE123C' },
  { bg: '#ECFEFF', text: '#0E7490' },
  { bg: '#FFFBEB', text: '#B45309' },
]

function CatBadge({ name }) {
  const hash = [...(name || '')].reduce((a, c) => a + c.charCodeAt(0), 0)
  const { bg, text } = CAT_COLORS[hash % CAT_COLORS.length]
  return (
    <span className="badge text-[11px]" style={{ background: bg, color: text }}>
      {name}
    </span>
  )
}

function Row({ qa, catMap, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const catName = catMap[qa.category_id] || `Cat. #${qa.category_id}`
  const responsePreview = (qa.response || '').slice(0, 120)
  const isLong = (qa.response || '').length > 120

  return (
    <>
      <tr className={expanded ? 'bg-gray-50/80' : ''}>
        {/* ID */}
        <td className="font-mono text-xs text-gray-400 w-12">#{qa.id}</td>

        {/* Question */}
        <td className="max-w-xs">
          <p className="font-semibold text-gray-800 line-clamp-2 text-sm leading-snug">{qa.question}</p>
        </td>

        {/* Response preview */}
        <td className="max-w-sm hidden md:table-cell">
          <p className="text-gray-500 text-sm line-clamp-2 leading-snug">
            {responsePreview}{isLong && !expanded ? '…' : ''}
          </p>
        </td>

        {/* Category */}
        <td className="hidden sm:table-cell">
          <CatBadge name={catName} />
        </td>

        {/* Actions */}
        <td>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setExpanded(v => !v)}
              className="btn btn-ghost btn-icon w-7 h-7 rounded-md"
              title={expanded ? 'Réduire' : 'Voir la réponse complète'}
              aria-label="Développer"
            >
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
            <button
              onClick={() => onEdit(qa)}
              className="btn btn-ghost btn-icon w-7 h-7 rounded-md"
              title="Modifier"
              aria-label="Modifier"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={() => onDelete(qa)}
              className="btn btn-ghost btn-icon w-7 h-7 rounded-md hover:!bg-red-50 hover:!text-red-600"
              title="Supprimer"
              aria-label="Supprimer"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </td>
      </tr>

      {/* Expanded row */}
      {expanded && (
        <tr className="bg-gray-50/80">
          <td />
          <td colSpan={4} className="pb-4 pt-1 pr-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 animate-fade-up">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-700 uppercase tracking-widest text-gray-400 mb-2"
                    style={{ fontWeight: 700 }}>Question complète</p>
                  <p className="text-sm text-gray-800 font-medium leading-relaxed">{qa.question}</p>
                </div>
                <div>
                  <p className="text-[10px] font-700 uppercase tracking-widest text-gray-400 mb-2"
                    style={{ fontWeight: 700 }}>Réponse complète</p>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{qa.response}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <CatBadge name={catName} />
                <div className="flex items-center gap-1.5">
                  <button onClick={() => onEdit(qa)} className="btn btn-secondary text-xs px-3 py-1.5">
                    <Pencil size={11} /> Modifier
                  </button>
                  <button onClick={() => onDelete(qa)} className="btn btn-danger text-xs px-3 py-1.5">
                    <Trash2 size={11} /> Supprimer
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
            <th style={{ width: 55 }}>ID</th>
            <th>Question</th>
            <th className="hidden md:table-cell">Réponse</th>
            <th className="hidden sm:table-cell" style={{ width: 160 }}>Catégorie</th>
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
