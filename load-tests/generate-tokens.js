/**
 * Genera usuarios de prueba en Firebase Auth + crea su documento en /players.
 * Simula el flujo real de registro de un jugador en Turizoneando.
 *
 * Sin dependencias externas — solo Node.js nativo.
 * Uso: node generate-tokens.js
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
const COUNT      = parseInt(process.env.TEST_USER_COUNT || '200', 10)
const PASSWORD   = process.env.TEST_USER_PASSWORD       || 'LoadTest2026!'
const DOMAIN     = process.env.TEST_USER_EMAIL_DOMAIN   || 'load.test'
const OUT_FILE   = path.join(__dirname, 'data', 'tokens.csv')

if (!API_KEY)    { console.error('❌  No se encontró FIREBASE_API_KEY.'); process.exit(1) }
if (!PROJECT_ID) { console.error('❌  No se encontró FIREBASE_PROJECT_ID.'); process.exit(1) }

// ── HTTP helper ───────────────────────────────────────────────────────────────

function httpRequest(options, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : ''
    const req = https.request(
      {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          ...(options.headers || {}),
        },
      },
      (res) => {
        let data = ''
        res.on('data', c => (data += c))
        res.on('end', () => {
          try { resolve(JSON.parse(data)) }
          catch { resolve({ _raw: data }) }
        })
      }
    )
    req.on('error', reject)
    if (payload) req.write(payload)
    req.end()
  })
}

function authPost(endpoint, body) {
  return httpRequest(
    { hostname: 'identitytoolkit.googleapis.com', path: `/v1/accounts:${endpoint}?key=${API_KEY}`, method: 'POST' },
    body
  )
}

// ── Firebase Auth: crear o loguear usuario ────────────────────────────────────

async function getToken(index, retries = 5) {
  const email = `test${String(index).padStart(4, '0')}@${DOMAIN}`

  let res = await authPost('signInWithPassword', { email, password: PASSWORD, returnSecureToken: true })
  if (res.idToken) return { uid: res.localId, email, idToken: res.idToken, isNew: false }

  res = await authPost('signUp', { email, password: PASSWORD, returnSecureToken: true })
  if (res.idToken) return { uid: res.localId, email, idToken: res.idToken, isNew: true }

  if (res.error?.message?.includes('TOO_MANY_ATTEMPTS') && retries > 0) {
    const wait = (6 - retries) * 5000
    process.stdout.write(`\n⏳  Rate limit, esperando ${wait / 1000}s...`)
    await new Promise(r => setTimeout(r, wait))
    return getToken(index, retries - 1)
  }

  throw new Error(`No se pudo crear/loguear ${email}: ${JSON.stringify(res.error)}`)
}

// ── Firestore: crear documento en /players ────────────────────────────────────

const FIRST_NAMES = ['Carlos', 'María', 'José', 'Ana', 'Luis', 'Laura', 'Pedro',
  'Sofía', 'Diego', 'Valentina', 'Miguel', 'Isabella', 'Jorge', 'Camila',
  'Andrés', 'Daniela', 'Roberto', 'Gabriela', 'Fernando', 'Natalia']

const NATIONALITIES = ['DO', 'US', 'MX', 'CO', 'VE', 'PR', 'CU', 'ES', 'AR', 'PE']
const AGE_RANGES    = ['18-24', '25-34', '35-44', '45-54', '55+']
const GENDERS       = ['male', 'female', 'other']

function playerData(uid, email, index) {
  const first = FIRST_NAMES[index % FIRST_NAMES.length]
  const last  = `Test${String(index).padStart(3, '0')}`
  return {
    uid,
    displayName:   `${first} ${last}`,
    firstName:     first,
    lastName:      last,
    email,
    gender:        GENDERS[index % GENDERS.length],
    nationality:   NATIONALITIES[index % NATIONALITIES.length],
    ageRange:      AGE_RANGES[index % AGE_RANGES.length],
    preferredLang: index % 3 === 0 ? 'en' : 'es',
    emailVerified: true,
    score:         0,
    createdAt:     new Date(),
  }
}

function toFirestoreFields(obj) {
  const fields = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v instanceof Date)           fields[k] = { timestampValue: v.toISOString() }
    else if (typeof v === 'string')  fields[k] = { stringValue: v }
    else if (typeof v === 'number')  fields[k] = { integerValue: String(v) }
    else if (typeof v === 'boolean') fields[k] = { booleanValue: v }
  }
  return fields
}

async function createPlayerDoc(uid, email, idToken, index, retries = 3) {
  try {
    const res = await httpRequest(
      {
        hostname: 'firestore.googleapis.com',
        path: `/v1/projects/${PROJECT_ID}/databases/(default)/documents/players/${uid}`,
        method: 'PATCH',
        headers: { Authorization: `Bearer ${idToken}` },
      },
      { fields: toFirestoreFields(playerData(uid, email, index)) }
    )

    if (!res.name) {
      const msg = res.error?.message || ''
      // PERMISSION_DENIED en score field = doc ya existe y score > 0, ignorar
      if (!msg.includes('score') && !msg.includes('PERMISSION_DENIED')) {
        process.stdout.write('⚠')
      }
    }
  } catch (err) {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 2000))
      return createPlayerDoc(uid, email, idToken, index, retries - 1)
    }
    // No detener el proceso por un fallo de Firestore — el token CSV se guarda igual
    process.stdout.write('⚠')
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n📦  Preparando ${COUNT} jugadores de prueba en turizoneando-dev...`)
  console.log(`    Auth + Firestore /players — flujo idéntico al registro real\n`)

  const lines = ['uid,email,idToken']
  const BATCH = 5

  for (let i = 0; i < COUNT; i += BATCH) {
    const slice = Array.from({ length: Math.min(BATCH, COUNT - i) }, (_, j) => i + j + 1)

    await Promise.all(
      slice.map(async (idx) => {
        try {
          const { uid, email, idToken } = await getToken(idx)
          await createPlayerDoc(uid, email, idToken, idx)
          process.stdout.write('.')
          lines.push(`${uid},${email},${idToken}`)
        } catch (err) {
          process.stdout.write('✗')
          // Seguir con los demás usuarios aunque uno falle
        }
      })
    )

    await new Promise(r => setTimeout(r, 1200))
  }

  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true })
  fs.writeFileSync(OUT_FILE, lines.join('\n'))

  console.log(`\n\n✅  ${COUNT} jugadores listos`)
  console.log(`    • Firebase Auth: usuarios creados`)
  console.log(`    • Firestore /players: documentos creados (score: 0)`)
  console.log(`    • data/tokens.csv: tokens guardados`)
  console.log(`\n⚠️  Tokens expiran en 1 hora — re-ejecuta antes de cada sesión.\n`)
}

main().catch(err => { console.error('\n❌ ', err.message); process.exit(1) })
