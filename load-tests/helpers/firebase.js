/**
 * Wrapper de k6 para llamar Firebase Callable Functions v2.
 *
 * Firebase Callable Functions v2 aceptan:
 *   POST <url>
 *   Content-Type: application/json
 *   Authorization: Bearer <idToken>
 *   Body: { "data": { ...args } }
 *
 * La respuesta es: { "result": { ...returnValue } }
 * Los errores devuelven status 4xx/5xx con { "error": { "message", "status" } }
 */

import http     from 'k6/http'
import { check } from 'k6'

const ENV     = __ENV.ENV || 'prod'
const PROJECT = __ENV.PROJECT_ID || 'turizoneando-dev'
const REGION  = __ENV.REGION    || 'us-central1'

export const BASE_URL = ENV === 'local'
  ? `http://127.0.0.1:5001/${PROJECT}/${REGION}`
  : `https://${REGION}-${PROJECT}.cloudfunctions.net`

const FIRESTORE_BASE = ENV === 'local'
  ? `http://127.0.0.1:8080/v1/projects/${PROJECT}/databases/(default)/documents`
  : `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`

// ── Firebase Callable Functions ───────────────────────────────────────────────

export function callFn(name, data, token, tags = {}) {
  return http.post(
    `${BASE_URL}/${name}`,
    JSON.stringify({ data }),
    {
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`,
      },
      tags: { fn: name, ...tags },
    }
  )
}

export function assertOk(res, fnName) {
  const ok = check(res, {
    [`${fnName} status 200`]: (r) => r.status === 200,
  })
  if (!ok) return null
  try {
    const body = JSON.parse(res.body)
    return body.result ?? body
  } catch {
    return null
  }
}

// ── Firestore REST (escribe directo, sin pasar por Cloud Function) ────────────

function toFirestoreValue(v) {
  if (typeof v === 'string')  return { stringValue: v }
  if (typeof v === 'number')  return { integerValue: String(Math.floor(v)) }
  if (typeof v === 'boolean') return { booleanValue: v }
  if (v === null)             return { nullValue: null }
  return { stringValue: String(v) }
}

function toFirestoreFields(obj) {
  const fields = {}
  for (const [k, v] of Object.entries(obj)) fields[k] = toFirestoreValue(v)
  return fields
}

/**
 * Crea o actualiza un documento en Firestore via REST (equivale a setDoc con merge:true).
 * @param {string} collection - Nombre de la colección, ej: 'players'
 * @param {string} docId      - ID del documento
 * @param {object} data       - Campos a escribir (valores primitivos)
 * @param {string} token      - Firebase ID Token
 * @returns {boolean} true si tuvo éxito
 */
export function firestoreUpsert(collection, docId, data, token) {
  const url     = `${FIRESTORE_BASE}/${collection}/${docId}`
  const payload = JSON.stringify({ fields: toFirestoreFields(data) })
  const res = http.request('PATCH', url, payload, {
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
    },
    tags: { fn: `firestore_${collection}_upsert` },
  })
  return check(res, { [`firestore ${collection} upsert 200`]: (r) => r.status === 200 })
}
