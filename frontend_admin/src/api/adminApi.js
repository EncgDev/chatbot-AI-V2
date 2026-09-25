/**
 * adminApi.js — SEUL point d'accès réseau du back-office NORA Admin
 * Règle §3-5 : aucun axios dans les composants.
 *
 * Intercepteur global :
 *  - Ajoute Authorization: Bearer <token> depuis sessionStorage
 *  - Sur 401 → purge token + redirect /login
 */
import axios from 'axios'

const TOKEN_KEY = 'nora_admin_token'

export const getStoredToken = () => sessionStorage.getItem(TOKEN_KEY)
export const setStoredToken = (t) => sessionStorage.setItem(TOKEN_KEY, t)
export const clearStoredToken = () => sessionStorage.removeItem(TOKEN_KEY)

// Instance Axios
const api = axios.create({ baseURL: '', timeout: 20000 })

// ─── Intercepteur requête : injecte le token ─────────────────────────────────
api.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) config.headers['Authorization'] = `Bearer ${token}`
  return config
})

// ─── Intercepteur réponse : gère 401 global ──────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      clearStoredToken()
      window.location.href = '/login'
    }
    const msg = err.response?.data?.error || err.message || 'Erreur réseau.'
    const normalized = new Error(msg)
    normalized.status = err.response?.status ?? 0
    return Promise.reject(normalized)
  }
)

// ════════════════════════════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════════════════════════════
export async function login(email, password) {
  const { data } = await api.post('/api/admin/auth/login', { email, password })
  return data // { success, token, user, expires_at }
}

export async function logout() {
  try { await api.post('/api/admin/auth/logout') } catch (_) {}
  clearStoredToken()
}

export async function getMe() {
  const { data } = await api.get('/api/admin/auth/me')
  return data // { success, user }
}

// ════════════════════════════════════════════════════════════════════
// CATÉGORIES
// ════════════════════════════════════════════════════════════════════
export async function listCategories() {
  const { data } = await api.get('/api/admin/categories')
  return data // { success, data: [...], total }
}

export async function createCategory(name) {
  const { data } = await api.post('/api/admin/categories', { name })
  return data
}

export async function updateCategory(id, name) {
  const { data } = await api.put(`/api/admin/categories/${id}`, { name })
  return data
}

export async function deleteCategory(id) {
  const { data } = await api.delete(`/api/admin/categories/${id}`)
  return data
}

// ════════════════════════════════════════════════════════════════════
// QAs
// ════════════════════════════════════════════════════════════════════
export async function listQAs(params = {}) {
  // params: { category_id?, search? }
  const { data } = await api.get('/api/admin/qas', { params })
  return data // { success, data: [...], total }
}

export async function createQA(payload) {
  // payload: { question, response, category_id }
  const { data } = await api.post('/api/admin/qas', payload)
  return data
}

export async function updateQA(id, payload) {
  const { data } = await api.put(`/api/admin/qas/${id}`, payload)
  return data
}

export async function deleteQA(id) {
  const { data } = await api.delete(`/api/admin/qas/${id}`)
  return data
}

// ════════════════════════════════════════════════════════════════════
// EMBEDDINGS
// ════════════════════════════════════════════════════════════════════
export async function regenerateEmbeddings() {
  const { data } = await api.post('/api/admin/embeddings/regenerate')
  return data // { success, count }
}

export default api
