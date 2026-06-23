/**
 * Descarga los IDs de paradas activas desde Firestore (REST API) y los guarda
 * en data/stops.json para que los scripts de k6 los usen.
 *
 * Sin dependencias externas — solo Node.js nativo.
 *
 * Uso: node fetch-stops.js
 * Requiere haber corrido generate-tokens.js antes (para que exista test0001).
 */

const https = require('https')
const fs    = require('fs')
const path  = require('path')

// ── Leer .env sin dotenv ──────────────────────────────────────────────────────

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
const PASSWORD   = process.env.TEST_USER_PASSWORD    || 'LoadTest2026!'
const DOMAIN     = process.env.TEST_USER_EMAIL_DOMAIN || 'load.test'

if (!API_KEY || !PROJECT_ID) {
  console.error('❌  Faltan FIREBASE_API_KEY o FIREBASE_PROJECT_ID.')
  process.exit(1)
}

// ── HTTP helper ───────────────────────────────────────────────────────────────

function request(options, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : ''
    const req = https.request(
      { ...options, headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload), ...(options.headers || {}) } },
      (res) => {
        let data = ''
        res.on('data', c => (data += c))
        res.on('end', () => resolve(JSON.parse(data)))
      }
    )
    req.on('error', reject)
    if (payload) req.write(payload)
    req.end()
  })
}

async function getIdToken() {
  const email = `test0001@${DOMAIN}`
  const res = await request(
    { hostname: 'identitytoolkit.googleapis.com', path: `/v1/accounts:signInWithPassword?key=${API_KEY}`, method: 'POST' },
    { email, password: PASSWORD, returnSecureToken: true }
  )
  if (!res.idToken) {
    throw new Error(
      `No se pudo autenticar con ${email}. ¿Corriste generate-tokens.js primero?\n` +
      JSON.stringify(res.error)
    )
  }
  return res.idToken
}

async function fetchActiveStops(idToken) {
  const res = await request(
    {
      hostname: 'firestore.googleapis.com',
      path:     `/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`,
      method:   'POST',
      headers:  { Authorization: `Bearer ${idToken}` },
    },
    {
      structuredQuery: {
        from:  [{ collectionId: 'stops' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'active' },
            op:    'EQUAL',
            value: { booleanValue: true },
          },
        },
      },
    }
  )

  return res
    .filter(r => r.document)
    .map(r => {
      const fields = r.document.fields || {}
      const id     = r.document.name.split('/').pop()
      return { id, name: fields.name_es?.stringValue || fields.name?.stringValue || id }
    })
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🗺️  Fetching active stops from ${PROJECT_ID}...`)

  const idToken = await getIdToken()
  const stops   = await fetchActiveStops(idToken)

  if (!stops.length) {
    console.error('❌  No active stops found. Run the seed function first.')
    process.exit(1)
  }

  const outFile = path.join(__dirname, 'data', 'stops.json')
  fs.mkdirSync(path.dirname(outFile), { recursive: true })
  fs.writeFileSync(outFile, JSON.stringify(stops, null, 2))

  console.log(`✅  ${stops.length} stops → data/stops.json`)
  stops.forEach(s => console.log(`    - ${s.id}: ${s.name}`))
  console.log()
}

main().catch(err => { console.error('❌ ', err.message); process.exit(1) })
