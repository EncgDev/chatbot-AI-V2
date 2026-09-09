/**
 * chatApi.js — Client API pour NORA (Chatbot ENCG Marrakech)
 * Auteur : Youssef (Frontend)
 *
 * Contrat strict respecté (README) :
 *   - GET  /api/categories → [{ "id": 1, "name": "Formations" }, ...]
 *   - GET  /api/qas?category_id=X → [{ "id", "question", "response", "category_id" }, ...]
 *   - POST /api/chat/v1  body { "message" } → { "success", "version", "response", ... }
 *   - POST /api/chat/v2  body { "message" } → { "success", "version", "response", "reply", "source", ... }
 *   - Erreurs : { "error": "message" }
 *
 * URL du backend : variable d'environnement Vite VITE_API_URL
 * (alignée sur le nom utilisé dans docker-compose.yml et frontend/Dockerfile)
 */

import axios from 'axios'

// ─── URL de base du backend ──────────────────────────────────────────────────
// En dev  → vite.config.js proxy /api → localhost:5000  (pas besoin d'URL absolue)
// En prod → VITE_API_URL injecté au build Docker (ex: http://backend:5000)
const BASE_URL = import.meta.env.VITE_API_URL || ''

// Instance Axios configurée
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ─── Intercepteur de réponse : normalise les erreurs ────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const serverMsg =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'Erreur réseau inconnue.'
    const normalized = new Error(serverMsg)
    normalized.status = error.response?.status ?? 0
    normalized.original = error
    return Promise.reject(normalized)
  }
)

// ════════════════════════════════════════════════════════════════════════════
//  FONCTION 1 : getCategories()
//  Endpoint : GET /api/categories
//  Réponse backend : { success, data: [{ id, name, qa_count }], total }
//  Retourne : tableau plat [{ id, name, qa_count }]
// ════════════════════════════════════════════════════════════════════════════
export async function getCategories() {
  const { data } = await api.get('/api/categories')
  // Le backend enveloppe dans { success, data, total } → on extrait data[]
  return Array.isArray(data) ? data : (data.data ?? [])
}

// ════════════════════════════════════════════════════════════════════════════
//  FONCTION 2 : getQAs(catId)
//  Endpoint : GET /api/qas?category_id=X
//  Réponse backend : { success, data: [{ id, question, response, category_id }], total }
//  Retourne : tableau plat de QAs
//
//  Noms de champs stricts (contrat README) : question, response, category_id
// ════════════════════════════════════════════════════════════════════════════
export async function getQAs(catId) {
  const params = catId != null ? { category_id: catId } : {}
  const { data } = await api.get('/api/qas', { params })
  return Array.isArray(data) ? data : (data.data ?? [])
}

// ════════════════════════════════════════════════════════════════════════════
//  FONCTION 3 : sendChatV1(msg)
//  Endpoint : POST /api/chat/v1
//  Body     : { "message": "..." }
//  Réponse  : { success, version:"v1", response, question_matched?, category_id? }
//
//  Normalisation pour le frontend : on retourne toujours { reply, source, version }
//  "reply"  ← backend champ "response"   (nommé "reply" côté UI pour clarté)
//  "source" ← "sql" (identifiant du mode V1)
// ════════════════════════════════════════════════════════════════════════════
export async function sendChatV1(msg) {
  const { data } = await api.post('/api/chat/v1', { message: msg })
  return {
    // Noms de champs UI internes (reply/source) — ≠ noms du contrat backend
    reply:            data.response ?? data.reply ?? '',
    source:           data.source   ?? 'sql',
    version:          'v1',
    // Champs bruts du contrat conservés pour débogage
    question_matched: data.question_matched ?? null,
    category_id:      data.category_id     ?? null,
    success:          data.success         ?? true,
  }
}

// ════════════════════════════════════════════════════════════════════════════
//  FONCTION 4 : sendChatV2(msg)
//  Endpoint : POST /api/chat/v2
//  Body     : { "message": "..." }
//  Réponse  : { success, version:"v2", response, context_used, context_count, model }
//  Le README mentionne aussi { reply, source } — le backend retourne "response" + "model"
//  → on normalise de la même façon
// ════════════════════════════════════════════════════════════════════════════
export async function sendChatV2(msg) {
  const { data } = await api.post('/api/chat/v2', { message: msg })
  return {
    reply:         data.response      ?? data.reply ?? '',
    source:        data.source        ?? `gemini/${data.model ?? 'v2'}`,
    version:       'v2',
    context_used:  data.context_used  ?? false,
    context_count: data.context_count ?? 0,
    model:         data.model         ?? 'gemini-1.5-flash',
    success:       data.success       ?? true,
  }
}

// ════════════════════════════════════════════════════════════════════════════
//  FONCTION UTILITAIRE : checkHealth()
//  Endpoint : GET /api/health
//  Utilisée pour détecter si le backend est joignable (état offline)
// ════════════════════════════════════════════════════════════════════════════
export async function checkHealth() {
  try {
    const { data } = await api.get('/api/health')
    return data.status === 'ok'
  } catch {
    return false
  }
}

export default api
