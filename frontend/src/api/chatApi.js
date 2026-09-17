/**
 * chatApi.js — Client API pour NORA (Chatbot ENCG Marrakech)
 * Auteur : Youssef (Frontend)
 *
 * Contrat strict respecté (TASKS.md - Sections 1, 2 & 5) :
 *   - GET  /api/health            → { "status": "ok", ... }
 *   - GET  /api/categories        → [{ "id": 1, "name": "Formations", "qa_count": 2 }, ...]
 *   - GET  /api/qas?category_id=X → [{ "id", "question", "response", "category_id" }, ...]
 *   - POST /api/chat/v1           body { "message", "session_id"? } → { "success", "version", "response", "session_id", ... }
 *   - POST /api/chat/v2           body { "message", "session_id"? } → { "success", "version", "response", "session_id", "sources", ... }
 *   - GET  /api/chat/sessions/<id>→ { "success": true, "data": [ { id, role, content, version, created_at } ], "total": 2 }
 *   - Erreurs : { "success": false, "error": "message" }
 *
 * URL du backend : variable d'environnement Vite VITE_API_URL
 */

import axios from 'axios'

// ─── URL de base dynamique du backend ─────────────────────────────────────────
const rawUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '')
export const BASE_URL = rawUrl.includes('backend') ? '' : rawUrl

// Instance Axios configurée avec un timeout réaliste de 20s pour Gemini V2
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ─── Intercepteur de réponse : normalise les erreurs ────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Ne pas formater en erreur générique si la requête a été volontairement annulée
    if (axios.isCancel(error) || error.name === 'CanceledError' || error.name === 'AbortError') {
      const abortErr = new Error('Requête annulée.')
      abortErr.isAbort = true
      return Promise.reject(abortErr)
    }

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
  return Array.isArray(data) ? data : (data.data ?? [])
}

// ════════════════════════════════════════════════════════════════════════════
//  FONCTION 2 : getQAs(catId)
//  Endpoint : GET /api/qas?category_id=X
//  Réponse backend : { success, data: [{ id, question, response, category_id }], total }
//  Retourne : tableau plat de QAs
// ════════════════════════════════════════════════════════════════════════════
export async function getQAs(catId) {
  const params = catId != null ? { category_id: catId } : {}
  const { data } = await api.get('/api/qas', { params })
  return Array.isArray(data) ? data : (data.data ?? [])
}

// ════════════════════════════════════════════════════════════════════════════
//  FONCTION 3 : sendChatV1(msg, sessionId)
//  Endpoint : POST /api/chat/v1 (Recherche directe BDD SQL)
//  Body     : { "message": "...", "session_id": "uuid-ou-null" }
//  Réponse  : { success, version:"v1", response, session_id?, question_matched?, category_id? }
// ════════════════════════════════════════════════════════════════════════════
export async function sendChatV1(msg, sessionId = null) {
  const payload = { message: msg }
  if (sessionId) {
    payload.session_id = sessionId
  }

  const { data } = await api.post('/api/chat/v1', payload)
  return {
    reply:            data.response ?? data.reply ?? '',
    source:           data.source   ?? 'sql',
    version:          'v1',
    sessionId:        data.session_id ?? sessionId ?? null,
    question_matched: data.question_matched ?? null,
    category_id:      data.category_id     ?? null,
    success:          data.success         ?? true,
  }
}

// ════════════════════════════════════════════════════════════════════════════
//  FONCTION 4 : sendChatV2(msg, sessionId, signal)
//  Endpoint : POST /api/chat/v2
//  Body     : { "message": "...", "session_id": "uuid-ou-null" }
//  Supporte : AbortSignal pour annuler la requête
//  Sécurité résilience : Si Gemini est indisponible ou retourne 503/500, bascule
//                        automatiquement sur la Base de Données (sendChatV1)
// ════════════════════════════════════════════════════════════════════════════
export async function sendChatV2(msg, sessionId = null, signal = null) {
  const payload = { message: msg }
  if (sessionId) {
    payload.session_id = sessionId
  }

  const axiosConfig = signal ? { signal } : {}

  try {
    const { data } = await api.post('/api/chat/v2', payload, axiosConfig)

    const isFallback = data.source === 'v1-fallback' || !!data.fallback_reason

    return {
      reply:          data.response      ?? data.reply ?? '',
      source:         data.source        ?? (isFallback ? 'v1-fallback' : `gemini/${data.model ?? 'v2'}`),
      version:        data.version       ?? (isFallback ? 'v1' : 'v2'),
      sessionId:      data.session_id    ?? sessionId ?? null,
      isFallback,
      fallbackReason: data.fallback_reason ?? null,
      sources:        Array.isArray(data.sources) ? data.sources : [],
      question_matched: data.question_matched ?? null,
      category_id:    data.category_id   ?? null,
      context_used:   data.context_used  ?? false,
      context_count:  data.context_count ?? 0,
      model:          data.model         ?? 'gemini-1.5-flash',
      success:        data.success       ?? true,
    }
  } catch (err) {
    // Si l'utilisateur a annulé la requête -> propager l'erreur d'annulation
    if (err.isAbort || err.name === 'AbortError' || err.name === 'CanceledError') {
      throw err
    }

    // 🛡️ Filet de sécurité Frontend : Fallback automatique immédiat vers la BDD (V1 SQL)
    try {
      const v1Res = await sendChatV1(msg, sessionId)
      return {
        ...v1Res,
        isFallback: true,
        fallbackReason: err.message || 'gemini_unavailable',
        source: 'v1-fallback',
      }
    } catch (v1Err) {
      // Si la BDD est également injoignable, on propage l'erreur globale
      throw v1Err
    }
  }
}

// ════════════════════════════════════════════════════════════════════════════
//  FONCTION 5 : getSessionHistory(sessionId)
//  Endpoint : GET /api/chat/sessions/<session_id>
//  Réponse backend : { success: true, data: [ { id, role, content, version, created_at } ], total }
//  Retourne : tableau plat de messages (ou [] si 404 / erreur)
// ════════════════════════════════════════════════════════════════════════════
export async function getSessionHistory(sessionId) {
  if (!sessionId) return []
  try {
    const { data } = await api.get(`/api/chat/sessions/${sessionId}`)
    return Array.isArray(data) ? data : (data.data ?? [])
  } catch (err) {
    // Si la session n'existe pas encore ou erreur serveur, on retourne une liste vide
    return []
  }
}

// ════════════════════════════════════════════════════════════════════════════
//  FONCTION UTILITAIRE : checkHealth()
//  Endpoint : GET /api/health
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
