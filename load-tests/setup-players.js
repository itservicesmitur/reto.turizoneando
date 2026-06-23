/**
 * Crea documentos en la colección `players` para todos los usuarios de prueba.
 *
 * Debe correrse UNA VEZ después de generate-tokens.js.
 * Si el documento ya existe, lo actualiza (merge: true equivalente via patch).
 *
 * Sin dependencias externas — solo Node.js nativo.
 *
 * Uso: node setup-players.js
 */

const https = require('https')
const fs    = require('fs')
const path  = require('path')

// ── Leer .env ─────────────────────────────────────────────────────────────────

function loadEnv() {
  const candidates = [
    path.join(__dirname, '.env.load-test'),
    path.join(__dirname, '..', '.env'),
  ]
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue
    const lines = fs.readFileSync(file, 'utf8').split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const [key, ...rest] = trimmed.split('=')
      if (key && !process.env[key]) process.env[key] = rest.join('=').trim()
    }
    break
  }
}

loadEnv()

const API_KEY    = process.env.FIREBASE_API_KEY    || process.env.VITE_FIREBASE_API_KEY
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID
const TOKENS_CSV = path.join(__dirname, 'data', 'tokens.csv')

if (!API_KEY || !PROJECT_ID) {
  console.error('❌  Faltan FIREBASE_API_KEY o FIREBASE_PROJECT_ID.')
  process.exit(1)
}

if (!fs.existsSync(TOKENS_CSV)) {
  console.error('❌  No existe data/tokens.csv. Corre generate-tokens.js primero.')
  process.exit(1)
}

// ── HTTP helper ───────────────────────────────────────────────────────────────

function request(options, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : ''
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
      ...(options.headers || {}),
    }
    const req = https.request({ ...options, headers }, (res) => {
      let data = ''
      res.on('data', c => (data += c))
      res.on('end', () => {
        try { resolve(JSON.parse(data)) }
        catch { resolve({ _raw: data, _status: res.statusCode }) }
      })
    })
    req.on('error', reject)
    if (payload) req.write(payload)
    req.end()
  })
}

// ── Leer tokens.csv ───────────────────────────────────────────────────────────

function readTokens() {
  const lines = fs.readFileSync(TOKENS_CSV, 'utf8').trim().split('\n').slice(1) // skip header
  return lines.map(line => {
    const parts = line.split(',')
    return { uid: parts[0], email: parts[1], idToken: parts[2] }
  }).filter(u => u.uid && u.email && u.idToken)
}

// ── Crear/actualizar doc en Firestore via REST ─────────────────────────────────
// PATCH con updateMask omitido = upsert (crea si no existe, actualiza si existe)

function buildFirestoreFields(obj) {
  const fields = {}
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string')  fields[k] = { stringValue: v }
    else if (typeof v === 'number') fields[k] = { integerValue: String(v) }
    else if (typeof v === 'boolean') fields[k] = { booleanValue: v }
    else if (v === null) fields[k] = { nullValue: null }
  }
  return fields
}

async function upsertPlayer(user, idToken) {
  const nameParts = user.email.split('@')[0].replace('test', 'Player')
  const body = {
    fields: buildFirestoreFields({
      uid:           user.uid,
      displayName:   nameParts,
      firstName:     'Test',
      lastName:      nameParts,
      email:         user.email,
      gender:        'other',
      nationality:   'US',
      ageRange:      '18-25',
      preferredLang: 'es',
      emailVerified: true,
      score:         0,
    }),
  }

  const res = await request(
    {
      hostname: 'firestore.googleapis.com',
      path:     `/v1/projects/${PROJECT_ID}/databases/(default)/documents/players/${user.uid}`,
      method:   'PATCH',
      headers:  { Authorization: `Bearer ${idToken}` },
    },
    body
  )

  if (res.name) return true // success
  throw new Error(JSON.stringify(res.error || res._raw || res))
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const users = readTokens()
  console.log(`\n👤  Creando ${users.length} documentos en players/...\n`)

  const BATCH = 10
  let ok = 0
  let fail = 0

  for (let i = 0; i < users.length; i += BATCH) {
    const slice = users.slice(i, i + BATCH)
    await Promise.all(
      slice.map(async (user) => {
        try {
          await upsertPlayer(user, user.idToken)
          process.stdout.write('.')
          ok++
        } catch (err) {
          process.stdout.write('✗')
          fail++
          if (fail <= 3) console.error(`\n  ⚠️  ${user.email}: ${err.message}`)
        }
      })
    )
    await new Promise(r => setTimeout(r, 300))
  }

  console.log(`\n\n✅  ${ok} players creados/actualizados`)
  if (fail > 0) console.log(`⚠️  ${fail} fallaron (tokens expirados? re-corre generate-tokens.js)`)
  console.log()
}

main().catch(err => { console.error('❌ ', err.message); process.exit(1) })
